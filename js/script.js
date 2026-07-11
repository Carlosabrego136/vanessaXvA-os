// ===================== ENTER SCREEN =====================
const enterScreen = document.getElementById('enter-screen');
const enterBtn = document.getElementById('enterBtn');
const bgMusic = document.getElementById('bgMusic');
const musicBtn = document.getElementById('musicBtn');

enterBtn.addEventListener('click', () => {
  enterScreen.classList.add('hidden');
  // NOTA: NO poner aquí document.body.style.overflowY = 'auto'.
  // Un overflow-y distinto de "visible" en el <body> (aunque sea inline por JS)
  // rompe el position:sticky de las secciones .layer, que es lo que hace que
  // cada foto se quede fija mientras la siguiente la va tapando al hacer scroll.
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

// ===================== REVEAL ANTICIPADO (solo calendario y padrinos) =====================
// Mismo sistema de arriba, pero dispara un poco antes de que el elemento
// llegue realmente a la pantalla (rootMargin extiende el área hacia abajo).
// No toca el scroll ni el sistema de capas sticky, solo adelanta el
// momento en el que aparece el contenido (números del countdown y la
// tarjeta de padrinos/sponsors) para que no quede tanto espacio de puro fondo.
const earlyRevealEls = document.querySelectorAll('.reveal-early');

const earlyRevealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
    }
  });
}, { threshold: 0, rootMargin: '0px 0px 220px 0px' });

earlyRevealEls.forEach(el => earlyRevealObserver.observe(el));

// ===================== PARALLAX ON IMAGES =====================
const parallaxImgs = document.querySelectorAll('[data-parallax]');

function updateParallax() {
  const vh = window.innerHeight;
  const speed = 0.12;
  // Primero se LEEN todas las posiciones (getBoundingClientRect) y solo
  // después se ESCRIBEN los transform. Si se mezcla lectura y escritura
  // dentro del mismo bucle, el navegador se ve obligado a recalcular el
  // layout en cada iteración ("layout thrashing"), que es lo que se sentía
  // como tirones/trabones al hacer scroll. Separarlo en dos pasadas deja
  // el scroll mucho más fluido sin cambiar el efecto visual.
  const updates = [];
  parallaxImgs.forEach(img => {
    const rect = img.parentElement.getBoundingClientRect();
    // Solo calcula si está cerca del viewport (performance)
    if (rect.bottom > -200 && rect.top < vh + 200) {
      const offset = (rect.top - vh / 2) * speed;
      updates.push({ img, offset });
    }
  });
  updates.forEach(({ img, offset }) => {
    img.style.transform = `translateY(${offset}px)`;
  });
}

// Throttle con requestAnimationFrame: evita recalcular varias veces por
// frame en móviles (antes corría en cada micro-evento de scroll, lo cual
// se sentía pesado / con tirones en iPhone y Android).
let parallaxTicking = false;
function onScrollParallax() {
  if (parallaxTicking) return;
  parallaxTicking = true;
  requestAnimationFrame(() => {
    updateParallax();
    parallaxTicking = false;
  });
}

window.addEventListener('scroll', onScrollParallax, { passive: true });
window.addEventListener('resize', updateParallax);
updateParallax();

// ===================== SISTEMA DE CAPAS (funciona igual en PC, Android e iPhone) =====================
// Cada capa (.layer) usa position:sticky, que SÍ funciona de forma nativa,
// fluida y consistente en computadora, Android y iPhone (a diferencia de
// background-attachment:fixed, que falla en móviles). El z-index ascendente
// asegura que cada capa nueva se pinte ENCIMA de la anterior al taparla.
document.querySelectorAll('.layer').forEach((el, index) => {
  el.style.zIndex = index + 1;
});

// ===================== COUNTDOWN =====================
// Cambia esta fecha por la fecha real del evento (formato: 'YYYY-MM-DDTHH:mm:ss')
const eventDate = new Date('2025-09-27T16:00:00');

function updateCountdown() {
  const now = new Date();
  let diff = eventDate - now;

  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minsEl = document.getElementById('cd-mins');

  if (diff <= 0) {
    daysEl.textContent = '00';
    hoursEl.textContent = '00';
    minsEl.textContent = '00';
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);

  daysEl.textContent = String(days).padStart(2, '0');
  hoursEl.textContent = String(hours).padStart(2, '0');
  minsEl.textContent = String(mins).padStart(2, '0');
}

setInterval(updateCountdown, 60000);
updateCountdown();

