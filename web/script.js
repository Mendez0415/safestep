function iniciarCarrusel(selector, intervaloMs, dotsSelector) {
  const imagenes = document.querySelectorAll(selector);
  if (imagenes.length === 0) return;
  const dots = dotsSelector ? document.querySelectorAll(dotsSelector) : null;
  const hayDots = dots && dots.length === imagenes.length;
  let indiceActual = 0;

  setInterval(() => {
    imagenes[indiceActual].classList.remove('active');
    if (hayDots) dots[indiceActual].classList.remove('active');

    indiceActual = (indiceActual + 1) % imagenes.length;

    imagenes[indiceActual].classList.add('active');
    if (hayDots) dots[indiceActual].classList.add('active');
  }, intervaloMs);
}


iniciarCarrusel('.gallery-stage .carousel-img', 3500);

iniciarCarrusel('.device-stage .carousel-img', 3500);
iniciarCarrusel('.adapt-visual .carousel-img', 4000);

const menuToggle = document.querySelector('.menu-toggle');
const navlinks = document.getElementById('navlinks');

menuToggle.addEventListener('click', () => {
  navlinks.classList.toggle('open');
});



