window.FITTRACK = window.FITTRACK || {};

const loadingScreen = document.getElementById('loading-screen');
const loadingFill = document.getElementById('loading-bar-fill');
const loadingStatus = document.getElementById('loading-status');
const appContainer = document.getElementById('app-container');
const loginScreen = document.getElementById('login-screen');
const btnLoginGoogle = document.getElementById('btn-login-google');
const btnProfile = document.getElementById('btn-profile');

function updateLoadingProgress(percent, statusText) {
  loadingFill.style.width = `${percent}%`;
  loadingStatus.textContent = statusText;
  const percentEl = document.getElementById('loading-percent');
  if (percentEl) percentEl.textContent = `${Math.round(percent)}%`;
}


function hideLoadingScreen() {
  updateLoadingProgress(100, 'Listo');
  setTimeout(() => {
    loadingScreen.classList.add('hidden');
  }, 400);
}

function showApp() {
  loginScreen.classList.add('d-none');
  appContainer.classList.remove('d-none');
  lucide.createIcons();
  window.FITTRACK.router.handleRoute();
}

function showLogin() {
  appContainer.classList.add('d-none');
  loginScreen.classList.remove('d-none');
}

function initRoutes() {
  window.FITTRACK.router.add('/', window.FITTRACK.screens.renderDashboard);

  window.FITTRACK.router.add('/workout', window.FITTRACK.screens.renderWorkoutSelector);

  window.FITTRACK.router.add('/workout/active', window.FITTRACK.screens.renderActiveWorkout);

  window.FITTRACK.router.add('/routines', window.FITTRACK.screens.renderRoutines);

  window.FITTRACK.router.add('/routine/new', (container) => {
    window.FITTRACK.screens.renderRoutineForm(container, false);
  });

  // Since it's a simple exact-match hash router, we need a slight tweak to handle dynamic params if we don't have a regex router.
  // Actually, our router looks for exact matches. Let's modify handleRoute in router.js, or just register the dynamic routes inside a catch-all or update the router to support dynamic segments.
  // Let's implement a workaround: we'll update the router next, but for now we'll register the routes.
  window.FITTRACK.router.add('/routine/edit', (container, id) => {
    window.FITTRACK.screens.renderRoutineForm(container, true, id);
  });

  window.FITTRACK.router.add('/routine/view', (container, id) => {
    window.FITTRACK.screens.renderRoutineView(container, id);
  });

  window.FITTRACK.router.add('/history', window.FITTRACK.screens.renderHistory);

  window.FITTRACK.router.add('/progress', window.FITTRACK.screens.renderProgress);
  
  window.FITTRACK.router.add('/profile', window.FITTRACK.screens.renderProfile);
}

async function updateSidebarUserInfo(user) {
  try {
    const profile = await window.FITTRACK.getProfile();
    const nameEl = document.getElementById('sidebar-user-name');
    const avatarEl = document.getElementById('sidebar-user-avatar');
    if (nameEl) {
      nameEl.textContent = profile.displayName || user.displayName || 'Usuario';
    }
    if (avatarEl && (profile.photoURL || user.photoURL)) {
      avatarEl.innerHTML = `<img src="${profile.photoURL || user.photoURL}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    }
  } catch(e) {
    console.warn('[App] Could not update sidebar user info:', e);
  }
}

async function bootstrap() {
  updateLoadingProgress(20, 'Cargando preferencias...');
  window.FITTRACK.initTheme();
  
  updateLoadingProgress(50, 'Verificando sesión...');
  
  window.FITTRACK.onAuthStateChanged(async (user) => {
    updateLoadingProgress(90, 'Preparando entorno...');
    
    if (user) {
      console.log('[App] User signed in:', user.email);
      initRoutes();
      showApp();
      updateSidebarUserInfo(user);
    } else {
      console.log('[App] No user signed in');
      showLogin();
    }
    
    hideLoadingScreen();
  });

  btnLoginGoogle.addEventListener('click', async () => {
    try {
      btnLoginGoogle.innerHTML = '<div class="spinner"></div>';
      btnLoginGoogle.disabled = true;
      await window.FITTRACK.signInWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
      btnLoginGoogle.innerHTML = 'Error. Intentar de nuevo.';
      btnLoginGoogle.disabled = false;
    }
  });
  
  btnProfile.addEventListener('click', () => {
    window.FITTRACK.router.navigate('/profile');
  });
}

document.addEventListener('DOMContentLoaded', bootstrap);
