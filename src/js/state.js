import { vnNow, REFRESH_START_MIN } from './date-utils.js';

function initialBaseDate() {
  const base = vnNow();
  const currentMinutes = base.getHours() * 60 + base.getMinutes();
  if (currentMinutes < REFRESH_START_MIN) {
    base.setDate(base.getDate() - 1);
  }
  return base;
}

export const appState = {
  baseDate: initialBaseDate(),
  loadedDates: new Set(),
  nextDate: null,
  isLoadingMore: false,
  scrollAttached: false,
  hideTopTimer: null,
  lastScrollY: 0,
  realtimeCounter: 0,
  realtimeTimer: null,
  realtimeAnimatingCells: new Map(),
  refreshTimer: null,
  appInstalled: false,
  deferredInstallPrompt: null,
  pullStartY: null,
  isPulling: false,
  isRefreshing: false,
  currentPullDistance: 0,
  lastVisibilityRefresh: 0,
  lastBackgroundTime: 0,
};
