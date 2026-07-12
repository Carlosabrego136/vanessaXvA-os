// ===================== SCRATCH WELCOME (corazón para rascar) =====================
(function () {
  const screen = document.getElementById('scratch-screen');
  const wrap = document.getElementById('scratchHeartWrap');
  const canvas = document.getElementById('scratchCanvas');
  const title = document.getElementById('scratchTitle');
  const hint = document.getElementById('scratchHint');
  const confettiCanvas = document.getElementById('scratchConfetti');
  if (!screen || !canvas) return;

  const ctx = canvas.getContext('2d');
  let w = 0, h = 0;
  let revealed = false;
  let checking = false;

  function sizeCanvas() {
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width; h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawGoldLayer();
  }

  // Capa dorada tipo "glitter" — se dibuja UNA sola vez, no se anima nada,
  // así que no cuesta nada al navegador mientras el usuario rasca.
  function drawGoldLayer() {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#fff2c4');
    grad.addColorStop(0.28, '#ffd968');
    grad.addColorStop(0.55, '#e8b23e');
    grad.addColorStop(0.8, '#cf9a2e');
    grad.addColorStop(1, '#b8862a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // brillo diagonal tipo destello de metal pulido, fijo (no animado)
    const shineGrad = ctx.createLinearGradient(0, 0, w * 0.6, h * 0.6);
    shineGrad.addColorStop(0, 'rgba(255,255,255,0.55)');
    shineGrad.addColorStop(0.25, 'rgba(255,255,255,0.05)');
    shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shineGrad;
    ctx.fillRect(0, 0, w, h);

    // motitas de brillo (glitter) fijas, dibujadas una sola vez — más
    // cantidad y algunas con destello extra para que se vea más vivo
    for (let i = 0; i < 340; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = Math.random() * 1.6 + 0.3;
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.6 + 0.2})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // unos pocos destellos más grandes tipo estrella para dar chispa
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const s = Math.random() * 4 + 3;
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - s, y); ctx.lineTo(x + s, y);
      ctx.moveTo(x, y - s); ctx.lineTo(x, y + s);
      ctx.stroke();
    }
  }

  sizeCanvas();
  window.addEventListener('resize', () => { if (!revealed) sizeCanvas(); });

  function erase(x, y) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  }

  // Revisa cuánto % del corazón ya se borró, muestreando pixeles cada
  // pocos px (no pixel por pixel) para que sea barato. Usa un paso fijo
  // en bytes (múltiplo de 4) para no depender de devicePixelRatio — en
  // varios celulares Android ese valor tiene decimales (ej. 2.75) y eso
  // rompía el muestreo (índices no enteros nunca contaban como "borrado").
  function checkProgress() {
    if (checking || revealed) return;
    checking = true;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let total = 0, cleared = 0;
    const step = 32; // cada 8vo pixel (32 bytes = 8 pixeles x 4 bytes RGBA)
    for (let i = 0; i < data.length; i += step) {
      total++;
      if (data[i + 3] < 40) cleared++;
    }
    checking = false;
    if (total > 0 && cleared / total > 0.7) {
      triggerReveal();
    }
  }

  let drawing = false;
  let lastCheck = 0;
  let lastPos = null;
  function handleMove(e) {
    if (revealed) return;
    e.preventDefault();
    const p = getPos(e);
    if (lastPos) {
      // Rellena la línea entre el punto anterior y el actual para que
      // los swipes rápidos no dejen huecos sin rascar (se siente más
      // rápido y generoso sin necesidad de pasar varias veces).
      const dx = p.x - lastPos.x, dy = p.y - lastPos.y;
      const dist = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.ceil(dist / 14));
      for (let s = 0; s <= steps; s++) {
        erase(lastPos.x + (dx * s) / steps, lastPos.y + (dy * s) / steps);
      }
    } else {
      erase(p.x, p.y);
    }
    lastPos = p;
    const now = Date.now();
    if (now - lastCheck > 120) {
      lastCheck = now;
      checkProgress();
    }
  }
  canvas.addEventListener('touchstart', (e) => { drawing = true; lastPos = null; handleMove(e); }, { passive: false });
  canvas.addEventListener('touchmove', (e) => { if (drawing) handleMove(e); }, { passive: false });
  canvas.addEventListener('touchend', () => { drawing = false; lastPos = null; });
  canvas.addEventListener('mousedown', (e) => { drawing = true; lastPos = null; handleMove(e); });
  canvas.addEventListener('mousemove', (e) => { if (drawing) handleMove(e); });
  window.addEventListener('mouseup', () => { drawing = false; lastPos = null; });

  function launchConfetti() {
    const cctx = confettiCanvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    confettiCanvas.width = window.innerWidth * dpr;
    confettiCanvas.height = window.innerHeight * dpr;
    confettiCanvas.style.width = window.innerWidth + 'px';
    confettiCanvas.style.height = window.innerHeight + 'px';
    cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const colors = ['#cfa15e', '#ffd968', '#e8caa0', '#f6f1e6', '#b8863f'];
    const pieces = [];
    const count = window.innerWidth < 700 ? 55 : 85;
    for (let i = 0; i < count; i++) {
      pieces.push({
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * window.innerHeight * 0.5,
        w: Math.random() * 7 + 4,
        h: Math.random() * 11 + 6,
        rot: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.3,
        vy: Math.random() * 3.5 + 5.5,
        vx: (Math.random() - 0.5) * 1.8,
        swayAmp: Math.random() * 18 + 6,
        swaySpeed: Math.random() * 2 + 1.2,
        phase: Math.random() * Math.PI * 2,
        shape: Math.random() < 0.35 ? 'circle' : 'rect',
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    const startTime = Date.now();
    const duration = 1900;
    function frame() {
      const elapsed = Date.now() - startTime;
      const t = elapsed / 1000;
      cctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      pieces.forEach(p => {
        p.y += p.vy;
        p.rot += p.vRot;
        const sway = Math.sin(t * p.swaySpeed + p.phase) * p.swayAmp * 0.06;
        cctx.save();
        cctx.translate(p.x + p.vx * t * 12 + sway, p.y);
        cctx.rotate(p.rot);
        cctx.fillStyle = p.color;
        if (p.shape === 'circle') {
          cctx.beginPath();
          cctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          cctx.fill();
        } else {
          cctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        cctx.restore();
      });
      if (elapsed < duration) {
        requestAnimationFrame(frame);
      } else {
        cctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    }
    frame();
  }

  function triggerReveal() {
    if (revealed) return;
    revealed = true;
    canvas.style.transition = 'opacity .6s ease';
    canvas.style.opacity = '0';
    hint.style.opacity = '0';

    setTimeout(() => {
      title.style.opacity = '0';
      setTimeout(() => {
        title.textContent = 'Welcome';
        title.style.opacity = '1';
        launchConfetti();
      }, 350);
    }, 500);

    setTimeout(() => {
      screen.classList.add('hidden');
    }, 2800);
  }
})();

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
    alert('Add your music file to assets/audio/song.mp3 and uncomment it in the HTML to enable sound.');
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

// ===================== REVEAL (animación notable en toda la página) =====================
// A pedido: la animación de aparición (opacity + transform) ahora corre
// en TODAS las secciones, no solo en las tarjetas de Padres/Padrinos.
// Sigue siendo el mismo IntersectionObserver liviano de más abajo
// (softRevealObserver), solo que ahora observa también .reveal y
// .reveal-fade (antes solo veía las clases "soft"/"notable").

// ===================== FADE LEVE: Countdown + Itinerary + Tarjetas (a pedido) =====================
// Se pidió que estas animaciones de entrada (calendario, Padres,
// Padrinos y el resto de tarjetas/elementos con fade) se repitan cada
// vez que el elemento vuelve a entrar en pantalla, tanto bajando como
// subiendo el scroll — no solo la primera vez. Por eso ya no se hace
// unobserve: se agrega 'is-visible' al entrar y se quita al salir de
// vista, así la próxima vez que aparezca se vuelve a animar desde cero.
const softRevealEls = document.querySelectorAll('.reveal, .reveal-fade, .reveal-fade-soft, .reveal-left, .reveal-right, .countdown-notable, .card-notable');
if (softRevealEls.length && 'IntersectionObserver' in window) {
  const softRevealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      } else {
        entry.target.classList.remove('is-visible');
      }
    });
  }, { threshold: 0.15 });
  softRevealEls.forEach((el) => softRevealObserver.observe(el));
} else {
  // Sin soporte de IntersectionObserver: se muestran directo, sin fade.
  softRevealEls.forEach((el) => el.classList.add('is-visible'));
}

