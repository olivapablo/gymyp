window.FITTRACK = window.FITTRACK || {};

/**
 * FITTRACK — Guía de Inicio Ultra Premium & Onboarding
 * Interactive walkthrough explaining core mechanics, acoustic timer signals,
 * routine builder, volume tracking, and offline capabilities.
 */

const _OB_KEY = 'fittrack_onboarding_done';

window.FITTRACK.isOnboardingDone = function () {
  return localStorage.getItem(_OB_KEY) === '1';
};

window.FITTRACK.markOnboardingDone = function () {
  localStorage.setItem(_OB_KEY, '1');
};

window.FITTRACK.showGuide = function (onClose) {
  // Remove any preexisting guide overlay
  const existing = document.getElementById('guide-overlay') || document.getElementById('onboarding-overlay');
  if (existing) existing.remove();

  const slides = [
    {
      badge: 'SISTEMA ULTRA PREMIUM',
      badgeColor: '#B7FF3A',
      badgeBg: 'rgba(183,255,58,0.12)',
      icon: 'zap',
      title: 'Bienvenido a PSG TRAINING',
      subtitle: 'Disciplina hoy, resultados mañana',
      desc: 'FITTRACK es tu central de alto rendimiento diseñada para maximizar cada segundo de entrenamiento mediante control métrico riguroso, sobrecarga progresiva y cero distracciones.',
      features: [
        {
          icon: 'dumbbell',
          title: 'Registro serie a serie en tiempo real',
          desc: 'Anota kg levantados y repeticiones logradas con un solo toque ergonómico.'
        },
        {
          icon: 'volume-2',
          title: 'Audio Coach acústico inteligente',
          desc: 'Silbato al iniciar el descanso y doble campana al terminar para no mirar el móvil.'
        },
        {
          icon: 'trending-up',
          title: 'Cálculo automático de tonelaje',
          desc: 'Mide el volumen de carga acumulado y el progreso real en cada grupo muscular.'
        },
        {
          icon: 'wifi-off',
          title: 'Arquitectura 100% Offline-First',
          desc: 'Entrena sin cobertura en cualquier gimnasio; tus datos se sincronizan al salir.'
        }
      ]
    },
    {
      badge: 'MÓDULO 1 · PROGRAMACIÓN',
      badgeColor: '#38BDF8',
      badgeBg: 'rgba(56,189,248,0.12)',
      icon: 'clipboard-list',
      title: 'Diseña tus Rutinas a Medida',
      subtitle: 'Estructura inteligente para tus objetivos',
      desc: 'Crea rutinas personalizadas adaptadas a tus días de entreno o activa planes predeterminados de fuerza e hipertrofia.',
      features: [
        {
          icon: 'calendar',
          title: 'División flexible por días',
          desc: 'Organiza tus sesiones semanales (Día 1: Empuje, Día 2: Tracción, Día 3: Pierna...).'
        },
        {
          icon: 'sliders',
          title: 'Series, repeticiones y descanso por ejercicio',
          desc: 'Personaliza el número de series, objetivo de reps y el tiempo de recuperación exacto (ej. 60s, 90s, 120s).'
        },
        {
          icon: 'plus-circle',
          title: 'Biblioteca de ejercicios amplia',
          desc: 'Añade ejercicios de pectoral, espalda, piernas, hombros, brazos y core con indicaciones biomecánicas.'
        }
      ]
    },
    {
      badge: 'MÓDULO 2 · EN LA SALA',
      badgeColor: '#B7FF3A',
      badgeBg: 'rgba(183,255,58,0.15)',
      icon: 'bell',
      title: 'Modo Sesión & Señales Acústicas',
      subtitle: 'Tu árbitro y cronómetro acústico',
      desc: 'El sistema acústico de FITTRACK te guía con señales de audio de alta penetración para que entrenes concentrado sin mirar la pantalla:',
      hasSoundTester: true,
      features: [
        {
          icon: 'play',
          title: 'Al iniciar el descanso 📣',
          desc: 'Al marcar una serie completada, suena el silbato arbitral dando inicio a tu recuperación.',
          soundType: 'whistle',
          soundLabel: 'Probar Silbato (Inicio)'
        },
        {
          icon: 'clock',
          title: 'Últimos 5 segundos ⏱️',
          desc: 'Pulsos rítmicos de cuenta regresiva (ticks) para volver a la máquina o barra y tomar posición.'
        },
        {
          icon: 'award',
          title: 'Al terminar el descanso 🔔',
          desc: 'Suena la doble campana de boxeo ("DING! DING!") indicando el comienzo inmediato de tu próxima serie.',
          soundType: 'bell',
          soundLabel: 'Probar Doble Campana (Fin)'
        },
        {
          icon: 'rotate-cw',
          title: 'Dial táctil interactivo',
          desc: 'Ajusta el tiempo de descanso con los botones +15s / -15s o pulsa "Saltar" si ya estás listo.'
        }
      ]
    },
    {
      badge: 'MÓDULO 3 · RESULTADOS',
      badgeColor: '#FFC857',
      badgeBg: 'rgba(255,200,87,0.12)',
      icon: 'bar-chart-2',
      title: 'Métricas de Carga & Progreso',
      subtitle: 'Lo que se mide, se mejora',
      desc: 'El crecimiento físico responde a datos objetivos. Analiza tu consistencia con métricas profesionales:',
      features: [
        {
          icon: 'layers',
          title: 'Tonelaje total acumulado',
          desc: 'Multiplicamos tus kilogramos levantados por cada repetición para darte el tonelaje exacto movido en la sesión y el mes.'
        },
        {
          icon: 'flame',
          title: 'Racha semanal en el Dashboard',
          desc: 'Monitorea tus días de entrenamiento cumplidos cada semana para forjar disciplina inquebrantable.'
        },
        {
          icon: 'history',
          title: 'Historial detallado e inmutable',
          desc: 'Revisa fecha, duración, desglose de series y pesos históricos para asegurar sobrecarga progresiva.'
        }
      ]
    },
    {
      badge: 'MÓDULO 4 · SIN LÍMITES',
      badgeColor: '#4ADE80',
      badgeBg: 'rgba(74,222,128,0.12)',
      icon: 'smartphone',
      title: 'App Nativa y Modo Offline',
      subtitle: 'Tu entrenamiento siempre disponible',
      desc: 'Diseñada con tecnología Progressive Web App (PWA) para garantizar máximo rendimiento sin depender de señal móvil ni tiendas lentas:',
      features: [
        {
          icon: 'wifi-off',
          title: 'Cero interrupciones por falta de señal',
          desc: 'Entrena en sótanos o zonas sin cobertura. La app almacena las series localmente y las sincroniza en la nube al reconectarte.'
        },
        {
          icon: 'download',
          title: 'Instalar en Pantalla de Inicio',
          desc: 'Instálala desde la sección Perfil o el menú del navegador para disfrutar de pantalla completa como una app nativa.'
        },
        {
          icon: 'bell-ring',
          title: 'Recordatorio diario personalizado',
          desc: 'Define la hora exacta a la que deseas recibir el aviso para entrenar y nunca romper el hábito.'
        }
      ]
    }
  ];

  let current = 0;

  // Create overlay element and attach to body immediately
  const overlay = document.createElement('div');
  overlay.id = 'guide-overlay';
  overlay.className = 'guide-overlay';
  document.body.appendChild(overlay);

  // Keyboard navigation
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
    }, 280);
  }

  function renderSlide(idx) {
    const s = slides[idx];
    const isFirst = idx === 0;
    const isLast = idx === slides.length - 1;

    overlay.innerHTML = `
      <div class="guide-modal-container">
        <!-- Top bar: Logo + Step Indicator + Close button -->
        <div class="guide-top-bar">
          <div class="guide-brand-chip">
            <span class="guide-badge" style="background:${s.badgeBg}; color:${s.badgeColor}; border:1px solid ${s.badgeColor}40;">
              ${s.badge}
            </span>
          </div>

          <!-- Step navigation pills (Clickable) -->
          <div class="guide-step-indicators" title="Haz clic en cualquier paso">
            ${slides.map((slide, i) => `
              <button class="guide-step-pill ${i === idx ? 'active' : ''} ${i < idx ? 'completed' : ''}" data-step="${i}" aria-label="Ir al paso ${i+1}">
                <span class="guide-step-number">${i + 1}</span>
              </button>
            `).join('')}
          </div>

          <button class="guide-close-btn" id="btn-guide-close" aria-label="Cerrar guía">
            <i data-lucide="x" style="width:18px;height:18px;"></i>
          </button>
        </div>

        <!-- Scrollable Slide Body -->
        <div class="guide-slide-body">
          <!-- Slide Header -->
          <div class="guide-slide-header">
            <div class="guide-icon-halo" style="background:${s.badgeBg}; color:${s.badgeColor}; box-shadow: 0 0 28px ${s.badgeColor}33; border: 1.5px solid ${s.badgeColor}4D;">
              <i data-lucide="${s.icon}" style="width:34px;height:34px;"></i>
            </div>
            <div class="guide-header-text">
              <span class="guide-step-label">${idx + 1} de ${slides.length}</span>
              <h2 class="guide-title">${s.title}</h2>
              <p class="guide-subtitle">${s.subtitle}</p>
            </div>
          </div>

          <!-- Slide Description -->
          <p class="guide-lead-desc">${s.desc}</p>

          <!-- Interactive Feature Cards -->
          <div class="guide-features-list">
            ${s.features.map(f => `
              <div class="guide-feature-card ${f.soundType ? 'guide-feature-sound' : ''}">
                <div class="guide-feat-icon-wrap" style="color:${s.badgeColor};">
                  <i data-lucide="${f.icon}" style="width:20px;height:20px;"></i>
                </div>
                <div class="guide-feat-content">
                  <div class="guide-feat-title">${f.title}</div>
                  <div class="guide-feat-desc">${f.desc}</div>
                  ${f.soundType ? `
                    <button class="btn btn-sm guide-sound-test-btn" data-sound="${f.soundType}" style="border: 1px solid ${s.badgeColor}66; background: ${s.badgeBg}; color: ${s.badgeColor};">
                      <i data-lucide="volume-2" style="width:14px;height:14px;"></i>
                      <span>${f.soundLabel}</span>
                    </button>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="guide-footer">
          <div class="guide-footer-row">
            ${!isFirst ? `
              <button class="btn guide-btn-prev" id="btn-guide-prev">
                <i data-lucide="chevron-left" style="width:16px;height:16px;"></i>
                Anterior
              </button>
            ` : `
              <button class="guide-skip-link" id="btn-guide-skip">
                Saltar guía
              </button>
            `}

            <button class="btn btn-primary guide-btn-next" id="btn-guide-next">
              <span>${isLast ? '¡Comenzar a Entrenar!' : 'Siguiente'}</span>
              <i data-lucide="${isLast ? 'zap' : 'chevron-right'}" style="width:18px;height:18px;"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    // Render Lucide icons
    if (window.lucide) lucide.createIcons();

    // Event Listeners (scoped to overlay for 100% reliability)
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
        if (isLast) {
          closeGuide();
        } else {
          current++;
          renderSlide(current);
        }
      });
    }

    // Step pill indicators (clickable)
    overlay.querySelectorAll('.guide-step-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        const step = parseInt(e.currentTarget.getAttribute('data-step'), 10);
        if (!isNaN(step) && step >= 0 && step < slides.length) {
          current = step;
          renderSlide(current);
        }
      });
    });

    // Sound test buttons
    overlay.querySelectorAll('.guide-sound-test-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = btn.getAttribute('data-sound');
        if (type === 'whistle' && window.FITTRACK.audio) {
          window.FITTRACK.audio.playRestStartSound();
          btn.classList.add('pulse-active');
          setTimeout(() => btn.classList.remove('pulse-active'), 500);
        } else if (type === 'bell' && window.FITTRACK.audio) {
          window.FITTRACK.audio.playBoxingBell();
          btn.classList.add('pulse-active');
          setTimeout(() => btn.classList.remove('pulse-active'), 500);
        }
      });
    });

    // Auto-scroll modal body to top on slide change
    const bodyEl = overlay.querySelector('.guide-slide-body');
    if (bodyEl) bodyEl.scrollTop = 0;
  }

  // Render initial slide
  renderSlide(0);
};

// Backwards compatibility alias for showOnboarding
window.FITTRACK.showOnboarding = function () {
  window.FITTRACK.showGuide();
};
