import { REFRESH_START_MIN, DAY_NAMES_VI } from './constants.js';

export { REFRESH_START_MIN };

export function vnNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
}

export function pad(n) {
  return n < 10 ? `0${n}` : String(n);
}

export function toDMY(d) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function toISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISOToDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function isoToDmyDash(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}

export function isTodayBeforeCutoff(dateObj) {
  const now = vnNow();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const selectedStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return selectedStart.getTime() === todayStart.getTime() && currentMinutes < REFRESH_START_MIN;
}

export function normalizeBeforeDraw(dateObj) {
  if (isTodayBeforeCutoff(dateObj)) {
    const yesterday = new Date(dateObj);
    yesterday.setDate(yesterday.getDate() - 1);
    return { normalized: yesterday, redirected: true };
  }
  return { normalized: dateObj, redirected: false };
}

export function getDateInput() {
  return document.getElementById('date');
}

/** Tên thứ tiếng Việt (CHỦ NHẬT, THỨ 2, ...) theo Date.getDay() */
export function getDayNameVi(dateObj) {
  return DAY_NAMES_VI[dateObj.getDay()] || '';
}
