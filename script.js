/* script.js - carrito, carga dinámica de catálogo/header/footer, búsqueda y menú móvil
   Archivo completo. Reemplaza tu script.js actual por este.
*/

/* ===========================
   Estado inicial y utilidades
   =========================== */

let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let allProducts = null;            // cache de productos.json
const SORT_STORAGE_KEY = 'catalogSortOption';
let currentSortOption = localStorage.getItem(SORT_STORAGE_KEY) || 'name-asc'; // 'name-asc' | 'price-asc' | 'price-desc'
let lastFilterCategoria = null;    // recuerda la categoría actual para re-renderizar

/* ------------------ Carrito (persistente) ------------------ */
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

/* ------------------ Referencias header ------------------ */
let carritoContainer = null;
let carritoBtn = null;
let carritoCount = null;
let carritoPopup = null;
let carritoAbiertoEnMovil = false;

/* ------------------ Actualizar UI del carrito ------------------ */
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
        <span class="carrito-nombre">${escapeHtml(p.nombre)}</span>
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

/* escape html helper */
function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]));
}

/* ------------------ Inicializar carrito (header) ------------------ */
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

    // 📱 --- MODO MÓVIL ---
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

    // 💻 --- MODO PC ---
    // 👉 En PC el clic debe redirigir directamente a la página de carrito
    window.location.href = 'carrito.html';
  });

  // 💻 --- Mostrar popup al pasar el mouse en PC ---
  carritoContainer.addEventListener('mouseenter', () => {
    if (window.innerWidth > 768) carritoPopup.classList.add('open');
  });
  carritoContainer.addEventListener('mouseleave', () => {
    if (window.innerWidth > 768) carritoPopup.classList.remove('open');
  });

  // 🧼 --- Cerrar popup si se hace clic fuera ---
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

  // 🔄 --- Restaurar estado si cambia el tamaño de ventana ---
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

/* ------------------ Expandir tarjeta ------------------ */
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

/* ------------------ Sort controls injection + indicator ------------------ */
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
      try { localStorage.setItem(SORT_STORAGE_KEY, currentSortOption); } catch(e){ }
      updateSortIndicatorText();
      cargarProductos(lastFilterCategoria);
    });
  }
}

/* ------------------ BÚSQUEDA: funciones ------------------ */

/* debounce utility */
function debounce(fn, wait = 220) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

/* decide target page según categoría */
function pageForCategory(cat) {
  if (!cat) return 'catalogo.html';
  const c = cat.toString().toLowerCase();
  if (c === 'decoracion' || c === 'decoración') return 'decoracion.html';
  if (c === 'juegos') return 'juegos.html';
  return 'catalogo.html';
}

