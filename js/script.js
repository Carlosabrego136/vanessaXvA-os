// ===================== ENTER SCREEN =====================
const enterScreen = document.getElementById('enter-screen');
const enterBtn = document.getElementById('enterBtn');
const bgMusic = document.getElementById('bgMusic');
const musicBtn = document.getElementById('musicBtn');

enterBtn.addEventListener('click', () => {
  enterScreen.classList.add('hidden');
  document.body.style.overflow = 'auto';
  // Intenta reproducir música automáticamente al entrar (si hay fuente cargada)
  if (bgMusic.querySelector('source')) {
    bgMusic.play().then(() => {
      musicBtn.classList.add('playing');
    }).catch(() => {
      // el navegador bloqueó autoplay, el usuario puede darle click al botón
    });
  }
});

musicBtn.addEventListener('click', () => {
  if (!bgMusic.querySelector('source')) {
    alert('Coloca tu archivo de música en assets/audio/song.mp3 y descoméntalo en el HTML para activar el sonido.');
    return;
  }
  if (bgMusic.paused) {
    bgMusic.play();
    musicBtn.classList.add('playing');
  } else {
    bgMusic.pause();
    musicBtn.classList.remove('playing');
  }
});

// ===================== SCROLL REVEAL (Intersection Observer) =====================
const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-fade');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
    }
  });
}, { threshold: 0.18 });

revealEls.forEach(el => revealObserver.observe(el));

// ===================== PARALLAX ON IMAGES =====================
const parallaxImgs = document.querySelectorAll('[data-parallax]');

function updateParallax() {
  const vh = window.innerHeight;
  parallaxImgs.forEach(img => {
    const rect = img.parentElement.getBoundingClientRect();
    // Solo calcula si está cerca del viewport (performance)
    if (rect.bottom > -200 && rect.top < vh + 200) {
      const speed = 0.12;
      const offset = (rect.top - vh / 2) * speed;
      img.style.transform = `translateY(${offset}px)`;
    }
  });
}

window.addEventListener('scroll', updateParallax, { passive: true });
window.addEventListener('resize', updateParallax);
updateParallax();

// ===================== COUNTDOWN =====================
// Cambia esta fecha por la fecha real del evento (formato: 'YYYY-MM-DDTHH:mm:ss')
const eventDate = new Date('2025-09-27T16:00:00');

function updateCountdown() {
  const now = new Date();
  let diff = eventDate - now;

  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minsEl = document.getElementById('cd-mins');
  const secsEl = document.getElementById('cd-secs');

  if (diff <= 0) {
    daysEl.textContent = '00';
    hoursEl.textContent = '00';
    minsEl.textContent = '00';
    secsEl.textContent = '00';
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  daysEl.textContent = String(days).padStart(2, '0');
  hoursEl.textContent = String(hours).padStart(2, '0');
  minsEl.textContent = String(mins).padStart(2, '0');
  secsEl.textContent = String(secs).padStart(2, '0');
}

setInterval(updateCountdown, 1000);
updateCountdown();

// ===================== PADRINOS CAROUSEL =====================
(function () {
  const track = document.getElementById('padrinosTrack');
  const cards = track.querySelectorAll('.carousel-card');
  const prevBtn = document.getElementById('padrinosPrev');
  const nextBtn = document.getElementById('padrinosNext');
  let index = 0;

  function show(i) {
    cards.forEach(c => c.classList.remove('active'));
    index = (i + cards.length) % cards.length;
    cards[index].classList.add('active');
  }

  prevBtn.addEventListener('click', () => show(index - 1));
  nextBtn.addEventListener('click', () => show(index + 1));
})();

// ===================== STORY CAROUSEL =====================
(function () {
  const slides = document.querySelectorAll('.story-slide');
  const prevBtn = document.getElementById('storyPrev');
  const nextBtn = document.getElementById('storyNext');
  let index = 0;

  function show(i) {
    slides.forEach(s => s.classList.remove('active'));
    index = (i + slides.length) % slides.length;
    slides[index].classList.add('active');
  }

  prevBtn.addEventListener('click', () => show(index - 1));
  nextBtn.addEventListener('click', () => show(index + 1));
})();

// ===================== LANGUAGE TOGGLE (placeholder) =====================
// Nota: el sitio ya está completo en inglés. Si más adelante quieres
// una versión ES, se puede duplicar el contenido y alternar con este botón.
document.querySelectorAll('.lang-toggle span').forEach(span => {
  span.addEventListener('click', function () {
    document.querySelectorAll('.lang-toggle span').forEach(s => s.classList.remove('active'));
    this.classList.add('active');
  });
});

// ===================== DESTELLOS FLOTANTES (bosque encantado) =====================
// Agrega una capa de "luciérnagas" doradas a las secciones con foto grande
function addSparkleLayer(container, count = 14) {
  const layer = document.createElement('div');
  layer.className = 'sparkle-layer';
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = 'sparkle';
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 100 + '%';
    s.style.animationDelay = (Math.random() * 4) + 's';
    s.style.animationDuration = (3 + Math.random() * 2.5) + 's';
    layer.appendChild(s);
  }
  container.style.position = container.style.position || 'relative';
  container.appendChild(layer);
}

document.querySelectorAll('#hero, #countdown, #verse, .photo-divider, .photo-overlay-section').forEach(el => {
  const isItinerary = el.id === 'itinerary';
  addSparkleLayer(el, isItinerary ? 22 : 12);
});

// ===================== BRILLO QUE SIGUE AL SCROLL =====================
// Cada vez que el usuario hace scroll (con el dedo o el mouse), aparece
// un destello suave y breve, como si dejara un rastro de luz.
let lastGlow = 0;
function spawnScrollGlow() {
  const now = Date.now();
  if (now - lastGlow < 220) return; // limita la frecuencia para que sea sutil
  lastGlow = now;

  const glow = document.createElement('div');
  glow.className = 'scroll-glow';
  const x = window.innerWidth * (0.15 + Math.random() * 0.7);
  const y = window.innerHeight * (0.2 + Math.random() * 0.6);
  glow.style.left = x + 'px';
  glow.style.top = y + 'px';
  document.body.appendChild(glow);

  setTimeout(() => glow.remove(), 1200);
}

window.addEventListener('scroll', spawnScrollGlow, { passive: true });
