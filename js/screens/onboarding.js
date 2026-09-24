window.FITTRACK = window.FITTRACK || {};

/**
 * POG TRAINING — Guía de Inicio
 * Concise, theme-adaptive interactive guide.
 */

const _OB_KEY = 'fittrack_onboarding_done';

window.FITTRACK.isOnboardingDone = function () {
  return localStorage.getItem(_OB_KEY) === '1';
};

window.FITTRACK.markOnboardingDone = function () {
  localStorage.setItem(_OB_KEY, '1');
};

window.FITTRACK.showGuide = function (onClose) {
  // Remove any preexisting overlay
  const existing = document.getElementById('guide-overlay') || document.getElementById('onboarding-overlay');
  if (existing) existing.remove();

  const slides = [
    {
      icon: 'zap',
      title: 'Bienvenido a POG TRAINING',
      subtitle: 'Disciplina hoy, resultados mañana',
      desc: 'Tu central de entrenamiento para maximizar cada sesión con control métrico riguroso y cero distracciones.',
      features: [
        {
          icon: 'dumbbell',
          title: 'Rutinas estructuradas',
          desc: 'Diseña tu programa con series, repeticiones y descanso por ejercicio.'
        },
        {
          icon: 'volume-2',
          title: 'Audio Coach acústico',
          desc: 'Silbato al iniciar el descanso y doble campana al terminar.'
        },
        {
          icon: 'trending-up',
          title: 'Cálculo de volumen',
          desc: 'Tonelaje acumulado automático (kg × reps) e historial de cada sesión.'
        }
      ]
    },
    {
      icon: 'clipboard-list',
      title: 'Rutinas y Planificación',
      subtitle: 'Estructura por días y objetivos',
      desc: 'Organiza tus sesiones fácilmente o activa las plantillas predeterminadas de fuerza e hipertrofia.',
      features: [
        {
          icon: 'calendar',
          title: 'División flexible por días',
          desc: 'Separa tus entrenamientos por días (Día 1, Día 2, etc.) o grupos musculares.'
        },
        {
          icon: 'sliders',
          title: 'Variables precisas',
          desc: 'Asigna el peso objetivo, rango de reps y segundos de recuperación a cada ejercicio.'
        },
        {
          icon: 'plus-circle',
          title: 'Flexibilidad en la sala',
          desc: 'Añade, edita o reordena ejercicios en cualquier momento según las máquinas disponibles.'
        }
      ]
    },
    {
      icon: 'bell',
      title: 'Entrenamiento en Vivo & Audio',
      subtitle: 'Señales acústicas de alta penetración',
      desc: 'El cronómetro te guía con sonidos claros para que entrenes concentrado sin mirar la pantalla:',
      features: [
        {
          icon: 'play',
          title: 'Al Iniciar Descanso 📣',
          desc: 'Suena el silbato arbitral marcando el inicio de tu recuperación.',
          soundType: 'whistle',
          soundLabel: 'Probar Silbato'
        },
        {
          icon: 'award',
          title: 'Al Terminar Descanso 🔔',
          desc: 'Suena la doble campana ("DING! DING!") indicando la siguiente serie.',
          soundType: 'bell',
          soundLabel: 'Probar Doble Campana'
        },
        {
          icon: 'rotate-cw',
          title: 'Dial táctil de descanso',
          desc: 'Ajusta con +15s / -15s o pulsa "Saltar" si ya estás listo. (Ticks rítmicos en los últimos 5s).'
        }
      ]
    },
    {
      icon: 'smartphone',
      title: 'Métricas & Modo Offline',
      subtitle: 'Sin cortes y disponible donde sea',
      desc: 'Diseñada con tecnología PWA para rendir al máximo incluso en sótanos de gimnasios sin señal.',
      features: [
        {
          icon: 'layers',
          title: 'Tonelaje total y racha',
          desc: 'Monitorea tu volumen de carga acumulado y mantén la racha semanal en el Dashboard.'
        },
        {
          icon: 'wifi-off',
          title: '100% Offline-First',
          desc: 'Registra sin conexión; tus series se sincronizan en la nube automáticamente al reconectar.'
        },
        {
          icon: 'download',
          title: 'Instalar en Pantalla de Inicio',
          desc: 'Instala la app desde el Perfil o menú del navegador para una experiencia en pantalla completa.'
        }
      ]
    }
  ];

  let current = 0;

  // Create and append overlay immediately
  const overlay = document.createElement('div');
  overlay.id = 'guide-overlay';
  overlay.className = 'guide-overlay';
  document.body.appendChild(overlay);

  const handleKeydown = (e) => {
    if (e.key === 'Escape') closeGuide();
    else if (e.key === 'ArrowRight' && current < slides.length - 1) {
      current++;
      renderSlide(current);
    } else if (e.key === 'ArrowLeft' && current > 0) {
      current--;
      renderSlide(current);
    }
  };
  window.addEventListener('keydown', handleKeydown);

  function closeGuide() {
    window.removeEventListener('keydown', handleKeydown);
    window.FITTRACK.markOnboardingDone();
    overlay.classList.add('guide-closing');
    setTimeout(() => {
      overlay.remove();
      if (typeof onClose === 'function') onClose();
    }, 240);
  }

  function renderSlide(idx) {
    const s = slides[idx];
    const isFirst = idx === 0;
    const isLast = idx === slides.length - 1;

    overlay.innerHTML = `
      <div class="guide-modal-container">
        <!-- Top bar: Clean brand + Steps (1..4) + Close -->
        <div class="guide-top-bar">
          <div class="guide-brand-wrap">
            <span class="guide-brand-name">POG TRAINING</span>
            <span class="guide-brand-sub">GUÍA</span>
          </div>

          <div class="guide-step-indicators">
            ${slides.map((_, i) => `
              <button class="guide-step-pill ${i === idx ? 'active' : ''} ${i < idx ? 'completed' : ''}" data-step="${i}" aria-label="Paso ${i+1}">
                <span>${i + 1}</span>
              </button>
            `).join('')}
          </div>

          <button class="guide-close-btn" id="btn-guide-close" aria-label="Cerrar">
            <i data-lucide="x" style="width:18px;height:18px;"></i>
          </button>
        </div>

        <!-- Slide Body with enter animation -->
        <div class="guide-slide-body">
          <div class="guide-slide-content">
            <div class="guide-slide-header">
              <div class="guide-icon-halo">
                <i data-lucide="${s.icon}" style="width:28px;height:28px;"></i>
              </div>
              <div class="guide-header-text">
                <h2 class="guide-title">${s.title}</h2>
                <p class="guide-subtitle">${s.subtitle}</p>
              </div>
            </div>

            <p class="guide-lead-desc">${s.desc}</p>

            <div class="guide-features-list">
              ${s.features.map(f => `
                <div class="guide-feature-card ${f.soundType ? 'guide-feature-sound' : ''}">
                  <div class="guide-feat-icon-wrap">
                    <i data-lucide="${f.icon}" style="width:18px;height:18px;"></i>
                  </div>
                  <div class="guide-feat-content">
                    <div class="guide-feat-title">${f.title}</div>
                    <div class="guide-feat-desc">${f.desc}</div>
                    ${f.soundType ? `
                      <button class="guide-sound-test-btn" data-sound="${f.soundType}">
                        <i data-lucide="volume-2" style="width:14px;height:14px;"></i>
                        <span>${f.soundLabel}</span>
                      </button>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="guide-footer">
          <div class="guide-footer-row">
            ${!isFirst ? `
              <button class="guide-btn-prev" id="btn-guide-prev">
                <i data-lucide="chevron-left" style="width:16px;height:16px;"></i>
                <span>Anterior</span>
              </button>
            ` : `
              <button class="guide-skip-link" id="btn-guide-skip">
                Saltar guía
              </button>
            `}

            <button class="guide-btn-next" id="btn-guide-next">
              <span>${isLast ? '¡Comenzar!' : 'Siguiente'}</span>
              <i data-lucide="${isLast ? 'zap' : 'chevron-right'}" style="width:18px;height:18px;"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();

    // Event listeners
    const closeBtn = overlay.querySelector('#btn-guide-close');
    if (closeBtn) closeBtn.addEventListener('click', closeGuide);

    const prevBtn = overlay.querySelector('#btn-guide-prev');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (current > 0) {
          current--;
          renderSlide(current);
        }
      });
    }

    const skipBtn = overlay.querySelector('#btn-guide-skip');
    if (skipBtn) skipBtn.addEventListener('click', closeGuide);

    const nextBtn = overlay.querySelector('#btn-guide-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (isLast) closeGuide();
        else {
          current++;
          renderSlide(current);
        }
      });
    }

    overlay.querySelectorAll('.guide-step-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        const step = parseInt(e.currentTarget.getAttribute('data-step'), 10);
        if (!isNaN(step) && step >= 0 && step < slides.length) {
          current = step;
          renderSlide(current);
        }
      });
    });

    overlay.querySelectorAll('.guide-sound-test-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = btn.getAttribute('data-sound');
        if (type === 'whistle' && window.FITTRACK.audio) {
          window.FITTRACK.audio.playRestStartSound();
          btn.classList.add('pulse-active');
          setTimeout(() => btn.classList.remove('pulse-active'), 400);
        } else if (type === 'bell' && window.FITTRACK.audio) {
          window.FITTRACK.audio.playBoxingBell();
          btn.classList.add('pulse-active');
          setTimeout(() => btn.classList.remove('pulse-active'), 400);
        }
      });
    });

    const bodyEl = overlay.querySelector('.guide-slide-body');
    if (bodyEl) bodyEl.scrollTop = 0;
  }

  renderSlide(0);
};

window.FITTRACK.showOnboarding = function () {
  window.FITTRACK.showGuide();
};
