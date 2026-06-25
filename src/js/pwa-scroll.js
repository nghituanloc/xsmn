import { PULL_THRESHOLD, VISIBILITY_REFRESH_GAP } from './constants.js';
import { appState } from './state.js';
import { parseISOToDate, getDateInput } from './date-utils.js';
import { reloadDay, manageAutoRefresh, loadMoreIfNeeded } from './day-loader.js';

const pullIndicator = document.getElementById('pullIndicator');
const btnTop = document.getElementById('btnTop');

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker
    .register('service-worker.js')
    .then(() => {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    })
    .catch((err) => {
      console.error('[pwa] service worker registration failed', err);
    });
}

export function detectInstalledMode() {
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (standalone) appState.appInstalled = true;
}

export function setupInfiniteScroll() {
  if (appState.scrollAttached) return;
  appState.scrollAttached = true;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      handleScrollWork();
    });
  });
}

btnTop?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

function handleScrollWork() {
  const currentY = window.scrollY;
  const direction = currentY > appState.lastScrollY ? 'down' : 'up';
  loadMoreIfNeeded();
  toggleScrollTop(currentY, direction);
  appState.lastScrollY = currentY;
}

function toggleScrollTop(pos, direction) {
  if (!btnTop) return;
  const beyondThreshold = pos > 300;
  if (!beyondThreshold || direction === 'up') {
    hideTopButton();
    return;
  }
  showTopButton();
}

function showTopButton() {
  if (!btnTop) return;
  btnTop.style.display = 'block';
  resetHideTopTimer();
}

function hideTopButton() {
  if (!btnTop) return;
  btnTop.style.display = 'none';
  if (appState.hideTopTimer) {
    clearTimeout(appState.hideTopTimer);
    appState.hideTopTimer = null;
  }
}

function resetHideTopTimer() {
  if (appState.hideTopTimer) clearTimeout(appState.hideTopTimer);
  appState.hideTopTimer = setTimeout(() => hideTopButton(), 2000);
}

export function setupVisibilityRefresh() {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;

    const nowTs = Date.now();
    if (nowTs - appState.lastVisibilityRefresh < VISIBILITY_REFRESH_GAP) return;

    const inStandalone =
      appState.appInstalled ||
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone;
    if (!inStandalone) return;

    appState.lastVisibilityRefresh = nowTs;
    const viewingDate = parseISOToDate(getDateInput().value);
    reloadDay(viewingDate);
    manageAutoRefresh();
  });
}

export function setupPullToRefresh() {
  const supportsTouch = 'ontouchstart' in window;
  if (!supportsTouch) return;

  const start = (y) => {
    if (window.scrollY > 0 || appState.isRefreshing) return;
    appState.pullStartY = y;
    appState.isPulling = true;
    appState.currentPullDistance = 0;
    if (pullIndicator) {
      pullIndicator.textContent = 'Làm mới';
      pullIndicator.classList.add('show');
      pullIndicator.classList.remove('active');
    }
  };

  const move = (y, event) => {
    if (!appState.isPulling || appState.pullStartY === null) return;
    appState.currentPullDistance = Math.max(0, y - appState.pullStartY);
    if (appState.currentPullDistance > 0 && pullIndicator) {
      pullIndicator.classList.add('show');
      pullIndicator.classList.toggle('active', appState.currentPullDistance >= PULL_THRESHOLD);
      pullIndicator.style.transform = `translate(-50%, ${Math.min(0, appState.currentPullDistance / 2 - 100)}%)`;
    }
    if (appState.currentPullDistance > 10) {
      event?.preventDefault?.();
    }
  };

  const end = () => {
    if (!appState.isPulling) return;
    const shouldRefresh = appState.currentPullDistance >= PULL_THRESHOLD && !appState.isRefreshing;
    appState.pullStartY = null;
    appState.isPulling = false;
    appState.currentPullDistance = 0;
    if (pullIndicator) {
      pullIndicator.style.transform = 'translate(-50%, -100%)';
      pullIndicator.classList.remove('active');
      pullIndicator.classList.remove('show');
    }
    if (shouldRefresh) {
      appState.isRefreshing = true;
      if (pullIndicator) {
        pullIndicator.textContent = 'Đang làm mới...';
        pullIndicator.classList.add('show');
        pullIndicator.classList.add('active');
      }
      location.reload();
      setTimeout(() => {
        appState.isRefreshing = false;
      }, 2000);
    }
  };

  window.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches?.[0]) start(e.touches[0].clientY);
    },
    { passive: true }
  );
  window.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches?.[0]) move(e.touches[0].clientY, e);
    },
    { passive: false }
  );
  window.addEventListener('touchend', end, { passive: true });
  window.addEventListener('touchcancel', end, { passive: true });
}
