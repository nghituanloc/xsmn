import { appState } from './js/state.js';
import { updateUI, bindNavigation } from './js/navigation.js';
import { resetAndLoad, manageAutoRefresh } from './js/day-loader.js';
import {
  registerServiceWorker,
  detectInstalledMode,
  setupVisibilityRefresh,
  setupPullToRefresh,
  setupInfiniteScroll,
} from './js/pwa-scroll.js';
import { setupPwaInstallPrompt } from './js/pwa-install.js';
import { initStickyProvinceHeaders } from './js/sticky-province.js';

window.addEventListener('load', () => {
  registerServiceWorker();
  detectInstalledMode();
  setupPwaInstallPrompt();
  setupVisibilityRefresh();
  setupPullToRefresh();
  bindNavigation();
  resetAndLoad(appState.baseDate);
  manageAutoRefresh();
  setupInfiniteScroll();
  initStickyProvinceHeaders();
});
