window.FITTRACK = window.FITTRACK || {};

// Custom Modal Dialog System for FITTRACK
window.FITTRACK.alert = function(message, title = 'FITTRACK') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'bottom-sheet-overlay';
    overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.75); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); z-index:var(--z-modal); display:flex; align-items:center; justify-content:center; padding:1.25rem; animation:overlayIn 180ms ease;';

    overlay.innerHTML = `
      <div style="background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-2xl); width:100%; max-width:380px; padding:1.5rem; box-shadow:var(--shadow-lg); animation:modalSlideUp 220ms ease; display:flex; flex-direction:column; gap:1rem;">
        <div style="font-weight:700; font-size:1.1rem; color:var(--color-text-1);">${title}</div>
        <div style="font-size:0.9rem; color:var(--color-text-2); line-height:1.4;">${message}</div>
        <button id="btn-dialog-ok" class="btn btn-primary btn-block" style="margin-top:0.5rem; font-weight:700;">Aceptar</button>
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
    overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.75); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); z-index:var(--z-modal); display:flex; align-items:center; justify-content:center; padding:1.25rem; animation:overlayIn 180ms ease;';

    overlay.innerHTML = `
      <div style="background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-2xl); width:100%; max-width:380px; padding:1.5rem; box-shadow:var(--shadow-lg); animation:modalSlideUp 220ms ease; display:flex; flex-direction:column; gap:1rem;">
        <div style="font-weight:700; font-size:1.1rem; color:var(--color-text-1);">${title}</div>
        <div style="font-size:0.9rem; color:var(--color-text-2); line-height:1.4;">${message}</div>
        <div style="display:flex; gap:0.75rem; margin-top:0.5rem;">
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
    overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.75); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); z-index:var(--z-modal); display:flex; align-items:center; justify-content:center; padding:1.25rem; animation:overlayIn 180ms ease;';

    overlay.innerHTML = `
      <div style="background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-2xl); width:100%; max-width:400px; padding:1.5rem; box-shadow:var(--shadow-lg); animation:modalSlideUp 220ms ease; display:flex; flex-direction:column; gap:1rem;">
        <div style="font-weight:700; font-size:1.1rem; color:var(--color-text-1);">${title}</div>
        <div style="font-size:0.9rem; color:var(--color-text-2);">${message}</div>
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
  const bg = type === 'error' ? 'var(--color-error)' : type === 'warning' ? 'var(--color-warning)' : 'var(--color-primary)';
  const fg = type === 'error' || type === 'warning' ? '#FFFFFF' : '#0B0D0F';

  toast.style.cssText = `
    position: fixed;
    top: calc(var(--header-height) + env(safe-area-inset-top) + 12px);
    left: 50%;
    transform: translateX(-50%);
    background: ${bg};
    color: ${fg};
    font-weight: 700;
    font-size: 0.85rem;
    padding: 0.65rem 1.25rem;
    border-radius: var(--radius-full);
    box-shadow: var(--shadow-md);
    z-index: var(--z-toast);
    opacity: 0;
    transition: opacity 200ms ease, transform 200ms ease;
    pointer-events: none;
    white-space: nowrap;
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
