window.FITTRACK = window.FITTRACK || {};
window.FITTRACK.pwa = window.FITTRACK.pwa || {};

let deferredPrompt = null;

// Detect platform
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

// Listen to beforeinstallprompt on Android/Chrome
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  window.FITTRACK.pwa.deferredPrompt = e;
  console.log('[PWA] beforeinstallprompt captured');
  
  // Show install banner if not in standalone
  if (!isStandalone) {
    window.FITTRACK.pwa.showInstallBanner();
  }
});

// Detect when PWA is installed
window.addEventListener('appinstalled', () => {
  console.log('[PWA] App successfully installed!');
  deferredPrompt = null;
  const banner = document.getElementById('pwa-install-banner');
  if (banner) banner.remove();
});

// Trigger native prompt
window.FITTRACK.pwa.promptInstall = async function() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] User response:', outcome);
    deferredPrompt = null;
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.remove();
  } else if (isIOS) {
    window.FITTRACK.pwa.showIOSInstallModal();
  } else {
    alert('Abre el menú de tu navegador (⋮ o compartir) y selecciona "Añadir a la pantalla de inicio" o "Instalar aplicación".');
  }
};

// Floating install banner
window.FITTRACK.pwa.showInstallBanner = function() {
  if (isStandalone || document.getElementById('pwa-install-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.style.cssText = `
    position: fixed;
    bottom: calc(var(--nav-height) + env(safe-area-inset-bottom) + 12px);
    left: 16px;
    right: 16px;
    max-width: 440px;
    margin: 0 auto;
    background: var(--color-surface);
    border: 1px solid var(--color-primary);
    border-radius: var(--radius-xl);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    box-shadow: var(--shadow-lg), 0 0 20px rgba(183,243,74,0.15);
    z-index: calc(var(--z-sticky) + 50);
    animation: slideUpBanner 300ms cubic-bezier(0.34, 1.2, 0.64, 1);
  `;

  banner.innerHTML = `
    <div style="display:flex; align-items:center; gap:10px;">
      <div style="width:38px; height:38px; background:var(--color-primary); border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B0D0F" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      </div>
      <div>
        <div style="font-weight:700; font-size:0.875rem; color:var(--color-text-1);">Instalar FITTRACK</div>
        <div style="font-size:0.75rem; color:var(--color-text-2);">Usá la app sin internet como app nativa.</div>
      </div>
    </div>
    <div style="display:flex; align-items:center; gap:6px;">
      <button id="btn-pwa-banner-install" class="btn btn-primary btn-sm" style="padding:0.4rem 0.75rem; font-size:0.75rem;">
        Instalar
      </button>
      <button id="btn-pwa-banner-close" style="background:none; border:none; color:var(--color-text-3); padding:4px; cursor:pointer;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById('btn-pwa-banner-install').addEventListener('click', () => {
    window.FITTRACK.pwa.promptInstall();
  });

  document.getElementById('btn-pwa-banner-close').addEventListener('click', () => {
    banner.remove();
  });
};

// Show iOS install instructions sheet
window.FITTRACK.pwa.showIOSInstallModal = function() {
  const overlay = document.createElement('div');
  overlay.className = 'bottom-sheet-overlay';
  overlay.style.zIndex = 'var(--z-modal)';

  overlay.innerHTML = `
    <div class="bottom-sheet" style="padding: 1.5rem 1.25rem;">
      <div class="flex-row justify-between items-center mb-4">
        <h3 class="text-xl font-bold">Instalar FITTRACK en iPhone / iPad</h3>
        <button id="btn-close-ios-modal" class="btn-icon text-color-3"><i data-lucide="x"></i></button>
      </div>
      <p class="text-color-2 text-sm mb-4">Sigue estos sencillos pasos para tener FITTRACK en tu pantalla de inicio como una aplicación nativa:</p>

      <div class="flex-col gap-3 mb-6">
        <div class="card p-3 flex-row items-center gap-3">
          <div style="width:32px; height:32px; border-radius:50%; background:var(--color-primary-dim); color:var(--color-primary); display:flex; align-items:center; justify-content:center; font-weight:700; flex-shrink:0;">1</div>
          <div class="text-sm text-color-1">
            Toca el botón <strong>Compartir</strong> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" style="display:inline; vertical-align:middle;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> en la barra inferior de Safari.
          </div>
        </div>

        <div class="card p-3 flex-row items-center gap-3">
          <div style="width:32px; height:32px; border-radius:50%; background:var(--color-primary-dim); color:var(--color-primary); display:flex; align-items:center; justify-content:center; font-weight:700; flex-shrink:0;">2</div>
          <div class="text-sm text-color-1">
            Desplázate hacia abajo y selecciona <strong>"Agregar a inicio"</strong> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" style="display:inline; vertical-align:middle;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>.
          </div>
        </div>

        <div class="card p-3 flex-row items-center gap-3">
          <div style="width:32px; height:32px; border-radius:50%; background:var(--color-primary-dim); color:var(--color-primary); display:flex; align-items:center; justify-content:center; font-weight:700; flex-shrink:0;">3</div>
          <div class="text-sm text-color-1">
            Confirma tocando <strong>"Agregar"</strong> en la esquina superior derecha. ¡Listo!
          </div>
        </div>
      </div>

      <button id="btn-done-ios-modal" class="btn btn-primary btn-block">Entendido</button>
    </div>
  `;

  document.body.appendChild(overlay);

  if (window.lucide) lucide.createIcons();

  const close = () => {
    overlay.remove();
  };

  document.getElementById('btn-close-ios-modal').addEventListener('click', close);
  document.getElementById('btn-done-ios-modal').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
};

// Check if iOS or show install on load
setTimeout(() => {
  if (isIOS && !isStandalone) {
    window.FITTRACK.pwa.showInstallBanner();
  }
}, 3000);
