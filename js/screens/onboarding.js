window.FITTRACK = window.FITTRACK || {};

/**
 * FITTRACK — Onboarding
 * 3-step premium intro for first-time users.
 * Shows once, then sets localStorage flag.
 */

const _OB_KEY = 'fittrack_onboarding_done';

window.FITTRACK.isOnboardingDone = function () {
  return localStorage.getItem(_OB_KEY) === '1';
};

window.FITTRACK.markOnboardingDone = function () {
  localStorage.setItem(_OB_KEY, '1');
};

window.FITTRACK.showOnboarding = function () {
  const existing = document.getElementById('onboarding-overlay');
  if (existing) existing.remove();

  const steps = [
    {
      color: '#B7FF3A',
      bg: 'rgba(183,255,58,0.10)',
      icon: `<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 12h6"/><path d="M9 16h4"/></svg>`,
      title: 'Creá tu rutina',
      desc:  'Diseñá tu programa personalizado con ejercicios, series, repeticiones y tiempos de descanso.'
    },
    {
      color: '#38BDF8',
      bg: 'rgba(56,189,248,0.10)',
      icon: `<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/><path d="M3 9.5v5"/><path d="M21 9.5v5"/><path d="M3 9.5a2 2 0 0 1 2-2h1.5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5z"/><path d="M15.5 9.5a2 2 0 0 1 2-2H19a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1.5a2 2 0 0 1-2-2v-5z"/></svg>`,
      title: 'Entrenás con seguimiento',
      desc:  'Registrá cada serie en tiempo real. El cronómetro de descanso te avisa exactamente cuándo seguir.'
    },
    {
      color: '#A78BFA',
      bg: 'rgba(167,139,250,0.10)',
      icon: `<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
      title: 'Medí tu progreso',
      desc:  'Revisá tu historial, la evolución de tu cuerpo y las estadísticas de cada sesión para seguir mejorando.'
    }
  ];

  let current = 0;

  const overlay = document.createElement('div');
  overlay.id = 'onboarding-overlay';
  overlay.className = 'onboarding-overlay';

  function renderStep(idx) {
    const s = steps[idx];
    const isLast = idx === steps.length - 1;

    overlay.innerHTML = `
      <!-- Logo top -->
      <div class="onboarding-logo-mark">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" width="40" height="40" fill="none">
          <rect width="56" height="56" rx="12" fill="#0B0F0D"/>
          <g transform="translate(5,6) scale(0.9)">
            <polygon points="6,48 14,12 22,12 14,48" fill="#B7FF3A"/>
            <polygon points="14,12 38,12 36,19 12,19" fill="#B7FF3A"/>
            <polygon points="11,29 32,29 30,36 9,36" fill="#B7FF3A"/>
            <polygon points="28,48 34,20 41,20 35,48" fill="#B7FF3A"/>
            <polygon points="34,20 52,20 50,27 32,27" fill="#B7FF3A"/>
            <polygon points="31,36 48,36 46,42 29,42" fill="#B7FF3A"/>
          </g>
        </svg>
      </div>

      <!-- Step card -->
      <div class="onboarding-card" style="animation: obStepIn 0.38s cubic-bezier(0.16,1,0.3,1) both;">
        <div class="onboarding-icon-wrap" style="background:${s.bg}; color:${s.color};">
          ${s.icon}
        </div>
        <h2 class="onboarding-title">${s.title}</h2>
        <p class="onboarding-desc">${s.desc}</p>
      </div>

      <!-- Dots -->
      <div class="onboarding-dots">
        ${steps.map((_, i) => `<div class="onboarding-dot ${i === idx ? 'active' : ''}"></div>`).join('')}
      </div>

      <!-- Actions -->
      <div class="onboarding-actions">
        <button class="btn btn-primary btn-block" id="ob-next" style="border-radius:20px; padding:1rem 1.5rem; font-size:1rem; font-weight:800; letter-spacing:0.02em;">
          ${isLast ? '¡Empezar!' : 'Siguiente'}
        </button>
        ${!isLast ? `<button class="ob-skip-btn" id="ob-skip">Omitir</button>` : ''}
      </div>
    `;

    document.getElementById('ob-next').addEventListener('click', () => {
      if (isLast) { finishOnboarding(); }
      else { current++; renderStep(current); }
    });

    const skipBtn = document.getElementById('ob-skip');
    if (skipBtn) skipBtn.addEventListener('click', finishOnboarding);
  }

  function finishOnboarding() {
    window.FITTRACK.markOnboardingDone();
    overlay.style.transition = 'opacity 0.35s ease';
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 360);
  }

  renderStep(0);
  document.body.appendChild(overlay);
};
