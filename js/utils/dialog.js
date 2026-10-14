window.FITTRACK = window.FITTRACK || {};

// Custom Modal Dialog System for FITTRACK (Realism Design)
window.FITTRACK.alert = function(message, title = 'FITTRACK') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'bottom-sheet-overlay';
    overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.72); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); z-index:var(--z-modal); display:flex; align-items:center; justify-content:center; padding:1.25rem; animation:overlayIn 180ms ease;';

    overlay.innerHTML = `
      <div style="background:var(--grad-card-realism); border:1px solid var(--color-border); border-radius:var(--radius-2xl); width:100%; max-width:390px; padding:1.75rem 1.5rem; box-shadow:var(--shadow-realism-card), 0 20px 40px rgba(0,0,0,0.5); animation:modalSlideUp 240ms cubic-bezier(0.16, 1, 0.3, 1) ease; display:flex; flex-direction:column; gap:1.1rem; text-align:center;">
        <div style="width:46px; height:46px; margin:0 auto; border-radius:50%; background:rgba(183,243,74,0.12); border:1px solid rgba(183,243,74,0.25); display:flex; align-items:center; justify-content:center; color:var(--color-primary); box-shadow:0 0 16px rgba(183,243,74,0.2);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        </div>
        <div>
          <div style="font-weight:800; font-size:1.2rem; color:var(--color-text-1); letter-spacing:-0.02em; margin-bottom:0.4rem;">${title}</div>
          <div style="font-size:0.92rem; color:var(--color-text-2); line-height:1.45;">${message}</div>
        </div>
        <button id="btn-dialog-ok" class="btn btn-primary btn-block" style="margin-top:0.4rem; font-weight:700;">Entendido</button>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => {
      overlay.style.opacity = '0';
      setTimeout(() => { overlay.remove(); resolve(true); }, 150);
    };

    document.getElementById('btn-dialog-ok').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  });
};

window.FITTRACK.confirm = function(message, title = 'Confirmar', confirmText = 'Aceptar', cancelText = 'Cancelar') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'bottom-sheet-overlay';
    overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.72); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); z-index:var(--z-modal); display:flex; align-items:center; justify-content:center; padding:1.25rem; animation:overlayIn 180ms ease;';

    overlay.innerHTML = `
      <div style="background:var(--grad-card-realism); border:1px solid var(--color-border); border-radius:var(--radius-2xl); width:100%; max-width:390px; padding:1.75rem 1.5rem; box-shadow:var(--shadow-realism-card), 0 20px 40px rgba(0,0,0,0.5); animation:modalSlideUp 240ms cubic-bezier(0.16, 1, 0.3, 1) ease; display:flex; flex-direction:column; gap:1.1rem; text-align:center;">
        <div style="width:46px; height:46px; margin:0 auto; border-radius:50%; background:rgba(91,167,255,0.12); border:1px solid rgba(91,167,255,0.25); display:flex; align-items:center; justify-content:center; color:var(--color-info); box-shadow:0 0 16px rgba(91,167,255,0.2);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        </div>
        <div>
          <div style="font-weight:800; font-size:1.2rem; color:var(--color-text-1); letter-spacing:-0.02em; margin-bottom:0.4rem;">${title}</div>
          <div style="font-size:0.92rem; color:var(--color-text-2); line-height:1.45;">${message}</div>
        </div>
        <div style="display:flex; gap:0.75rem; margin-top:0.4rem;">
          <button id="btn-dialog-cancel" class="btn btn-secondary" style="flex:1;">${cancelText}</button>
          <button id="btn-dialog-confirm" class="btn btn-primary" style="flex:1.2; font-weight:700;">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = (result) => {
      overlay.style.opacity = '0';
      setTimeout(() => { overlay.remove(); resolve(result); }, 150);
    };

    document.getElementById('btn-dialog-confirm').addEventListener('click', () => close(true));
    document.getElementById('btn-dialog-cancel').addEventListener('click', () => close(false));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
  });
};

