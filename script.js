/* script.js - Versión completa con búsqueda (desktop + móvil), carrito, carga dinámica, orden, expandir tarjetas y menú hamburguesa.
   Reemplaza por completo tu script.js con este.
*/

/* ===========================
   Estado y cache
   =========================== */
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let allProducts = null;            // cache de productos.json
const SORT_STORAGE_KEY = 'catalogSortOption';
let currentSortOption = localStorage.getItem(SORT_STORAGE_KEY) || 'name-asc';
let lastFilterCategoria = null;

/* ===========================
   Utilidades carrito
   =========================== */
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

/* ===========================
   Referencias header/carrito
   =========================== */
let carritoContainer = null;
let carritoBtn = null;
let carritoCount = null;
let carritoPopup = null;
let carritoAbiertoEnMovil = false;

/* ===========================
   Actualizar UI carrito
   =========================== */
function actualizarCarritoUI() {
  if (!carritoCount || !carritoPopup) return;
  carritoCount.textContent = carrito.length;
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

  carritoPopup.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = Number(btn.dataset.index);
      eliminarDelCarrito(idx);
    });
  });
}

/* ===========================
   Inicializar carrito (header)
   =========================== */
function inicializarCarrito() {
  carritoContainer = document.querySelector('.carrito-container');
  carritoBtn = document.getElementById('carrito-btn');
  carritoCount = document.getElementById('carrito-count');
  carritoPopup = document.getElementById('carrito-popup');

  if (!carritoContainer || !carritoBtn || !carritoCount || !carritoPopup) {
    console.warn('Elementos del carrito no encontrados (header probablemente no cargado).');
    return;
  }

  carritoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.innerWidth <= 768) {
      if (!carritoAbiertoEnMovil) {
        carritoPopup.classList.add('open');
        carritoBtn.classList.add('ver-carrito-activo');
        carritoBtn.dataset.originalText = carritoBtn.innerHTML;
        carritoBtn.innerHTML = `🛒 Ver carrito completo <span id="carrito-count">${carrito.length}</span>`;
        carritoAbiertoEnMovil = true;
        return;
      } else {
        window.location.href = 'carrito.html';
        return;
      }
    }
    if (carritoPopup.classList.contains('open')) carritoPopup.classList.remove('open');
    else carritoPopup.classList.add('open');
  });

  carritoContainer.addEventListener('mouseenter', () => {
    if (window.innerWidth > 768) carritoPopup.classList.add('open');
  });
  carritoContainer.addEventListener('mouseleave', () => {
    if (window.innerWidth > 768) carritoPopup.classList.remove('open');
  });

  document.addEventListener('click', (e) => {
    if (!carritoContainer) return;
    if (!carritoContainer.contains(e.target)) {
      if (carritoPopup) carritoPopup.classList.remove('open');
      if (carritoAbiertoEnMovil) {
        carritoAbiertoEnMovil = false;
        carritoBtn.classList.remove('ver-carrito-activo');
        if (carritoBtn.dataset.originalText) {
          carritoBtn.innerHTML = carritoBtn.dataset.originalText;
        } else {
          carritoBtn.innerHTML = `🛒 <span id="carrito-count">${carrito.length}</span>`;
        }
      }
    }
  });

  window.addEventListener('resize', () => {
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

  actualizarCarritoUI();
}

/* ===========================
   Expandir/contraer tarjetas
   =========================== */
function expandCard(card) {
  if (!card) return;

  document.querySelectorAll('.card.expanded, .card2.expanded').forEach(other => {
    if (other === card) return;
    const mainImgOther = other.querySelector('.card-media img');
    if (mainImgOther && mainImgOther.dataset && mainImgOther.dataset.original) {
      mainImgOther.setAttribute('src', mainImgOther.dataset.original);
    }
    other.classList.remove('expanded');
  });

  card.classList.add('expanded');

  const mainImg = card.querySelector('.card-media img');
  if (mainImg && mainImg.dataset && mainImg.dataset.original) {
    mainImg.setAttribute('src', mainImg.dataset.original);
  }

  const thumbs = Array.from(card.querySelectorAll('.extra-gallery img'));
  thumbs.forEach(t => t.classList.remove('selected'));
  const originalSrc = card.querySelector('.card-media img')?.dataset.original;
  if (originalSrc) {
    const match = thumbs.find(t => t.dataset.src === originalSrc || t.getAttribute('src') === originalSrc);
    if (match) match.classList.add('selected');
    else if (thumbs[0]) thumbs[0].classList.add('selected');
  } else if (thumbs[0]) {
    thumbs[0].classList.add('selected');
  }

  setTimeout(() => {
    const rect = card.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > (window.innerHeight || document.documentElement.clientHeight)) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 120);
}

/* ===========================
   Orden & controls (inserted when catalog present)
   =========================== */
function humanReadableSortName(option) {
  switch(option) {
    case 'price-asc': return 'Precio (menor → mayor)';
    case 'price-desc': return 'Precio (mayor → menor)';
    default: return 'Nombre (A → Z)';
  }
}
function updateSortIndicatorText() {
  const indicator = document.getElementById('sort-indicator');
  if (!indicator) return;
  indicator.textContent = `Ordenado por: ${humanReadableSortName(currentSortOption)}`;
}
function insertSortControlsIfNeeded() {
  const contenedor = document.getElementById('catalogo-container');
  if (!contenedor) return;
  if (document.getElementById('sort-controls')) return;

  const wrapper = document.createElement('div');
  wrapper.id = 'sort-controls';
  wrapper.className = 'sort-controls-wrapper';
  wrapper.innerHTML = `
    <div class="sort-left" aria-hidden="true"></div>
    <div class="sort-right">
      <label for="sort-select" class="sort-label">Ordenar:</label>
      <select id="sort-select" aria-label="Ordenar productos">
        <option value="name-asc">Nombre (A → Z)</option>
        <option value="price-asc">Precio (menor → mayor)</option>
        <option value="price-desc">Precio (mayor → menor)</option>
      </select>
      <span id="sort-indicator" class="sort-indicator" aria-live="polite"></span>
    </div>
  `;
  contenedor.parentNode.insertBefore(wrapper, contenedor);

  const select = document.getElementById('sort-select');
  if (select) {
    select.value = currentSortOption || 'name-asc';
    updateSortIndicatorText();
    select.addEventListener('change', () => {
      currentSortOption = select.value;
      try { localStorage.setItem(SORT_STORAGE_KEY, currentSortOption); } catch(e){}
      updateSortIndicatorText();
      cargarProductos(lastFilterCategoria);
    });
  }
}

/* ===========================
   BÚSQUEDA - lógica compartida
   =========================== */

let searchTimeout = null;
const SEARCH_DEBOUNCE_MS = 210;
const MAX_RESULTS = 6;

/* Asegura que allProducts esté cargado antes de buscar */
async function ensureProductsLoaded() {
  if (allProducts) return allProducts;
  try {
    const res = await fetch('productos.json');
    allProducts = await res.json();
    return allProducts;
  } catch (err) {
    console.error('Error cargando productos.json para búsqueda', err);
    return [];
  }
}

/* Filtra por nombre (case-insensitive, diacríticos permitidos) */
function performSearchSync(prodList, q) {
  if (!q) return [];
  const lowered = q.trim().toLowerCase();
  // usar localeCompare not necessary: simple includes on normalized strings
  const normalizedQ = lowered.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const matches = prodList.filter(p => {
    const name = (p.nombre || '').toString();
    const normalizedName = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalizedName.includes(normalizedQ);
  });
  return matches.slice(0, MAX_RESULTS);
}

/* Navega a la página de la categoría target con ?expand=Nombre */
function navigateToProduct(prod) {
  if (!prod || !prod.nombre) return;
  const cat = (prod.categoria || '').toLowerCase();
  let targetPage = 'catalogo.html';
  if (cat === 'juegos') targetPage = 'juegos.html';
  else if (cat === 'decoracion') targetPage = 'decoracion.html';
  const url = `${targetPage}?expand=${encodeURIComponent(prod.nombre)}`;
  window.location.href = url;
}

/* Render resultados en mini-popup (desktop) */
function renderSearchResultsPopup(results, popupEl) {
  if (!popupEl) return;
  popupEl.innerHTML = '';
  if (!results || results.length === 0) {
    popupEl.innerHTML = '<div class="search-empty">No hay coincidencias</div>';
    return;
  }
  results.forEach(r => {
    const item = document.createElement('button');
    item.className = 'search-result-item';
    item.type = 'button';
    item.textContent = r.nombre;
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateToProduct(r);
    });
    popupEl.appendChild(item);
  });
}

