function iniciarCarrusel(selector, intervaloMs) {
  const imagenes = document.querySelectorAll(selector);
  let indiceActual = 0;

  setInterval(() => {
    imagenes[indiceActual].classList.remove('active');
    indiceActual = (indiceActual + 1) % imagenes.length;
    imagenes[indiceActual].classList.add('active');
  }, intervaloMs);
}

iniciarCarrusel('.device-stage .carousel-img', 3500);
iniciarCarrusel('.adapt-visual .carousel-img', 4000);
