window.FITTRACK = window.FITTRACK || {};

class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.mainContent = document.getElementById('main-content');
    this._transitioning = false;
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  add(path, handler) {
    this.routes[path] = handler;
  }

  navigate(path) {
    window.location.hash = path;
  }

  handleRoute() {
    const rawPath = window.location.hash.slice(1) || '/';
    if (this.currentRoute === rawPath) return;
    this.currentRoute = rawPath;

    // Basic dynamic route parsing
    const parts = rawPath.split('/').filter(Boolean);
    let handler = null;
    let params = [];

    if (this.routes[rawPath]) {
      handler = this.routes[rawPath];
    } else if (parts.length >= 2) {
      const baseRoute = '/' + parts[0] + '/' + parts[1];
      if (this.routes[baseRoute]) {
        handler = this.routes[baseRoute];
        params = parts.slice(2);
      }
    }

    if (!handler) {
      console.warn(`[Router] No route found for: ${rawPath}`);
      this.navigate('/');
      return;
    }

    const doRender = () => {
      this._transitioning = false;
      this.mainContent.innerHTML = '';

      const viewContainer = document.createElement('div');
      viewContainer.className = 'view-container screen-enter';
      this.mainContent.appendChild(viewContainer);

      handler(viewContainer, ...params);
      this.updateNavState(rawPath);
      window.scrollTo(0, 0);
      this.mainContent.scrollTo(0, 0);
    };

    // Animate out the current view, then render new one
    const oldView = this.mainContent.querySelector('.view-container');
    if (oldView && !this._transitioning) {
      this._transitioning = true;
      oldView.classList.add('screen-exit');
      setTimeout(doRender, 130);
    } else {
      doRender();
    }
  }

  updateNavState(path) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      const route = item.getAttribute('data-route');
      if (path === route || (route !== '/' && path.startsWith(route))) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }
}

window.FITTRACK.router = new Router();