/* Render resultados en modal (movil) */
function renderMobileSearchResults(results, containerEl) {
  if (!containerEl) return;
  containerEl.innerHTML = '';
  if (!results || results.length === 0) {
    containerEl.innerHTML = '<div class="search-empty">No hay coincidencias</div>';
    return;
  }
  results.forEach(r => {
    const item = document.createElement('button');
    item.className = 'mobile-search-result-item';
    item.type = 'button';
    item.textContent = `${r.nombre} — ${r.categoria || ''}`;
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      // cerrar modal + mobile menu antes de navegar
      closeMobileSearchModal();
      setTimeout(() => navigateToProduct(r), 160);
    });
    containerEl.appendChild(item);
  });
}

/* ===========================
   Inicializar búsqueda (llamado tras inyectar header)
   =========================== */

function inicializarBusqueda() {
  // desktop elements
  const searchToggle = document.getElementById('search-toggle');
  const searchContainer = document.getElementById('search-container');
  const headerInput = document.getElementById('header-search-input');
  const searchPopup = document.getElementById('search-popup');

  // mobile elements
  const mobileSearchOpen = document.getElementById('mobile-search-open');
  const mobileSearchModal = document.getElementById('mobile-search-modal');
  const mobileSearchInput = document.getElementById('mobile-search-input');
  const mobileSearchResults = document.getElementById('mobile-search-results');
  const mobileSearchClose = document.getElementById('mobile-search-close');

  // Guardar elementos para cerrar al hacer click fuera
  function closeDesktopSearch() {
    if (searchContainer) {
      searchContainer.classList.remove('open');
      searchContainer.setAttribute('aria-hidden', 'true');
      if (searchPopup) searchPopup.innerHTML = '';
    }
  }

  async function handleDesktopInputChange() {
    if (!headerInput || !searchPopup) return;
    const q = headerInput.value || '';
    if (!q.trim()) {
      searchPopup.innerHTML = '';
      return;
    }
    const prods = await ensureProductsLoaded();
    const results = performSearchSync(prods, q);
    renderSearchResultsPopup(results, searchPopup);
  }

  // debounce wrapper
  function debounceDesktopSearch() {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      handleDesktopInputChange();
    }, SEARCH_DEBOUNCE_MS);
  }

  /* ===== util: ajustar posición del popup de búsqueda para evitar overflow ===== */
  function adjustSearchPopupPosition() {
    const sc = document.getElementById('search-container');
    if (!sc) return;

    // limpiamos estilos inline previos
    sc.style.left = '';
    sc.style.right = '';
    sc.style.transformOrigin = 'top right';

    // forzamos reflow para medir
    const rect = sc.getBoundingClientRect();

    // si el popup sale por la izquierda del viewport -> alinearlo a la izquierda del viewport
    if (rect.left < 8) {
      sc.style.left = '8px';
      sc.style.right = 'auto';
      sc.style.transformOrigin = 'top left';
    }

    // si el popup sale por la derecha del viewport -> mantenerlo con right:8px
    if (rect.right > (window.innerWidth - 8)) {
      sc.style.right = '8px';
      sc.style.left = 'auto';
      sc.style.transformOrigin = 'top right';
    }
  }

  // Toggle desktop search input (reemplazar la parte antigua)
  if (searchToggle && searchContainer && headerInput) {
    searchToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = searchContainer.classList.toggle('open');
      searchContainer.setAttribute('aria-hidden', isOpen ? 'false' : 'true');

      if (isOpen) {
        // mostramos y forzamos reubicación (pequeño timeout para que styles se apliquen)
        setTimeout(() => {
          adjustSearchPopupPosition();
          headerInput.focus();
        }, 60);
      } else {
        headerInput.value = '';
        if (searchPopup) searchPopup.innerHTML = '';
        // limpiamos estilos inline para volver a default
        searchContainer.style.left = '';
        searchContainer.style.right = '';
        searchContainer.style.transformOrigin = 'top right';
      }
    });

    // cuando el usuario escribe
    headerInput.addEventListener('input', (e) => {
      debounceDesktopSearch();
      // si el popup está abierto, ajustar en cada cambio por si el tamaño cambió
      setTimeout(() => adjustSearchPopupPosition(), 120);
    });

    // cerrar si clic fuera
    document.addEventListener('click', (e) => {
      const container = document.getElementById('search-container');
      if (!container) return;
      if (!container.contains(e.target) && e.target.id !== 'search-toggle') {
        // cerrar
        container.classList.remove('open');
        container.setAttribute('aria-hidden', 'true');
        if (searchPopup) searchPopup.innerHTML = '';
        container.style.left = '';
        container.style.right = '';
        container.style.transformOrigin = 'top right';
      }
    });

    // teclado: Esc cierra
    headerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchContainer.classList.remove('open');
        searchToggle.focus();
        searchContainer.style.left = '';
        searchContainer.style.right = '';
        searchContainer.style.transformOrigin = 'top right';
      }
    });

    // Ajustar al cambiar el tamaño de la ventana (desktop)
    window.addEventListener('resize', () => {
      // si está abierto, recalculamos; si no, limpiamos
      if (searchContainer.classList.contains('open')) {
        adjustSearchPopupPosition();
      } else {
        searchContainer.style.left = '';
        searchContainer.style.right = '';
        searchContainer.style.transformOrigin = 'top right';
      }
    });
  }


  /* ----------------- MOBILE SEARCH MODAL ----------------- */

  function openMobileSearchModal() {
    if (!mobileSearchModal) return;
    // close mobile menu overlay if open
    const mobileMenu = document.getElementById('mobile-menu');
    const overlay = document.getElementById('menu-overlay');
    if (mobileMenu) mobileMenu.classList.remove('open');
    if (overlay) overlay.classList.remove('show');

    mobileSearchModal.classList.add('open');
    mobileSearchModal.setAttribute('aria-hidden', 'false');
    // blur background by adding class to body
    document.body.classList.add('mobile-search-opened');

    // focus input a pequeño delay para asegurar keyboard en móvil
    setTimeout(() => {
      if (mobileSearchInput) mobileSearchInput.focus();
    }, 120);
  }

  function closeMobileSearchModal() {
    if (!mobileSearchModal) return;
    mobileSearchModal.classList.remove('open');
    mobileSearchModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('mobile-search-opened');
    if (mobileSearchInput) mobileSearchInput.value = '';
    if (mobileSearchResults) mobileSearchResults.innerHTML = '';
  }

  if (mobileSearchOpen) {
    mobileSearchOpen.addEventListener('click', (e) => {
      e.stopPropagation();
      openMobileSearchModal();
    });
  }
  if (mobileSearchClose) {
    mobileSearchClose.addEventListener('click', (e) => {
      e.stopPropagation();
      closeMobileSearchModal();
    });
  }

  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('input', async (e) => {
      if (searchTimeout) clearTimeout(searchTimeout);
      searchTimeout = setTimeout(async () => {
        const q = mobileSearchInput.value || '';
        if (!q.trim()) {
          mobileSearchResults.innerHTML = '';
          return;
        }
        const prods = await ensureProductsLoaded();
        const results = performSearchSync(prods, q);
        renderMobileSearchResults(results, mobileSearchResults);
      }, SEARCH_DEBOUNCE_MS);
    });

    // cerrar modal si tocan fuera (layout)
    mobileSearchModal.addEventListener('click', (e) => {
      if (e.target === mobileSearchModal) closeMobileSearchModal();
    });
  }

  // Aseguramos que el escape cierre el modal en móvil también
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileSearchModal();
      // also close desktop search
      const container = document.getElementById('search-container');
      if (container && container.classList.contains('open')) {
        container.classList.remove('open');
      }
    }
  });
}

