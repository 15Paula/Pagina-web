/* script.js - carrito, carga dinámica de catálogo/header/footer
   + expansión en flujo de tarjetas (una a la vez)
   + galería horizontal en modo expandido (reemplaza imagen principal solo en expanded)
*/

// --- Estado del carrito (persistente) ---
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

// -------------------- FUNCIONES DEL CARRITO --------------------
function guardarCarrito() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarCarritoUI();
}

function agregarAlCarrito(producto) {
  carrito.push(producto);
  guardarCarrito();
}

function eliminarDelCarrito(index) {
  carrito.splice(index, 1);
  guardarCarrito();
}

// referencias del DOM (serán inicializadas por inicializarCarrito)
let carritoContainer = null;
let carritoBtn = null;
let carritoCount = null;
let carritoPopup = null;

// Actualiza UI del popup y contador (seguro para llamar aunque header no exista aún)
function actualizarCarritoUI() {
  if (!carritoCount || !carritoPopup) return; // si header aún no cargó
  carritoCount.textContent = carrito.length;

  carritoPopup.innerHTML = '';

  if (carrito.length === 0) {
    carritoPopup.innerHTML = '<p class="empty-cart">Carrito vacío 🛍️</p>';
    return;
  }

  let total = 0;
  carrito.forEach((p, index) => {
    total += p.precio || 0;
    const item = document.createElement('div');
    item.classList.add('carrito-item');
    item.innerHTML = `
      <div class="carrito-item-info">
        <span class="carrito-nombre">${p.nombre}</span>
        <span class="carrito-precio">$${(p.precio || 0).toLocaleString()}</span>
      </div>
      <button class="remove-btn" data-index="${index}" title="Eliminar">✖️</button>
    `;
    carritoPopup.appendChild(item);
  });

  const totalDiv = document.createElement('div');
  totalDiv.classList.add('carrito-total');
  totalDiv.innerHTML = `<strong>Total:</strong> <span>$${total.toLocaleString()}</span>`;
  carritoPopup.appendChild(totalDiv);

  // Activar listeners de eliminar (se vuelven a crear cada vez)
  carritoPopup.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // importante: no propagar
      const idx = Number(btn.dataset.index);
      eliminarDelCarrito(idx);
    });
  });
}

// Inicializa referencias del header y controla el show/hide del popup con mouseenter/leave
function inicializarCarrito() {
  // Buscar elementos en header (ya inyectado)
  carritoContainer = document.querySelector('.carrito-container');
  carritoBtn = document.getElementById('carrito-btn');
  carritoCount = document.getElementById('carrito-count');
  carritoPopup = document.getElementById('carrito-popup');

  // Si no existen elementos (por ejemplo en admin.html) salimos
  if (!carritoContainer || !carritoBtn || !carritoCount || !carritoPopup) {
    console.warn('Elementos del carrito no encontrados (header probablemente no cargado).');
    return;
  }

  // CLICK en el botón del carrito REDIRIGE a la página carrito
  carritoBtn.addEventListener('click', () => {
    window.location.href = 'carrito.html';
  });

  // show/hide con pequeño delay para evitar cierres accidentales (hover behavior)
  let hideTimeout = null;
  function showPopup() {
    if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
    carritoPopup.classList.add('open');
  }
  function hidePopup() {
    carritoPopup.classList.remove('open');
  }

  carritoContainer.addEventListener('mouseenter', () => {
    showPopup();
  });
  carritoContainer.addEventListener('mouseleave', () => {
    hideTimeout = setTimeout(hidePopup, 180);
  });

  carritoPopup.addEventListener('mouseenter', () => {
    if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
    showPopup();
  });
  carritoPopup.addEventListener('mouseleave', () => {
    hideTimeout = setTimeout(hidePopup, 180);
  });

  // cerrar popup si se hace click fuera (comodidad)
  document.addEventListener('click', (e) => {
    if (!carritoContainer.contains(e.target)) {
      carritoPopup.classList.remove('open');
    }
  });

  // Actualizar UI con estado actual del carrito
  actualizarCarritoUI();
}

// -------------------- CARGA DE PRODUCTOS DINÁMICA --------------------
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

        // TEMPLATE: tarjeta con close button y extra-content (oculto inicialmente)
        // NOTA: extra-gallery contendrá la principal + extra images
        const imgs = [];
        if (prod.imagen) imgs.push(prod.imagen);
        if (Array.isArray(prod.imagenesExtra) && prod.imagenesExtra.length) {
          prod.imagenesExtra.forEach(i => {
            if (i && !imgs.includes(i)) imgs.push(i);
          });
        }

        // Construir miniaturas HTML
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
        // obtener el producto desde dataset nombre / precio y la imagen actual mostrada en la tarjeta
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

// -------------------- CARGA DINÁMICA HEADER/FOOTER Y ARRANQUE --------------------
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

// ──────────────── PÁGINA DE CARRITO ────────────────
function cargarPaginaCarrito() {
  const lista = document.getElementById('carrito-lista');
  if (!lista) return; // si no estamos en carrito.html

  let carritoLocal = JSON.parse(localStorage.getItem('carrito')) || [];
  // mantener referencia local para renderizado dentro de esta función
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
      subtotal += p.precio || 0;
      const item = document.createElement('div');
      item.className = 'carrito-item-page';
      item.innerHTML = `
        <div class="carrito-item-info-page">
          <img src="${p.imagen || 'placeholder.jpg'}" alt="${p.nombre}">
          <span class="nombre">${p.nombre}</span>
        </div>
        <div class="carrito-item-precio">$${(p.precio || 0).toLocaleString()}</div>
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
    document.getElementById('subtotal').textContent = `$${subtotal.toLocaleString()}`;
    document.getElementById('impuestos').textContent = `$${impuestos.toLocaleString()}`;
    document.getElementById('total').textContent = `$${total.toLocaleString()}`;
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

// ejecuta al cargar la página (si es carrito.html)
window.addEventListener('DOMContentLoaded', cargarPaginaCarrito);