// ===================== PARALLAX ELIMINADO A PEDIDO =====================
// Se sacó el efecto de parallax en las fotos de la galería (el translateY
// que se aplicaba al hacer scroll). Ahora solo queda el scroll de capas
// (sticky), sin nada más moviéndose por encima. El atributo data-parallax
// se dejó en el HTML por si se quiere reactivar, pero ya no se usa.

// ===================== SISTEMA DE CAPAS (funciona igual en PC, Android e iPhone) =====================
// Cada capa (.layer) usa position:sticky, que SÍ funciona de forma nativa,
// fluida y consistente en computadora, Android y iPhone (a diferencia de
// background-attachment:fixed, que falla en móviles). El z-index ascendente
// asegura que cada capa nueva se pinte ENCIMA de la anterior al taparla.
document.querySelectorAll('.layer').forEach((el, index) => {
  el.style.zIndex = index + 1;
});

// ===================== COUNTDOWN =====================
// NOTA: Cambia esta fecha por la fecha REAL del evento cuando la tengas
// confirmada (formato: 'YYYY-MM-DDTHH:mm:ss'). Se puso en el futuro para
// que el contador funcione y cuente regresivamente en vez de mostrar 00.
const eventDate = new Date('2026-09-27T16:00:00');

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

  const eventTitle = "Vanessa's Sweet Fifteen";
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
// Ahora el track se mueve de verdad con transform:translateX (antes solo
// se intercambiaba qué tarjeta era visible con display:none/flex, sin
// ningún movimiento). El contenedor .carousel tiene overflow:hidden en
// el CSS, así que solo se ve una tarjeta a la vez mientras se desliza.
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
    track.style.transform = `translateX(-${index * 100}%)`;
  }

  prevBtn.addEventListener('click', () => show(index - 1));
  nextBtn.addEventListener('click', () => show(index + 1));

  // Swipe izquierda/derecha en móvil, igual que en las demás galerías del sitio
  let touchStartX = 0;
  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  track.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) {
      if (dx < 0) show(index + 1);
      else show(index - 1);
    }
  }, { passive: true });

  show(0);
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

