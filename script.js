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