/* ===========================
   Carga dinámica de productos (catalogo/juegos/decoracion)
   =========================== */
async function cargarProductos(filtroCategoria = null) {
  try {
    lastFilterCategoria = filtroCategoria;
    insertSortControlsIfNeeded();

    if (!allProducts) {
      const res = await fetch('productos.json');
      allProducts = await res.json();
    }
    let productos = (allProducts || []).slice();

    if (filtroCategoria) {
      productos = productos.filter(p => p.categoria === filtroCategoria);
    }

    // aplicar orden actual
    if (currentSortOption === 'price-asc') {
      productos.sort((a, b) => (Number(a.precio) || 0) - (Number(b.precio) || 0));
    } else if (currentSortOption === 'price-desc') {
      productos.sort((a, b) => (Number(b.precio) || 0) - (Number(a.precio) || 0));
    } else {
      productos.sort((a, b) => {
        const na = (a.nombre || '').toString();
        const nb = (b.nombre || '').toString();
        return na.localeCompare(nb, 'es', { sensitivity: 'base' });
      });
    }

    const contenedor = document.getElementById('catalogo-container');
    if (!contenedor) return;
    contenedor.innerHTML = '';
    const createdCards = [];

    productos.forEach((prod) => {
      const esJuego = prod.categoria === 'juegos';
      const card = document.createElement('div');
      card.classList.add(esJuego ? 'card' : 'card2');

      const imgs = [];
      if (prod.imagen) imgs.push(prod.imagen);
      if (Array.isArray(prod.imagenesExtra) && prod.imagenesExtra.length) {
        prod.imagenesExtra.forEach(i => { if (i && !imgs.includes(i)) imgs.push(i); });
      }

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

            <p class="short-desc">${prod.descripcion || ''}</p>

            <div class="${esJuego ? 'precio' : 'precio2'}">$${(prod.precio || 0).toLocaleString()}</div>

            <div class="extra-content">
              <div class="extra-desc">
                <h3>Descripción detallada</h3>
                <p>${prod.descripcionDetallada ? prod.descripcionDetallada : (prod.descripcion || '')}</p>
                <h4 style="margin-top:0.8rem;">Detalles</h4>
                <p>${prod.detalles ? prod.detalles : 'No hay detalles adicionales.'}</p>
                <p style="margin-top:0.6rem;"><strong>Unidades:</strong> ${prod.unidades || 0}</p>
              </div>

              <div class="extra-gallery" aria-hidden="true">
                ${thumbsHtml}
              </div>

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
      createdCards.push({ card, product: prod });
    });

    /* ------- After insert: bind events (añadir carrito, expand, thumbs, close) ------- */
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.card, .card2');
        const nombre = btn.dataset.nombre;
        const precio = Number(btn.dataset.precio);
        const imgEl = card.querySelector('.card-media img');
        const imagenActual = (imgEl && imgEl.getAttribute('src')) ? imgEl.getAttribute('src') : '';
        agregarAlCarrito({ nombre, precio, imagen: imagenActual });
      });
    });

    const cards = document.querySelectorAll('.card, .card2');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.tagName === 'A' || e.target.closest('.add-to-cart-btn')) return;
        if (card.classList.contains('expanded')) return;
        expandCard(card);
      });

      const closeBtn = card.querySelector('.close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const mainImg = card.querySelector('.card-media img');
          if (mainImg && mainImg.dataset && mainImg.dataset.original) {
            mainImg.setAttribute('src', mainImg.dataset.original);
          }
          card.classList.remove('expanded');
        });
      }

      const gallery = card.querySelector('.extra-gallery');
      if (gallery) {
        gallery.querySelectorAll('img').forEach(thumb => {
          thumb.addEventListener('click', (ev) => {
            ev.stopPropagation();
            if (!card.classList.contains('expanded')) return;
            const src = thumb.dataset.src || thumb.getAttribute('src');
            const mainImg = card.querySelector('.card-media img');
            if (!mainImg) return;
            gallery.querySelectorAll('img').forEach(t => t.classList.remove('selected'));
            thumb.classList.add('selected');

            mainImg.style.opacity = '0';
            mainImg.onload = () => { setTimeout(() => mainImg.style.opacity = '1', 30); };
            mainImg.setAttribute('src', src);
          });
        });
      }
    });

    // manejar ?expand=Nombre en la URL
    const params = new URLSearchParams(window.location.search);
    const expandParam = params.get('expand');
    if (expandParam) {
      const decoded = decodeURIComponent(expandParam);
      setTimeout(() => {
        let found = null;
        for (let item of createdCards) {
          const nameEl = item.card.querySelector('h2');
          if (nameEl && nameEl.textContent.trim() === decoded.trim()) { found = item.card; break; }
        }
        if (!found) {
          for (let item of createdCards) {
            const nameEl = item.card.querySelector('h2');
            if (nameEl && nameEl.textContent.trim().toLowerCase() === decoded.trim().toLowerCase()) { found = item.card; break; }
          }
        }
        if (found) expandCard(found);
      }, 120);
    }

    updateSortIndicatorText();

  } catch (err) {
    console.error('Error cargando productos.json:', err);
  }
}

