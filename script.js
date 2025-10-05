
/* ===========================
   Estado inicial y utilidades
   =========================== */

let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

/* Guardar carrito en localStorage y actualizar UI del header (si existe) */
function guardarCarrito() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarCarritoUI();
}

/* Agregar producto al carrito (objeto con {nombre, precio, imagen?}) */
function agregarAlCarrito(producto) {
  carrito.push(producto);
  guardarCarrito();
}

/* Eliminar producto por índice */
function eliminarDelCarrito(index) {
  carrito.splice(index, 1);
  guardarCarrito();
}

/* ===========================
   Referencias DOM del header
   (se inicializan en inicializarCarrito)
   =========================== */

let carritoContainer = null;
let carritoBtn = null;
let carritoCount = null;
let carritoPopup = null;

/* Flag para control móvil: primer toque abre, segundo toque redirige */
let carritoAbiertoEnMovil = false;

/* ===========================
   Actualizar UI del popup y contador
   =========================== */

function actualizarCarritoUI() {
  // Si el header no está inyectado todavía, salimos (se actualizará cuando se inicialice)
  if (!carritoCount || !carritoPopup) return;

  // contador
  carritoCount.textContent = carrito.length;

  // limpiar popup
  carritoPopup.innerHTML = '';

  if (carrito.length === 0) {
    carritoPopup.innerHTML = '<p class="empty-cart">Carrito vacío 🛍️</p>';
    return;
  }

  let total = 0;

  carrito.forEach((p, index) => {
    const precio = Number(p.precio) || 0;
    total += precio;

    const item = document.createElement('div');
    item.classList.add('carrito-item');
    item.innerHTML = `
      <div class="carrito-item-info">
        <span class="carrito-nombre">${p.nombre}</span>
        <span class="carrito-precio">$${precio.toLocaleString()}</span>
      </div>
      <button class="remove-btn" data-index="${index}" title="Eliminar">✖️</button>
    `;
    carritoPopup.appendChild(item);
  });

  const totalDiv = document.createElement('div');
  totalDiv.classList.add('carrito-total');
  totalDiv.innerHTML = `<strong>Total:</strong> <span>$${total.toLocaleString()}</span>`;
  carritoPopup.appendChild(totalDiv);

  // listeners de eliminar (se recrean cada vez que actualizamos)
  carritoPopup.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // muy importante: no cerrar popup ni propagar
      const idx = Number(btn.dataset.index);
      eliminarDelCarrito(idx);
    });
  });
}

/* ===========================
   Inicializar carrito (header)
   =========================== */