// ===================== BABY PHOTO CAROUSEL (Love Story) =====================
// Las fotos ahora se deslizan de verdad: se mueve el wrapper interno
// (.baby-carousel-slides) con transform:translateX según el índice,
// en vez del crossfade (opacity) que había antes.
(function () {
  const carousel = document.getElementById('babyCarousel');
  if (!carousel) return;
  const slidesTrack = document.getElementById('babyCarouselSlides');
  const slides = Array.from(carousel.querySelectorAll('.baby-slide'));
  const prevBtn = document.getElementById('babyPrev');
  const nextBtn = document.getElementById('babyNext');
  let index = 0;

  function show(i) {
    index = (i + slides.length) % slides.length;
    slidesTrack.style.transform = `translateX(-${index * 100}%)`;
  }

  // Autoplay: las fotos avanzan solas cada 3.2s. Si el usuario usa las
  // flechas o desliza con el dedo, se reinicia el temporizador para que
  // no compita con lo que el usuario acaba de hacer.
  let autoplayTimer = null;
  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(() => show(index + 1), 3200);
  }
  function stopAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
  }
  function restartAutoplay() {
    startAutoplay();
  }

  prevBtn.addEventListener('click', (e) => { e.stopPropagation(); show(index - 1); restartAutoplay(); });
  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); show(index + 1); restartAutoplay(); });

  // Swipe izquierda/derecha en móvil directamente sobre las fotos
  let carouselTouchStartX = 0;
  const trackEl = carousel.querySelector('.baby-carousel-track');
  trackEl.addEventListener('touchstart', (e) => {
    carouselTouchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  trackEl.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - carouselTouchStartX;
    if (Math.abs(dx) > 40) {
      if (dx < 0) show(index + 1);
      else show(index - 1);
      restartAutoplay();
    }
  }, { passive: true });

  startAutoplay();

  // ---- Lightbox: click en la foto para verla completa, con flechas ----
  const lightbox = document.getElementById('babyLightbox');
  const lightboxImg = document.getElementById('babyLightboxImg');
  const counter = document.getElementById('babyLightboxCounter');
  const closeBtn = document.getElementById('babyLightboxClose');
  const lbPrevBtn = document.getElementById('babyLightboxPrev');
  const lbNextBtn = document.getElementById('babyLightboxNext');
  let current = 0;

  function showLb(i) {
    current = (i + slides.length) % slides.length;
    lightboxImg.src = slides[current].src;
    lightboxImg.alt = slides[current].alt || '';
    counter.textContent = (current + 1) + ' / ' + slides.length;
    show(current);
  }

  function openLb(i) {
    stopAutoplay();
    showLb(i);
    lightbox.classList.add('open');
  }

  function closeLb() {
    lightbox.classList.remove('open');
    startAutoplay();
  }

  slides.forEach((img, i) => {
    img.addEventListener('click', () => openLb(i));
  });

  closeBtn.addEventListener('click', closeLb);
  lbPrevBtn.addEventListener('click', () => showLb(current - 1));
  lbNextBtn.addEventListener('click', () => showLb(current + 1));

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLb();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') showLb(current - 1);
    if (e.key === 'ArrowRight') showLb(current + 1);
  });

  // Swipe izquierda/derecha en móvil dentro del visor
  let touchStartX = 0;
  const stage = lightbox.querySelector('.lightbox-stage');
  stage.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) {
      if (dx < 0) showLb(current + 1);
      else showLb(current - 1);
    }
  }, { passive: true });
})();