/* inicializador de búsqueda: llama después de inyectar header */
function inicializarBusqueda() {
  const searchBtn = document.getElementById('search-btn');
  const inputContainer = document.getElementById('search-input-container');
  const searchInput = document.getElementById('search-input');
  const resultsBox = document.getElementById('search-results');

  if (!searchBtn || !inputContainer || !searchInput || !resultsBox) {
    console.warn('Elementos de búsqueda no encontrados en header.');
    return;
  }

  // abrir/cerrar con el botón
  searchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // solo en pantallas grandes (PC) abrimos
    if (window.innerWidth <= 768) return;
    const isOpen = inputContainer.classList.contains('open');
    if (isOpen) {
      closeSearch();
    } else {
      openSearch();
    }
  });

  function openSearch() {
    inputContainer.classList.add('open');
    inputContainer.setAttribute('aria-hidden', 'false');
    searchInput.focus();
    // cargar productos cache si no están
    if (!allProducts) {
      fetch('productos.json').then(r => r.json()).then(js => { allProducts = js; }).catch(()=>{});
    }
  }

  function closeSearch() {
    inputContainer.classList.remove('open');
    inputContainer.setAttribute('aria-hidden', 'true');
    resultsBox.innerHTML = '';
    searchInput.value = '';
  }

  // click fuera cierra
  document.addEventListener('click', (e) => {
    if (!inputContainer.contains(e.target) && !searchBtn.contains(e.target)) {
      closeSearch();
    }
  });

  // Esc cierra
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSearch();
    }
  });

  // render results (array of product objects)
  function renderResults(matches) {
    resultsBox.innerHTML = '';
    if (!matches || matches.length === 0) {
      resultsBox.innerHTML = `<div class="result-empty" style="padding:0.6rem; color:#666;">No hay coincidencias</div>`;
      return;
    }
    // mostramos máximo 8 resultados
    matches.slice(0, 8).forEach(prod => {
      const div = document.createElement('div');
      div.className = 'result-item';
      div.tabIndex = 0;
      div.innerHTML = `<span class="r-name">${escapeHtml(prod.nombre)}</span> <span class="cat">${escapeHtml(prod.categoria || '')}</span>`;
      // click → redirige a la página de categoría con ?expand=Nombre
      div.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const target = pageForCategory(prod.categoria);
        const url = `${target}?expand=${encodeURIComponent(prod.nombre)}`;
        window.location.href = url;
      });
      // allow Enter key to select
      div.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          div.click();
        }
      });
      resultsBox.appendChild(div);
    });
  }

  // actual search logic (case & accent-insensitive)
  function doSearch(q) {
    q = (q || '').trim();
    if (!q) {
      renderResults([]);
      return;
    }
    // ensure cache
    const ensure = allProducts ? Promise.resolve(allProducts) : fetch('productos.json').then(r => r.json()).then(js => { allProducts = js; return js; });
    ensure.then(list => {
      // filter names that include the query (normalize to remove diacritics)
      const normalized = normalizeString(q);
      const matches = list.filter(p => {
        const name = normalizeString(p.nombre || '');
        return name.includes(normalized);
      });
      // rank: startWith first, then contains
      const starts = matches.filter(p => normalizeString(p.nombre || '').startsWith(normalized));
      const contains = matches.filter(p => !normalizeString(p.nombre || '').startsWith(normalized));
      const results = starts.concat(contains);
      renderResults(results);
    }).catch(err => {
      console.error('Error buscando productos', err);
      renderResults([]);
    });
  }

  const doSearchDebounced = debounce(doSearch, 220);

  searchInput.addEventListener('input', (e) => {
    const v = e.target.value;
    doSearchDebounced(v);
  });

  // si el usuario presiona Enter en el input, elegimos la primera coincidencia
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const first = resultsBox.querySelector('.result-item');
      if (first) first.click();
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const first = resultsBox.querySelector('.result-item');
      if (first) first.focus();
    }
  });

  // keyboard navigation within results (delegation)
  resultsBox.addEventListener('keydown', (e) => {
    const current = document.activeElement;
    if (!current || !current.classList.contains('result-item')) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = current.nextElementSibling;
      if (next) next.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = current.previousElementSibling;
      if (prev) prev.focus();
      else searchInput.focus();
    }
  });

  // normalize strings: lower + remove diacritics
  function normalizeString(s) {
    return (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
}

// -------------------------
// BÚSQUEDA MÓVIL FULLSCREEN
// -------------------------
function inicializarBusquedaMovil() {
  const mobileSearchBtn = document.querySelector('.mobile-search-button');
  if (!mobileSearchBtn) {
    console.warn('inicializarBusquedaMovil: .mobile-search-button no encontrada');
    return;
  }

  if (!document.getElementById('mobile-search-overlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'mobile-search-overlay';
    overlay.innerHTML = `
      <div class="mobile-search-box" role="dialog" aria-modal="true">
        <div class="mobile-search-header">
          <input id="mobile-search-input" type="search" placeholder="Buscar productos..." autocomplete="off" />
          <button id="mobile-search-close" aria-label="Cerrar búsqueda">✖</button>
        </div>
        <div class="mobile-search-results"><ul id="mobile-search-results-list"></ul></div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  const overlay = document.getElementById('mobile-search-overlay');
  const input = document.getElementById('mobile-search-input');
  const closeBtn = document.getElementById('mobile-search-close');
  const resultsList = document.getElementById('mobile-search-results-list');

  mobileSearchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const mobileMenu = document.getElementById('mobile-menu');
    const menuOverlay = document.getElementById('menu-overlay');
    if (mobileMenu) mobileMenu.classList.remove('open');
    if (menuOverlay) menuOverlay.classList.remove('show');
    document.getElementById('hamburguesa-btn')?.classList.remove('open');

    overlay.classList.add('active');
    setTimeout(() => { input.focus(); }, 80);
  });

  overlay.addEventListener('click', (ev) => {
    if (ev.target === overlay) {
      overlay.classList.remove('active');
      input.value = '';
      resultsList.innerHTML = '';
    }
  });

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    overlay.classList.remove('active');
    input.value = '';
    resultsList.innerHTML = '';
  });

  function debounceLocal(fn, wait = 200) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function normalizeString(s) {
    return (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  const doMobileSearch = debounceLocal((q) => {
    resultsList.innerHTML = '';
    const qn = (q||'').trim();
    if (!qn) return;

    const norm = normalizeString(qn);
    const ensure = (typeof allProducts !== 'undefined' && allProducts) ? Promise.resolve(allProducts)
                    : fetch('productos.json').then(r => r.json()).then(js => { allProducts = js; return js; });

    ensure.then(list => {
      const matches = list.filter(p => normalizeString(p.nombre || '').includes(norm));
      const starts = matches.filter(p => normalizeString(p.nombre || '').startsWith(norm));
      const results = starts.concat(matches.filter(p => !normalizeString(p.nombre || '').startsWith(norm)));
      results.slice(0, 30).forEach(prod => {
        const li = document.createElement('li');
        li.textContent = prod.nombre;
        li.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const target = pageForCategory(prod.categoria);
          const url = `${target}?expand=${encodeURIComponent(prod.nombre)}`;
          overlay.classList.remove('active');
          input.value = '';
          resultsList.innerHTML = '';
          window.location.href = url;
        });
        resultsList.appendChild(li);
      });

      if (results.length === 0) {
        resultsList.innerHTML = '<li style="font-weight:600; color:#666; padding:0.8rem 1rem;">No hay coincidencias</li>';
      }
    }).catch(err => {
      console.error('Error buscando en móvil', err);
    });
  }, 180);

  input.addEventListener('input', (e) => {
    doMobileSearch(e.target.value);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      overlay.classList.remove('active');
      input.value = '';
      resultsList.innerHTML = '';
    }
    if (e.key === 'Enter') {
      const first = resultsList.querySelector('li');
      if (first) first.click();
    }
  });
}

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
          <img src="${prod.imagen || 'placeholder.jpg'}" alt="${escapeHtml(prod.nombre)}" data-original="${prod.imagen || 'placeholder.jpg'}">
        </div>

        <div class="${esJuego ? 'card-content' : 'card-content2'}">
          <div class="${esJuego ? 'inner-card' : 'inner-card2'}">
            <h2>${escapeHtml(prod.nombre)}</h2>

            <p class="short-desc">${escapeHtml(prod.descripcion || '')}</p>

            <div class="${esJuego ? 'precio' : 'precio2'}">$${(prod.precio || 0).toLocaleString()}</div>

            <div class="extra-content">
              <div class="extra-desc">
                <h3>Descripción detallada</h3>
                <p>${escapeHtml(prod.descripcionDetallada ? prod.descripcionDetallada : (prod.descripcion || ''))}</p>
                <h4 style="margin-top:0.8rem;">Detalles</h4>
                <p>${escapeHtml(prod.detalles ? prod.detalles : 'No hay detalles adicionales.')}</p>
                <p style="margin-top:0.6rem;"><strong>Unidades:</strong> ${prod.unidades || 0}</p>
              </div>

              <div class="extra-gallery" aria-hidden="true">
                ${thumbsHtml}
              </div>

              <div class="expanded-footer">
                <div class="precio-expanded">$${(prod.precio || 0).toLocaleString()}</div>
                <button class="add-to-cart-btn" data-nombre="${escapeHtml(prod.nombre)}" data-precio="${prod.precio || 0}">
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

document.addEventListener('DOMContentLoaded', () => {
  fetch('header.html')
    .then(r => r.text())
    .then(html => {
      const h = document.getElementById('header-container');
      if (h) {
        h.innerHTML = html;
        try { inicializarCarrito(); } catch (e) { console.warn('Error inicializando carrito', e); }
        try { inicializarBusqueda(); } catch (e) { /* no crítico */ }
        if (typeof inicializarMenuHamburguesa === 'function') {
          try { inicializarMenuHamburguesa(); } catch (e) { console.warn('Error iniciando menu hamburguesa', e); }
          try { inicializarBusquedaMovil(); } catch (e) { console.warn('Busqueda movil no inicializada', e); }
        }
      } else {
        console.warn('#header-container no encontrado; header no inyectado.');
      }
    })
    .catch(err => console.error('Error cargando header.html', err));

  fetch('footer.html')
    .then(r => r.text())
    .then(html => {
      const f = document.getElementById('footer-container');
      if (f) f.innerHTML = html;
    })
    .catch(err => console.error('Error cargando footer.html', err));

  cargarProductos();
});

/* ------------------ Menu hamburguesa ------------------ */
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
    // animate burger to X
    hamburguesaBtn.classList.add('open');
  });

  cerrarMenu.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    overlay.classList.remove('show');
    hamburguesaBtn.classList.remove('open');
  });

  overlay.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    overlay.classList.remove('show');
    hamburguesaBtn.classList.remove('open');
  });

  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      overlay.classList.remove('show');
      hamburguesaBtn.classList.remove('open');
    });
  });
}

/* ------------------ Carrito page (carrito.html) ------------------ */
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
          <img src="${p.imagen || 'placeholder.jpg'}" alt="${escapeHtml(p.nombre)}">
          <span class="nombre">${escapeHtml(p.nombre)}</span>
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