function inicializarCarrito() {
  // Obtener referencias del header inyectado
  carritoContainer = document.querySelector('.carrito-container');
  carritoBtn = document.getElementById('carrito-btn');
  carritoCount = document.getElementById('carrito-count');
  carritoPopup = document.getElementById('carrito-popup');

  // Si no existen elementos, salimos (por ejemplo en admin.html donde no usas header)
  if (!carritoContainer || !carritoBtn || !carritoCount || !carritoPopup) {
    console.warn('Elementos del carrito no encontrados (header probablemente no cargado).');
    return;
  }

  // --- COMPORTAMIENTO ESPECIAL PARA MÓVIL ---
  // click en el botón del carrito:
  // - en móvil (<=768px): primer toque muestra popup y cambia texto del botón;
  //   segundo toque redirige a carrito.html
  // - en desktop: alterna popup (manteniendo el comportamiento hover)
  carritoBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    // si estamos en móvil (o pantalla estrecha)
    if (window.innerWidth <= 768) {
      if (!carritoAbiertoEnMovil) {
        // Primer toque: mostrar popup y transformar el botón
        carritoPopup.classList.add('open');
        carritoBtn.classList.add('ver-carrito-activo');
        // Cambiamos el contenido visible del botón para que diga "Ver carrito completo"
        // Si tu botón contiene icono junto al contador, conserva el contador y añade texto.
        // Para ser conservador, solo añadimos texto al final.
        carritoBtn.dataset.originalText = carritoBtn.innerHTML; // guardamos versión original
        carritoBtn.innerHTML = `🛒 Ver carrito completo <span id="carrito-count">${carrito.length}</span>`;
        carritoAbiertoEnMovil = true;
        return;
      } else {
        // Segundo toque: redirigir a la página de carrito
        window.location.href = 'carrito.html';
        return;
      }
    }

    // En pantallas grandes (desktop), el click alternará el popup (como ya hacía antes)
    if (carritoPopup.classList.contains('open')) {
      carritoPopup.classList.remove('open');
    } else {
      carritoPopup.classList.add('open');
    }
  });

  // Hover behavior (solo desktop): mostrar/ocultar popup al pasar el mouse
  // Esto hará que en desktop funcione con hover y click (click alterna también)
  carritoContainer.addEventListener('mouseenter', () => {
    if (window.innerWidth > 768) {
      if (carritoPopup) carritoPopup.classList.add('open');
    }
  });
  carritoContainer.addEventListener('mouseleave', () => {
    if (window.innerWidth > 768) {
      if (carritoPopup) carritoPopup.classList.remove('open');
    }
  });

  // Si el usuario hace click fuera del carrito, cerramos popup y restauramos estado móvil
  document.addEventListener('click', (e) => {
    // si no existe contenedor, salimos
    if (!carritoContainer) return;

    // si el click no está dentro del carritoContainer, cerramos
    if (!carritoContainer.contains(e.target)) {
      if (carritoPopup) carritoPopup.classList.remove('open');
      // si estábamos en modo móvil y el botón había cambiado, restauramos
      if (carritoAbiertoEnMovil) {
        carritoAbiertoEnMovil = false;
        carritoBtn.classList.remove('ver-carrito-activo');
        // restaurar texto original si lo guardamos
        if (carritoBtn.dataset.originalText) {
          carritoBtn.innerHTML = carritoBtn.dataset.originalText;
        } else {
          // fallback: poner icono y contador
          carritoBtn.innerHTML = `🛒 <span id="carrito-count">${carrito.length}</span>`;
        }
      }
    }
  });

  // Cuando se redimensiona la ventana, restauramos el estado si se pasa a desktop
  window.addEventListener('resize', () => {
    // cerrar popup en resize y restaurar botón si necesario
    if (carritoPopup) carritoPopup.classList.remove('open');
    if (window.innerWidth > 768) {
      carritoAbiertoEnMovil = false;
      carritoBtn.classList.remove('ver-carrito-activo');
      if (carritoBtn.dataset.originalText) {
        carritoBtn.innerHTML = carritoBtn.dataset.originalText;
      } else {
        carritoBtn.innerHTML = `🛒 <span id="carrito-count">${carrito.length}</span>`;
      }
    }
  });

  // Inicializar UI con estado actual del carrito
  actualizarCarritoUI();
}

/* ===========================
   Carga dinámica de productos
   =========================== */