/* ===========================
   Carga header/footer e inicialización general
   =========================== */
document.addEventListener('DOMContentLoaded', () => {
  // cargar header
  fetch('header.html')
    .then(r => r.text())
    .then(html => {
      const h = document.getElementById('header-container');
      if (h) {
        h.innerHTML = html;
        inicializarCarrito();
        if (typeof inicializarMenuHamburguesa === 'function') {
          try { inicializarMenuHamburguesa(); } catch (e) { console.warn('Error iniciando menu hamburguesa', e); }
        }
        // inicializar búsqueda (una vez header presente)
        if (typeof inicializarBusqueda === 'function') {
          try { inicializarBusqueda(); } catch (e) { console.warn('Error iniciando búsqueda', e); }
        }
      } else {
        console.warn('#header-container no encontrado; header no inyectado.');
      }
    })
    .catch(err => console.error('Error cargando header.html', err));

  // cargar footer
  fetch('footer.html')
    .then(r => r.text())
    .then(html => {
      const f = document.getElementById('footer-container');
      if (f) f.innerHTML = html;
    })
    .catch(err => console.error('Error cargando footer.html', err));

  // cargar productos si corresponde
  cargarProductos();
});

/* ===========================
   Menu hamburguesa (inicialización)
   =========================== */
function inicializarMenuHamburguesa() {
  const hamburguesaBtn = document.getElementById('hamburguesa-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const cerrarMenu = document.getElementById('cerrar-menu');
  const overlay = document.getElementById('menu-overlay');

  if (!hamburguesaBtn || !mobileMenu || !cerrarMenu || !overlay) {
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

  mobileMenu.querySelectorAll('a, button.mobile-menu-item').forEach(a => {
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      overlay.classList.remove('show');
    });
  });
}

/* ===========================
   Página carrito (carrito.html)
   =========================== */
function cargarPaginaCarrito() {
  const lista = document.getElementById('carrito-lista');
  if (!lista) return;

  let carritoLocal = JSON.parse(localStorage.getItem('carrito')) || [];
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
        carrito = carritoLocalCopy.slice();
        renderCarrito();
        actualizarCarritoUI();
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
window.addEventListener('DOMContentLoaded', cargarPaginaCarrito);