import { REFRESH_START_MIN, RESULT_FINAL_MIN } from './constants.js';
import { appState } from './state.js';
import {
  vnNow,
  toISO,
  toDMY,
  isTodayBeforeCutoff,
  parseISOToDate,
  getDateInput,
  getDayNameVi,
} from './date-utils.js';
import { fetchDayData } from './api.js';
import { buildDayContent, renderPanel, getDayKeyForDate } from './render.js';
import { clearRealtimeAnimationsInContainer } from './animations.js';
import { updateUI } from './navigation.js';

export async function appendDay(dateObj, forRealtime = false) {
  if (isTodayBeforeCutoff(dateObj)) {
    const yesterday = new Date(dateObj);
    yesterday.setDate(yesterday.getDate() - 1);
    return appendDay(yesterday, forRealtime);
  }

  const iso = toISO(dateObj);
  if (appState.loadedDates.has(iso) && !forRealtime) return;

  const panels = document.getElementById('panels');
  const dayKey = getDayKeyForDate(dateObj);

  if (forRealtime) {
    if (!appState.loadedDates.has(iso)) {
      const dayName = getDayNameVi(dateObj);
      const shownDate = toDMY(dateObj);
      const contentHtml = buildDayContent([], true, dayKey);
      const panelHtml = renderPanel({ iso, dayName, shownDate, contentHtml });
      panels.insertAdjacentHTML('beforeend', panelHtml);
      appState.loadedDates.add(iso);
    }
    return;
  }

  appState.loadedDates.add(iso);
  const data = await fetchDayData(dateObj);
  const contentHtml = buildDayContent(data.results, false, data.dayKey);
  const panelHtml = renderPanel({
    iso: data.iso,
    dayName: data.dayName,
    shownDate: data.shownDate,
    contentHtml,
  });
  panels.insertAdjacentHTML('beforeend', panelHtml);
}

export async function reloadDay(dateObj) {
  const iso = toISO(dateObj);
  const panel = document.querySelector(`.panel[data-iso="${iso}"]`);
  if (!panel) {
    await appendDay(dateObj);
    return;
  }
  const data = await fetchDayData(dateObj);
  const caption = panel.querySelector('.caption');
  if (caption) caption.textContent = `${data.dayName} - ${data.shownDate}`;
  clearRealtimeAnimationsInContainer(panel);
  const body = panel.querySelector('.panel-body');
  if (body) {
    body.innerHTML = buildDayContent(data.results, false, data.dayKey);
  }
}

export async function resetAndLoad(dateObj) {
  const panels = document.getElementById('panels');
  panels.innerHTML = '';
  appState.loadedDates = new Set();
  const normalized = new Date(dateObj);
  appState.baseDate = normalized;
  updateUI(appState.baseDate);

  const n = vnNow();
  const m = n.getHours() * 60 + n.getMinutes();
  const today = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const viewingStart = new Date(
    normalized.getFullYear(),
    normalized.getMonth(),
    normalized.getDate()
  );
  const isInRealtimeWindow =
    viewingStart.getTime() === todayStart.getTime() &&
    m >= REFRESH_START_MIN &&
    m < RESULT_FINAL_MIN;

  await appendDay(appState.baseDate, isInRealtimeWindow);
  appState.nextDate = new Date(appState.baseDate);
  appState.nextDate.setDate(appState.nextDate.getDate() - 1);
}

export async function loadMoreIfNeeded() {
  if (appState.isLoadingMore || !appState.nextDate) return;
  const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;
  if (!nearBottom) return;
  appState.isLoadingMore = true;
  const targetDate = new Date(appState.nextDate);
  appState.nextDate.setDate(appState.nextDate.getDate() - 1);
  try {
    await appendDay(targetDate);
  } finally {
    appState.isLoadingMore = false;
  }
}

export async function manageAutoRefresh() {
  if (appState.refreshTimer) clearInterval(appState.refreshTimer);
  if (appState.realtimeTimer) clearTimeout(appState.realtimeTimer);

  const n = vnNow();
  const m = n.getHours() * 60 + n.getMinutes();
  const viewingDate = parseISOToDate(getDateInput().value);
  const today = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const viewingStart = new Date(
    viewingDate.getFullYear(),
    viewingDate.getMonth(),
    viewingDate.getDate()
  );

  if (
    viewingStart.getTime() === todayStart.getTime() &&
    m >= REFRESH_START_MIN &&
    m < RESULT_FINAL_MIN
  ) {
    if (appState.baseDate.getTime() !== todayStart.getTime()) {
      appState.baseDate = new Date(today);
      updateUI(appState.baseDate);
    }

    const iso = toISO(appState.baseDate);
    const existingPanel = document.querySelector(`.panel[data-iso="${iso}"]`);
    if (existingPanel) {
      clearRealtimeAnimationsInContainer(existingPanel);
      existingPanel.remove();
      appState.loadedDates.delete(iso);
    }

    if (!appState.loadedDates.has(iso)) {
      await appendDay(appState.baseDate, true);
    }

    if (m < RESULT_FINAL_MIN) {
      const { startRealtimeUpdates } = await import('./realtime.js');
      await startRealtimeUpdates();
    } else {
      appState.refreshTimer = setInterval(() => reloadDay(appState.baseDate), 60000);
    }
  }
}