async function cargarProductos(filtroCategoria = null) {
  try {
    const res = await fetch('productos.json');
    const productos = await res.json();
    const contenedor = document.getElementById('catalogo-container');
    if (!contenedor) return; // no estamos en página catálogo
    contenedor.innerHTML = '';

    productos
      .filter(p => !filtroCategoria || p.categoria === filtroCategoria)
      .forEach((prod, prodIndex) => {
        const esJuego = prod.categoria === 'juegos';
        const card = document.createElement('div');
        card.classList.add(esJuego ? 'card' : 'card2');

        // Construimos la lista de imágenes: principal + extras (evitamos duplicados)
        const imgs = [];
        if (prod.imagen) imgs.push(prod.imagen);
        if (Array.isArray(prod.imagenesExtra) && prod.imagenesExtra.length) {
          prod.imagenesExtra.forEach(i => {
            if (i && !imgs.includes(i)) imgs.push(i);
          });
        }

        // Miniaturas HTML para la galería (usadas en expandido)
        const thumbsHtml = imgs.map((src, idx) => {
          return `<img class="thumb" data-src="${src}" src="${src}" alt="thumb-${idx}">`;
        }).join('');

        card.innerHTML = `
          <div class="card-media">
            <img src="${prod.imagen || 'placeholder.jpg'}" alt="${prod.nombre}" data-original="${prod.imagen || 'placeholder.jpg'}">
          </div>

          <div class="${esJuego ? 'card-content' : 'card-content2'}">
            <div class="${esJuego ? 'inner-card' : 'inner-card2'}">
              <h2>${prod.nombre}</h2>

              <!-- Descripción corta visible en modo colapsado -->
              <p class="short-desc">${prod.descripcion || ''}</p>

              <!-- precio (visible en modo normal; ocultamos en modo expandido) -->
              <div class="${esJuego ? 'precio' : 'precio2'}">$${(prod.precio || 0).toLocaleString()}</div>

              <!-- contenido extra que aparece cuando la tarjeta está expandida -->
              <div class="extra-content">
                <div class="extra-desc">
                  <h3>Descripción detallada</h3>
                  <p>${prod.descripcionDetallada ? prod.descripcionDetallada : (prod.descripcion || '')}</p>
                  <h4 style="margin-top:0.8rem;">Detalles</h4>
                  <p>${prod.detalles ? prod.detalles : 'No hay detalles adicionales.'}</p>
                  <p style="margin-top:0.6rem;"><strong>Unidades:</strong> ${prod.unidades || 0}</p>
                </div>

                <!-- GALERÍA: principal + extras (solo en expandido) -->
                <div class="extra-gallery" aria-hidden="true">
                  ${thumbsHtml}
                </div>

                <!-- footer dentro del extra-content con precio y único botón añadir -->
                <div class="expanded-footer">
                  <div class="precio-expanded">$${(prod.precio || 0).toLocaleString()}</div>
                  <button class="add-to-cart-btn" data-nombre="${prod.nombre}" data-precio="${prod.precio || 0}">
                    🛒 Añadir al carrito
                  </button>
                </div>
              </div>

            </div>
          </div>

          <button class="close-btn" aria-label="Cerrar">✖</button>
        `;

        contenedor.appendChild(card);
      });

    /* ----------------- AFTER INSERT: BIND EVENTS ----------------- */

    // A) botones añadir al carrito (evitar propagación para que no expandan la tarjeta)
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // evita que el click en el botón expanda la tarjeta
        const card = btn.closest('.card, .card2');
        const nombre = btn.dataset.nombre;
        const precio = Number(btn.dataset.precio);
        const imgEl = card.querySelector('.card-media img');
        const imagenActual = (imgEl && imgEl.getAttribute('src')) ? imgEl.getAttribute('src') : '';
        agregarAlCarrito({ nombre, precio, imagen: imagenActual });
      });
    });

    // B) lógica de expansión / contraer tarjetas (una a la vez)
    const cards = document.querySelectorAll('.card, .card2');
    cards.forEach(card => {
      // click en la tarjeta expande (si no está expandida)
      card.addEventListener('click', (e) => {
        // si el click vino desde dentro de un botón / link lo ignoramos
        if (e.target.closest('button') || e.target.tagName === 'A' || e.target.closest('.add-to-cart-btn')) return;

        // si ya está expandida, nada (cerrar desde el botón)
        if (card.classList.contains('expanded')) return;

        // contraer cualquier otra expandida
        document.querySelectorAll('.card.expanded, .card2.expanded').forEach(other => {
          // antes de contraer, restaurar la imagen principal al original
          const mainImgOther = other.querySelector('.card-media img');
          if (mainImgOther && mainImgOther.dataset && mainImgOther.dataset.original) {
            mainImgOther.setAttribute('src', mainImgOther.dataset.original);
          }
          other.classList.remove('expanded');
        });

        // expandir esta
        card.classList.add('expanded');

        // al expandir, asegurarnos que la imagen grande sea la original (no una miniatura previa)
        const mainImg = card.querySelector('.card-media img');
        if (mainImg && mainImg.dataset && mainImg.dataset.original) {
          mainImg.setAttribute('src', mainImg.dataset.original);
        }

        // manejar miniaturas: marcar como seleccionada la que coincide con original
        const thumbs = Array.from(card.querySelectorAll('.extra-gallery img'));
        thumbs.forEach(t => t.classList.remove('selected'));
        const originalSrc = card.querySelector('.card-media img').dataset.original;
        const match = thumbs.find(t => t.dataset.src === originalSrc || t.getAttribute('src') === originalSrc);
        if (match) match.classList.add('selected');
        else if (thumbs[0]) thumbs[0].classList.add('selected');

        // opción: scrollear suavemente para centrar un poco en viewport
        setTimeout(() => {
          const rect = card.getBoundingClientRect();
          if (rect.top < 0 || rect.bottom > (window.innerHeight || document.documentElement.clientHeight)) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 120);
      });

      // close button dentro de la card
      const closeBtn = card.querySelector('.close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          // restaurar imagen principal al original antes de cerrar
          const mainImg = card.querySelector('.card-media img');
          if (mainImg && mainImg.dataset && mainImg.dataset.original) {
            mainImg.setAttribute('src', mainImg.dataset.original);
          }
          card.classList.remove('expanded');
        });
      }

      // C) thumbnails: delegación por card
      const gallery = card.querySelector('.extra-gallery');
      if (gallery) {
        // seleccionar thumbnails
        gallery.querySelectorAll('img').forEach(thumb => {
          // stop propagation & click handler
          thumb.addEventListener('click', (ev) => {
            ev.stopPropagation();
            // solo actúa si la tarjeta está expandida
            if (!card.classList.contains('expanded')) return;
            const src = thumb.dataset.src || thumb.getAttribute('src');
            const mainImg = card.querySelector('.card-media img');
            if (!mainImg) return;

            // visual: seleccion
            gallery.querySelectorAll('img').forEach(t => t.classList.remove('selected'));
            thumb.classList.add('selected');

            // animación: fade out -> change src -> fade in
            mainImg.style.opacity = '0';
            // cuando cargue la nueva imagen, hacer fade in
            mainImg.onload = () => {
              // small delay to avoid flicker
              setTimeout(() => mainImg.style.opacity = '1', 30);
            };
            mainImg.setAttribute('src', src);
          });
        });
      }
    });

  } catch (err) {
    console.error('Error cargando productos.json:', err);
  }
}