// ===================== ADD TO CALENDAR (funcional, como el sitio original) =====================
(function () {
  const btn = document.getElementById('calendarBtn');
  const menu = document.getElementById('calendarMenu');
  if (!btn || !menu) return;

  const eventTitle = "Vanessa's XV Años";
  const eventLocation = "Enchanted Garden";
  const eventDescription = "Join us to celebrate Vanessa's Sweet Fifteen.";
  const startDate = eventDate; // ya definida arriba
  const endDate = new Date(startDate.getTime() + 5 * 60 * 60 * 1000); // 5 horas de evento

  function toGoogleFormat(d) {
    return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
  }

  function toICSFormat(d) {
    return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
  }

  // Google Calendar (link directo)
  const googleUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    '&text=' + encodeURIComponent(eventTitle) +
    '&dates=' + toGoogleFormat(startDate) + '/' + toGoogleFormat(endDate) +
    '&details=' + encodeURIComponent(eventDescription) +
    '&location=' + encodeURIComponent(eventLocation);
  document.getElementById('calGoogle').href = googleUrl;

  // Apple / Outlook (archivo .ics descargable)
  function buildICS() {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Vanessa XV//EN',
      'BEGIN:VEVENT',
      'UID:' + Date.now() + '@vanessa-xv',
      'DTSTAMP:' + toICSFormat(new Date()),
      'DTSTART:' + toICSFormat(startDate),
      'DTEND:' + toICSFormat(endDate),
      'SUMMARY:' + eventTitle,
      'DESCRIPTION:' + eventDescription,
      'LOCATION:' + eventLocation,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    return ics;
  }

  function downloadICS() {
    const blob = new Blob([buildICS()], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vanessa-xv.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  document.getElementById('calApple').addEventListener('click', (e) => {
    e.preventDefault();
    downloadICS();
  });
  document.getElementById('calOutlook').addEventListener('click', (e) => {
    e.preventDefault();
    downloadICS();
  });

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('open');
  });

  document.addEventListener('click', () => menu.classList.remove('open'));
})();

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
function addSparkleLayer(container, count = 14, boost = false) {
  const layer = document.createElement('div');
  layer.className = 'sparkle-layer';
  const palette = ['#e8caa0', '#f0a8cc', '#b98af0', '#9db8f2'];
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = 'sparkle';
    const color = palette[Math.floor(Math.random() * palette.length)];
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 100 + '%';
    s.style.animationDelay = (Math.random() * 4) + 's';
    s.style.animationDuration = (3 + Math.random() * 2.5) + 's';
    s.style.background = color;
    if (boost) {
      const size = 4.5 + Math.random() * 3; // 4.5-7.5px
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      s.style.boxShadow = `0 0 12px 4px ${color}, 0 0 22px 7px ${color}bb, 0 0 34px 12px ${color}66`;
    } else {
      s.style.boxShadow = `0 0 5px 1.5px ${color}, 0 0 10px 3px ${color}55`;
    }
    layer.appendChild(s);
  }
  container.style.position = container.style.position || 'relative';
  container.appendChild(layer);
}

// En pantallas de celular reducimos la cantidad de destellos: cada uno anima
// box-shadow con blur, y eso es lo más pesado para el GPU en un teléfono.
const isSmallScreen = window.innerWidth < 700;
const sparkleScale = isSmallScreen ? 0.55 : 1;

document.querySelectorAll('#hero, #countdown, #verse, .photo-divider, .photo-overlay-section, .tag-band').forEach(el => {
  const isItinerary = el.id === 'itinerary';
  const isTagBand = el.classList.contains('tag-band');
  const base = isItinerary ? 22 : (isTagBand ? 16 : 10);
  addSparkleLayer(el, Math.max(4, Math.round(base * sparkleScale)));
});

document.querySelectorAll('.section-dark, .section-mid, footer').forEach(el => {
  const isFooter = el.tagName === 'FOOTER';
  const base = isFooter ? 20 : 14;
  addSparkleLayer(el, Math.max(4, Math.round(base * sparkleScale)), true);
});

// ===================== BRILLO QUE SIGUE AL SCROLL =====================
// Cada vez que el usuario hace scroll (con el dedo o el mouse), aparece
// un destello suave y breve, como si dejara un rastro de luz.
let lastGlow = 0;
const glowInterval = isSmallScreen ? 420 : 220;
function spawnScrollGlow() {
  const now = Date.now();
  if (now - lastGlow < glowInterval) return; // limita la frecuencia para que sea sutil
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

// ===================== HADITA MÁGICA =====================
// De vez en cuando aparece una hadita que cruza la pantalla de un lado
// a otro dejando un rastro de destellos, y luego se va. No depende del
// scroll ni de ninguna sección: aparece flotando sobre toda la página.
const fairyPalette = ['#e8caa0', '#f0a8cc', '#b98af0', '#9db8f2'];

function spawnFairySpark(x, y) {
  const spark = document.createElement('div');
  spark.className = 'fairy-spark';
  const color = fairyPalette[Math.floor(Math.random() * fairyPalette.length)];
  spark.style.left = x + 'px';
  spark.style.top = y + 'px';
  spark.style.background = `radial-gradient(circle, ${color} 0%, transparent 75%)`;
  spark.style.boxShadow = `0 0 6px 2px ${color}99`;
  document.body.appendChild(spark);
  setTimeout(() => spark.remove(), 1000);
}

function spawnFairy() {
  const fairy = document.createElement('div');
  fairy.className = 'fairy';
  fairy.textContent = '🧚';

  const fromLeft = Math.random() > 0.5;
  const startX = fromLeft ? -8 : 108;
  const endX = fromLeft ? 108 : -8;
  const midX = (startX + endX) / 2 + (Math.random() * 16 - 8);
  const startY = 12 + Math.random() * 55;
  const midY = Math.max(6, startY + (Math.random() * 26 - 13));
  const endY = 12 + Math.random() * 55;

  fairy.style.setProperty('--startX', startX + 'vw');
  fairy.style.setProperty('--endX', endX + 'vw');
  fairy.style.setProperty('--midX', midX + 'vw');
  fairy.style.setProperty('--startY', startY + 'vh');
  fairy.style.setProperty('--midY', midY + 'vh');
  fairy.style.setProperty('--endY', endY + 'vh');

  document.body.appendChild(fairy);
  requestAnimationFrame(() => fairy.classList.add('flying'));

  const duration = 7000;
  const trailInterval = setInterval(() => {
    const rect = fairy.getBoundingClientRect();
    if (rect.width) {
      spawnFairySpark(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
  }, isSmallScreen ? 380 : 200);

  setTimeout(() => {
    clearInterval(trailInterval);
    fairy.remove();
  }, duration + 150);
}

function scheduleFairy() {
  const delay = 6000 + Math.random() * 8000; // entre 6 y 14 segundos
  setTimeout(() => {
    spawnFairy();
    scheduleFairy();
  }, delay);
}

scheduleFairy();