// ===================== GALERÍA: ahora es un collage de grid fijo (3 columnas,
// sin gap, object-fit:cover) directamente por CSS, así que ya no hace falta
// balancear columnas por JS como en el mosaico viejo. Se quitó esa función
// para no mover las fotos de lugar y romper el nuevo collage.

// ===================== GALLERY LIGHTBOX (tocar foto + swipe izq/der) =====================
(function () {
  const items = Array.from(document.querySelectorAll('.gallery-grid .g-item img'));
  if (!items.length) return;

  const lightbox = document.getElementById('galleryLightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const counter = document.getElementById('lightboxCounter');
  const closeBtn = document.getElementById('lightboxClose');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');
  let current = 0;

  function show(i) {
    current = (i + items.length) % items.length;
    lightboxImg.src = items[current].src;
    lightboxImg.alt = items[current].alt || '';
    counter.textContent = (current + 1) + ' / ' + items.length;
  }

  function open(i) {
    show(i);
    lightbox.classList.add('open');
  }

  function close() {
    lightbox.classList.remove('open');
  }

  items.forEach((img, i) => {
    img.addEventListener('click', () => open(i));
  });

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => show(current - 1));
  nextBtn.addEventListener('click', () => show(current + 1));

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) close();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });

  // Swipe izquierda/derecha en móvil
  let touchStartX = 0;
  const stage = lightbox.querySelector('.lightbox-stage');
  stage.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) {
      if (dx < 0) show(current + 1);
      else show(current - 1);
    }
  }, { passive: true });
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
    s.style.animationDelay = (Math.random() * 1.8) + 's';
    s.style.animationDuration = (1.8 + Math.random() * 1.4) + 's';
    s.style.background = color;
    if (boost) {
      const size = 4.5 + Math.random() * 3; // 4.5-7.5px
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      s.style.boxShadow = `0 0 12px 4px ${color}, 0 0 22px 7px ${color}bb, 0 0 34px 12px ${color}66`;
    } else {
      // mezcla de estrellas chicas y grandes para que se sienta más mágico
      const size = 3 + Math.random() * 4; // 3-7px
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      s.style.boxShadow = `0 0 ${size * 2.4}px ${size * 0.8}px ${color}, 0 0 ${size * 4.4}px ${size * 1.4}px ${color}88`;
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

// Destellos suaves (dorado, rosa, morado, azul) — reactivados a pedido,
// pero MUCHO más livianos que la versión original: menos destellos por
// sección (4, escalados a la mitad en celular) y sin el estilo "boost"
// (que usaba sombras enormes y muy caras de pintar). La animación en sí
// solo mueve opacity y transform (ver @keyframes sparkle-twinkle en el
// CSS), que es lo barato para el navegador — el box-shadow de cada
// destello es chico y NO se anima, se pinta una sola vez. Ahora cubre
// TODA la página (antes se cortaba en Itinerary hacia abajo).
document.querySelectorAll('#hero, #countdown, .photo-divider, .photo-overlay-section, .section, .split').forEach(el => {
  addSparkleLayer(el, Math.max(4, Math.round(10 * sparkleScale)));
});

// ===================== BRILLO QUE SIGUE AL SCROLL =====================
// Cada vez que el usuario hace scroll (con el dedo o el mouse), aparece
// un destello suave y breve, como si dejara un rastro de luz.
// DESACTIVADO a pedido: este efecto crea un elemento nuevo cada vez que
// se scrollea (varias veces por segundo) y cada uno anima box-shadow con
// blur, que es de lo más pesado para el navegador/GPU. Justo por eso era
// la causa más probable de que la página se sintiera lenta/con saltos al
// moverse, sobre todo en la mitad de abajo donde ya hay más cosas
// renderizadas encima. Se comenta en vez de borrar por si se quiere
// reactivar más adelante. El sistema de capas (.layer/sticky) no se
// toca — sigue funcionando igual.
// let lastGlow = 0;
// const glowInterval = isSmallScreen ? 420 : 220;
// function spawnScrollGlow() {
//   const now = Date.now();
//   if (now - lastGlow < glowInterval) return; // limita la frecuencia para que sea sutil
//   lastGlow = now;
//
//   const glow = document.createElement('div');
//   glow.className = 'scroll-glow';
//   const x = window.innerWidth * (0.15 + Math.random() * 0.7);
//   const y = window.innerHeight * (0.2 + Math.random() * 0.6);
//   glow.style.left = x + 'px';
//   glow.style.top = y + 'px';
//   document.body.appendChild(glow);
//
//   setTimeout(() => glow.remove(), 1200);
// }
//
// window.addEventListener('scroll', spawnScrollGlow, { passive: true });

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
  // Se bajó la frecuencia del rastro de chispas (antes 200/380ms) para que
  // suelte menos destellos durante el vuelo, sin quitar la hadita ni el
  // rastro en sí — solo menos partículas por segundo.
  const trailInterval = setInterval(() => {
    const rect = fairy.getBoundingClientRect();
    if (rect.width) {
      spawnFairySpark(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
  }, isSmallScreen ? 750 : 480);

  setTimeout(() => {
    clearInterval(trailInterval);
    fairy.remove();
  }, duration + 150);
}

function scheduleFairy() {
  const delay = 8000 + Math.random() * 9000; // entre 8 y 17 segundos
  setTimeout(() => {
    spawnFairy();
    scheduleFairy();
  }, delay);
}

scheduleFairy();