/* ===========================
   Carga dinámica header/footer y arranque
   =========================== */

document.addEventListener('DOMContentLoaded', () => {
  // header
  fetch('header.html')
    .then(r => r.text())
    .then(html => {
      const h = document.getElementById('header-container');
      if (h) {
        h.innerHTML = html;
        // inicializamos carrito una vez el header esté presente en DOM
        inicializarCarrito();

        // inicializar menu hamburguesa si está definido en header
        if (typeof inicializarMenuHamburguesa === 'function') {
          try { inicializarMenuHamburguesa(); } catch (e) { console.warn('Error iniciando menu hamburguesa', e); }
        }
      } else {
        console.warn('#header-container no encontrado; header no inyectado.');
      }
    })
    .catch(err => console.error('Error cargando header.html', err));

  // footer
  fetch('footer.html')
    .then(r => r.text())
    .then(html => {
      const f = document.getElementById('footer-container');
      if (f) f.innerHTML = html;
    })
    .catch(err => console.error('Error cargando footer.html', err));

  // productos: intenta cargar catálogo si existe contenedor
  cargarProductos();
});

/* ===========================
   Menu hamburguesa: función que será llamada tras inyectar header
   =========================== */

function inicializarMenuHamburguesa() {
  const hamburguesaBtn = document.getElementById('hamburguesa-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const cerrarMenu = document.getElementById('cerrar-menu');
  const overlay = document.getElementById('menu-overlay');

  if (!hamburguesaBtn || !mobileMenu || !cerrarMenu || !overlay) {
    // no es crítico; simplemente el header no tiene los elementos esperados
    console.warn('⚠️ Elementos del menú móvil no encontrados');
    return;
  }

  hamburguesaBtn.addEventListener('click', () => {
    mobileMenu.classList.add('open');
    overlay.classList.add('show');
  });

  cerrarMenu.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    overlay.classList.remove('show');
  });

  overlay.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    overlay.classList.remove('show');
  });

  // cerrar al clicar en uno de los enlaces del menú mobile (navegación)
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      overlay.classList.remove('show');
    });
  });
}