window.FITTRACK.prompt = function(message, placeholder = '', defaultValue = '', title = 'FITTRACK') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'bottom-sheet-overlay';
    overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.72); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); z-index:var(--z-modal); display:flex; align-items:center; justify-content:center; padding:1.25rem; animation:overlayIn 180ms ease;';

    overlay.innerHTML = `
      <div style="background:var(--grad-card-realism); border:1px solid var(--color-border); border-radius:var(--radius-2xl); width:100%; max-width:400px; padding:1.75rem 1.5rem; box-shadow:var(--shadow-realism-card), 0 20px 40px rgba(0,0,0,0.5); animation:modalSlideUp 240ms cubic-bezier(0.16, 1, 0.3, 1) ease; display:flex; flex-direction:column; gap:1.1rem;">
        <div>
          <div style="font-weight:800; font-size:1.2rem; color:var(--color-text-1); letter-spacing:-0.02em; margin-bottom:0.4rem;">${title}</div>
          <div style="font-size:0.92rem; color:var(--color-text-2); line-height:1.45;">${message}</div>
        </div>
        <input type="text" id="dialog-prompt-input" class="input-control" placeholder="${placeholder}" value="${defaultValue}" style="width:100%;">
        <div style="display:flex; gap:0.75rem; margin-top:0.25rem;">
          <button id="btn-prompt-cancel" class="btn btn-secondary" style="flex:1;">Cancelar</button>
          <button id="btn-prompt-confirm" class="btn btn-primary" style="flex:1.2; font-weight:700;">Aceptar</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    const input = document.getElementById('dialog-prompt-input');
    setTimeout(() => { input.focus(); input.select(); }, 100);

    const close = (val) => {
      overlay.style.opacity = '0';
      setTimeout(() => { overlay.remove(); resolve(val); }, 150);
    };

    document.getElementById('btn-prompt-confirm').addEventListener('click', () => close(input.value));
    document.getElementById('btn-prompt-cancel').addEventListener('click', () => close(null));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') close(input.value); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(null); });
  });
};

// Toast Notification
window.FITTRACK.toast = function(message, type = 'success') {
  const toast = document.createElement('div');

  let bgVar, fgVar, shadowExtra;
  if (type === 'error') {
    bgVar = 'var(--color-error)';
    fgVar = '#FFFFFF';
    shadowExtra = '0 0 14px rgba(255,80,80,0.4)';
  } else if (type === 'warning') {
    bgVar = 'var(--color-warning)';
    fgVar = '#FFFFFF';
    shadowExtra = '0 0 14px rgba(255,180,0,0.4)';
  } else {
    bgVar = 'var(--grad-btn-primary-realism, var(--color-primary))';
    fgVar = 'var(--color-primary-text, #0B0D0F)';
    shadowExtra = '0 0 16px rgba(183,243,74,0.4)';
  }

  toast.style.cssText = `
    position: fixed;
    top: calc(var(--header-height) + env(safe-area-inset-top) + 12px);
    left: 50%;
    transform: translateX(-50%);
    background: ${bgVar};
    color: ${fgVar};
    font-weight: 700;
    font-size: 0.85rem;
    padding: 0.65rem 1.35rem;
    border-radius: var(--radius-full);
    border: 1px solid rgba(255,255,255,0.25);
    box-shadow:
      0 1px 0 rgba(255,255,255,0.5) inset,
      0 4px 16px rgba(0,0,0,0.3),
      ${shadowExtra};
    z-index: var(--z-toast);
    opacity: 0;
    transition: opacity 200ms ease, transform 200ms ease;
    pointer-events: none;
    white-space: nowrap;
    letter-spacing: -0.01em;
  `;
  toast.innerText = message;

  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(4px)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-8px)';
    setTimeout(() => toast.remove(), 200);
  }, 2600);
};
