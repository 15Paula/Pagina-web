/* script.js - carrito y carga dinámica de catálogo/header/footer
   Versión arreglada para que el popup no desaparezca al intentar clicar la X.
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
    total += p.precio;
    const item = document.createElement('div');
    item.classList.add('carrito-item');
    item.innerHTML = `
      <div class="carrito-item-info">
        <span class="carrito-nombre">${p.nombre}</span>
        <span class="carrito-precio">$${p.precio.toLocaleString()}</span>
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

  carritoBtn.addEventListener('click', () => {
  window.location.href = 'carrito.html';
  });

  if (!carritoContainer || !carritoBtn || !carritoCount || !carritoPopup) {
    console.error('Elementos del carrito no encontrados (header probablemente no cargado).');
    return;
  }

  // show/hide con pequeño delay para evitar cierres accidentales
  let hideTimeout = null;
  function showPopup() {
    if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
    carritoPopup.classList.add('open');
  }
  function hidePopup() {
    carritoPopup.classList.remove('open');
  }

  // Mantener abierto cuando el mouse esté en el contenedor o en el popup
  carritoContainer.addEventListener('mouseenter', () => {
    showPopup();
  });
  carritoContainer.addEventListener('mouseleave', () => {
    // pequeño delay para dar tiempo a mover el cursor
    hideTimeout = setTimeout(hidePopup, 180);
  });

  carritoPopup.addEventListener('mouseenter', () => {
    if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
    showPopup();
  });
  carritoPopup.addEventListener('mouseleave', () => {
    hideTimeout = setTimeout(hidePopup, 180);
  });

  // click en el botón puede también alternar (opcional): aquí solo mostramos/ocultamos
  carritoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (carritoPopup.classList.contains('open')) carritoPopup.classList.remove('open');
    else carritoPopup.classList.add('open');
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
      .forEach(prod => {
        const esJuego = prod.categoria === 'juegos';
        const card = document.createElement('div');
        card.classList.add(esJuego ? 'card' : 'card2');
        card.innerHTML = `
          <div class="card-media">
            <img src="${prod.imagen}" alt="${prod.nombre}">
          </div>
          <div class="${esJuego ? 'card-content' : 'card-content2'}">
            <div class="${esJuego ? 'inner-card' : 'inner-card2'}">
              <h2>${prod.nombre}</h2>
              <p>${prod.descripcion}</p>
              <div class="${esJuego ? 'precio' : 'precio2'}">$${prod.precio.toLocaleString()}</div>
              <button class="add-to-cart-btn" data-nombre="${prod.nombre}" data-precio="${prod.precio}">
                🛒 Añadir al carrito
              </button>
            </div>
          </div>
        `;
        contenedor.appendChild(card);
      });

    // Enlazar listeners después de insertar
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const nombre = btn.dataset.nombre;
        const precio = Number(btn.dataset.precio);
        console.log("✅ Click detectado en", nombre);
        agregarAlCarrito({ nombre, precio });
      });
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
      // donde inyectas el header en tus páginas debe existir #header-container
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

  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

  function renderCarrito() {
    lista.innerHTML = '';
    let subtotal = 0;

    if (carrito.length === 0) {
      lista.innerHTML = '<p style="text-align:center; padding:1rem;">🛍️ Tu carrito está vacío</p>';
      actualizarResumen(0);
      return;
    }

    carrito.forEach((p, index) => {
      subtotal += p.precio;
      const item = document.createElement('div');
      item.className = 'carrito-item-page';
      item.innerHTML = `
        <div class="carrito-item-info-page">
          <img src="${p.imagen || 'placeholder.jpg'}" alt="${p.nombre}">
          <span class="nombre">${p.nombre}</span>
        </div>
        <div class="carrito-item-precio">$${p.precio.toLocaleString()}</div>
        <button class="remove-btn-page" data-index="${index}">✖</button>
      `;
      lista.appendChild(item);
    });

    actualizarResumen(subtotal);
    document.querySelectorAll('.remove-btn-page').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = btn.getAttribute('data-index');
        carrito.splice(i, 1);
        localStorage.setItem('carrito', JSON.stringify(carrito));
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
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('✅ Simulación de compra completada. (Aquí iría la pasarela real)');
    localStorage.removeItem('carrito');
    window.location.href = 'index.html';
  });
}

// ejecuta al cargar
window.addEventListener('DOMContentLoaded', cargarPaginaCarrito);