/* ===========================
   Página de carrito (carrito.html) - renderizado del listado y checkout
   =========================== */

function cargarPaginaCarrito() {
  const lista = document.getElementById('carrito-lista');
  if (!lista) return; // si no estamos en carrito.html

  let carritoLocal = JSON.parse(localStorage.getItem('carrito')) || [];
  // referencia local para renderizado dentro de esta función
  let carritoLocalCopy = carritoLocal;

  function renderCarrito() {
    lista.innerHTML = '';
    let subtotal = 0;

    if (carritoLocalCopy.length === 0) {
      lista.innerHTML = '<p style="text-align:center; padding:1rem;">🛍️ Tu carrito está vacío</p>';
      actualizarResumen(0);
      return;
    }

    carritoLocalCopy.forEach((p, index) => {
      subtotal += Number(p.precio) || 0;
      const item = document.createElement('div');
      item.className = 'carrito-item-page';
      item.innerHTML = `
        <div class="carrito-item-info-page">
          <img src="${p.imagen || 'placeholder.jpg'}" alt="${p.nombre}">
          <span class="nombre">${p.nombre}</span>
        </div>
        <div class="carrito-item-precio">$${(Number(p.precio) || 0).toLocaleString()}</div>
        <button class="remove-btn-page" data-index="${index}">✖</button>
      `;
      lista.appendChild(item);
    });

    actualizarResumen(subtotal);

    document.querySelectorAll('.remove-btn-page').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = Number(btn.getAttribute('data-index'));
        carritoLocalCopy.splice(i, 1);
        localStorage.setItem('carrito', JSON.stringify(carritoLocalCopy));
        // actualizar global carrito para mantener consistencia con header popup
        carrito = carritoLocalCopy.slice();
        renderCarrito();
        actualizarCarritoUI(); // actualiza icono en header
      });
    });
  }

  function actualizarResumen(subtotal) {
    const impuestos = subtotal * 0.19;
    const total = subtotal + impuestos;
    const subtotalEl = document.getElementById('subtotal');
    const impuestosEl = document.getElementById('impuestos');
    const totalEl = document.getElementById('total');
    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toLocaleString()}`;
    if (impuestosEl) impuestosEl.textContent = `$${impuestos.toLocaleString()}`;
    if (totalEl) totalEl.textContent = `$${total.toLocaleString()}`;
  }

  renderCarrito();

  // manejar envío del formulario (solo mostrar mensaje por ahora)
  const form = document.getElementById('checkoutForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('✅ Simulación de compra completada. (Aquí iría la pasarela real)');
      localStorage.removeItem('carrito');
      carrito = [];
      actualizarCarritoUI();
      window.location.href = 'index.html';
    });
  }
}

/* cuando se cargue la página, ejecutamos la función para la página carrito si corresponde */
window.addEventListener('DOMContentLoaded', cargarPaginaCarrito);