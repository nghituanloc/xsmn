import { appState } from './state.js';
import { isPwaInstallable, promptPwaInstall } from './pwa-install.js';
import {
  vnNow,
  toISO,
  toDMY,
  parseISOToDate,
  normalizeBeforeDraw,
  getDateInput,
} from './date-utils.js';
import { getDayNameVi } from './date-utils.js';
import { resetAndLoad, manageAutoRefresh } from './day-loader.js';

let messageBannerTimer = null;

export function showMessageBanner(text) {
  const banner = document.getElementById('messageBanner');
  if (!banner) return;
  banner.textContent = text;
  banner.hidden = false;
  console.warn('[navigation]', text);
  if (messageBannerTimer) clearTimeout(messageBannerTimer);
  messageBannerTimer = setTimeout(() => {
    banner.hidden = true;
  }, 6000);
}

export function updateUI(dateObj) {
  const iso = toISO(dateObj);
  const input = getDateInput();
  if (input) input.value = iso;

  document.title = `KQXS MN - ${getDayNameVi(dateObj)} ${toDMY(dateObj)}`;

  refreshInstallButton();
}

export function refreshInstallButton() {
  const btn = document.getElementById('btnInstallApp');
  if (!btn) return;

  if (isPwaInstallable()) {
    btn.hidden = false;
    btn.onclick = () => promptPwaInstall();
  } else {
    btn.hidden = true;
    btn.onclick = null;
  }
}

/* Alias giữ tương thích với pwa-install.js gọi refreshNavButtons */
export const refreshNavButtons = refreshInstallButton;

export function checkFutureAndAlert(selectedDate) {
  const current = vnNow();
  const todayStart = new Date(current.getFullYear(), current.getMonth(), current.getDate());
  const selectedStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

  if (selectedStart > todayStart) {
    const diffTime = selectedStart - todayStart;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    showMessageBanner(
      `Chưa có kết quả ngày ${toDMY(selectedDate)}, vui lòng đợi ${diffDays} ngày nữa nhé!`
    );
    return true;
  }
  return false;
}

export function handleDateChange() {
  const input = getDateInput();
  if (!input.value) return;
  const d = parseISOToDate(input.value);
  if (checkFutureAndAlert(d)) {
    updateUI(appState.baseDate);
    return;
  }
  const { normalized } = normalizeBeforeDraw(d);
  resetAndLoad(normalized);
  manageAutoRefresh();
}

export function toggleDatePicker() {
  const wrap = document.getElementById('datePickerWrap');
  const btn = document.getElementById('btnPickDate');
  if (!wrap || !btn) return;
  const open = wrap.hidden;
  wrap.hidden = !open;
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) {
    const input = getDateInput();
    input?.focus();
  }
}

export function bindNavigation() {
  document.getElementById('btnPickDate')?.addEventListener('click', toggleDatePicker);
  getDateInput()?.addEventListener('change', handleDateChange);
}
