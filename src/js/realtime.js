import { DAY_MAP, JS_DAY_KEY, PRIZES, REALTIME_API_URL } from './constants.js';
import { appState } from './state.js';
import { toISO } from './date-utils.js';
import { ensureRealtimeLayout, getRealtimeCell } from './render.js';
import { appendDay, reloadDay } from './day-loader.js';
import { clearRealtimeAnimationsInContainer } from './animations.js';

export { clearRealtimeAnimationsInContainer };

function formatRealtimeValue(value) {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return value.map((v) => formatRealtimeValue(v)).join('<br>');
  if (typeof value === 'number') return String(value);
  let s = String(value).trim();
  s = s.split(/\s*-\s*/).join('<br>');
  return s;
}

function stopRealtimeAnimationForCell(cell) {
  const state = appState.realtimeAnimatingCells.get(cell);
  if (!state) return;
  clearInterval(state.timerId);
  appState.realtimeAnimatingCells.delete(cell);
}

function cleanupDetachedRealtimeAnimations() {
  for (const [cell, state] of appState.realtimeAnimatingCells.entries()) {
    if (!document.body.contains(cell)) {
      clearInterval(state.timerId);
      appState.realtimeAnimatingCells.delete(cell);
    }
  }
}

function animatePlusTemplate(template) {
  return template.replace(/\+/g, () => String(Math.floor(Math.random() * 10)));
}

function applyRealtimeValueToCell(cell, rawValue) {
  const valueTemplate = formatRealtimeValue(rawValue);
  if (valueTemplate === '') {
    stopRealtimeAnimationForCell(cell);
    return valueTemplate;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (valueTemplate.includes('+') && !reducedMotion) {
    const state = appState.realtimeAnimatingCells.get(cell);
    if (!state || state.template !== valueTemplate) {
      stopRealtimeAnimationForCell(cell);
      const render = () => {
        cell.innerHTML = animatePlusTemplate(valueTemplate);
      };
      render();
      const timerId = setInterval(render, 90);
      appState.realtimeAnimatingCells.set(cell, { timerId, template: valueTemplate });
    }
    return valueTemplate;
  }

  stopRealtimeAnimationForCell(cell);
  cell.innerHTML = valueTemplate;
  return valueTemplate;
}

export function updateRealtimeResults(data) {
  if (!data || !data.kq) return;
  cleanupDetachedRealtimeAnimations();

  const iso = toISO(appState.baseDate);
  let panel = document.querySelector(`.panel[data-iso="${iso}"]`);
  if (!panel) {
    if (!appState.loadedDates.has(iso)) {
      appendDay(appState.baseDate, true).then(() => updateRealtimeResults(data));
    } else {
      setTimeout(() => updateRealtimeResults(data), 300);
    }
    return;
  }

  const dayKey = JS_DAY_KEY[appState.baseDate.getDay()];
  const fallbackProvinceList = DAY_MAP[dayKey] || [];
  const provinceIds = data.tinh ? data.tinh.split(',').map((x) => x.trim()).filter(Boolean) : [];
  let provinceNames = provinceIds.map((id, idx) => {
    const numericIndex = parseInt(id, 10) - 1;
    if (!isNaN(numericIndex) && fallbackProvinceList[numericIndex]) return fallbackProvinceList[numericIndex].n;
    if (fallbackProvinceList[idx]) return fallbackProvinceList[idx].n;
    return `Đài ${id}`;
  });
  if (provinceNames.length === 0) {
    provinceNames = fallbackProvinceList.map((p) => p.n);
  }
  if (provinceNames.length === 0) return;

  const cardsRoot = ensureRealtimeLayout(panel, provinceNames);
  if (!cardsRoot) return;

  provinceNames.forEach((_, arrayPos) => {
    const provinceKey = provinceIds[arrayPos] || String(arrayPos + 1);
    const provinceData = data.kq && (data.kq[provinceKey] || data.kq[arrayPos] || data.kq[arrayPos + 1]);
    if (!provinceData) return;

    PRIZES.forEach((prize) => {
      const cell = getRealtimeCell(panel, arrayPos, prize.api);
      if (!cell) return;
      const value = applyRealtimeValueToCell(cell, provinceData[prize.api]);
      if (value === '') return;
      if (prize.cls) {
        cell.className = `prize-value ${prize.cls}`;
      } else {
        cell.className = 'prize-value';
      }
    });
  });
}

export async function startRealtimeUpdates() {
  appState.realtimeCounter = 0;
  const iso = toISO(appState.baseDate);
  if (!appState.loadedDates.has(iso)) {
    await appendDay(appState.baseDate, true);
  }
  setTimeout(() => loadRealtimeData(), 300);
}

export async function loadRealtimeData() {
  if (appState.realtimeTimer) clearTimeout(appState.realtimeTimer);

  appState.realtimeCounter += 1;
  const url = `${REALTIME_API_URL}?_=${Date.now()}_${appState.realtimeCounter}`;

  try {
    if (!window.kqxs || typeof window.kqxs !== 'object') {
      window.kqxs = {};
    }
    delete window.kqxs.mn;

    const script = document.createElement('script');
    script.async = true;
    script.src = url;
    script.onerror = () => {
      if (script.parentNode) document.body.removeChild(script);
      console.error('[realtime] script load failed', { url });
      appState.realtimeTimer = setTimeout(loadRealtimeData, 5000);
    };
    script.onload = () => {
      let retryCount = 0;
      const maxRetries = 10;
      const checkData = () => {
        if (script.parentNode) document.body.removeChild(script);

        if (window.kqxs && window.kqxs.mn) {
          const data = window.kqxs.mn;

          if (data.run === 0 || !data.kq) {
            if (appState.realtimeTimer) clearTimeout(appState.realtimeTimer);
            appState.realtimeTimer = null;
            reloadDay(appState.baseDate);
            return;
          }

          updateRealtimeResults(data);
          const delay = data.delay || 3000;
          appState.realtimeTimer = setTimeout(loadRealtimeData, delay);
        } else if (retryCount < maxRetries) {
          retryCount += 1;
          setTimeout(checkData, 100);
        } else {
          console.warn('[realtime] no data after retries', { url });
          appState.realtimeTimer = setTimeout(loadRealtimeData, 5000);
        }
      };

      setTimeout(checkData, 100);
    };
    document.body.appendChild(script);
  } catch (e) {
    console.error('[realtime] loadRealtimeData error', e);
    appState.realtimeTimer = setTimeout(loadRealtimeData, 5000);
  }
}
