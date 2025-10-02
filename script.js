async function loadHTML(id, file) {
  try {
    const response = await fetch(file);
    if (!response.ok) throw new Error(`Error al cargar ${file}`);
    const content = await response.text();
    document.getElementById(id).innerHTML = content;
  } catch (error) {
    console.error(error);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  loadHTML("header-placeholder", "header.html");
  loadHTML("footer-placeholder", "footer.html");
});

async function cargarProductos(filtroCategoria = null) {
  const res = await fetch('productos.json');
  const productos = await res.json();
  const contenedor = document.getElementById('catalogo-container');
  contenedor.innerHTML = '';

  productos
    .filter(p => !filtroCategoria || p.categoria === filtroCategoria)
    .forEach(prod => {
      const card = document.createElement('div');
      const esJuego = prod.categoria === 'juegos';

      card.classList.add(esJuego ? 'card' : 'card2');
      card.innerHTML = `
        <img src="${prod.imagen}" alt="${prod.nombre}">
        <div class="${esJuego ? 'card-content' : 'card-content2'}">
          <div class="${esJuego ? 'inner-card' : 'inner-card2'}">
            <h2>${prod.nombre}</h2>
            <p>${prod.descripcion}</p>
            <div class="${esJuego ? 'precio' : 'precio2'}">$${prod.precio}</div>
          </div>
        </div>
      `;

      contenedor.appendChild(card);
    });
}