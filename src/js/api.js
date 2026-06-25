import { DAY_MAP, JS_DAY_KEY } from './constants.js';
import { toISO, isoToDmyDash, toDMY, parseISOToDate, getDayNameVi } from './date-utils.js';

function prettify(s) {
  return s ? s.split('-').map((x) => x.trim()).join('<br>') : '';
}

function pickText(box, sel) {
  const el = box.querySelector(sel);
  return (el?.textContent || '').replace(/\s+/g, ' ').trim();
}

function assertJQueryReady() {
  if (!window.jQuery || !window.$) {
    console.error('[api] jQuery chưa sẵn sàng — script minhngoc cần $');
    return false;
  }
  return true;
}

export function loadProvince(slug, dmyDash) {
  return new Promise((resolve) => {
    if (!assertJQueryReady()) {
      resolve(null);
      return;
    }

    const scratch = document.getElementById('scratch');
    scratch.id = 'box_kqxs_minhngoc';
    const s = document.createElement('script');
    s.src = dmyDash
      ? `https://www.minhngoc.com.vn/getkqxs/${slug}/${dmyDash}.js`
      : `https://www.minhngoc.com.vn/getkqxs/${slug}.js`;
    s.onerror = () => {
      const holder = document.getElementById('box_kqxs_minhngoc');
      if (holder) holder.id = 'scratch';
      console.error('[api] loadProvince failed', { slug, dmyDash });
      resolve(null);
    };
    s.onload = () => {
      if (s.parentNode) s.parentNode.removeChild(s);
      const holder = document.getElementById('box_kqxs_minhngoc');
      if (holder) holder.id = 'scratch';
      const boxes = scratch.querySelectorAll('.box_kqxs_mini');
      const box = boxes.length ? boxes[boxes.length - 1] : null;
      if (!box) {
        console.error('[api] loadProvince: no .box_kqxs_mini after script', { slug, dmyDash });
        resolve(null);
        return;
      }
      const title = (box.querySelector('.title')?.textContent || '').trim();
      const m = title.match(/KQXS\s+(.+?)\s+(\d{2}\/\d{2}\/\d{4})/i);
      const province = m ? m[1] : slug;
      const dateText = m ? m[2] : '';
      resolve({
        province,
        date: dateText,
        g8: prettify(pickText(box, '.giai8')),
        g7: prettify(pickText(box, '.giai7')),
        g6: prettify(pickText(box, '.giai6')),
        g5: prettify(pickText(box, '.giai5')),
        g4: prettify(pickText(box, '.giai4')),
        g3: prettify(pickText(box, '.giai3')),
        g2: prettify(pickText(box, '.giai2')),
        g1: prettify(pickText(box, '.giai1')),
        db: prettify(pickText(box, '.giaidb')),
      });
    };
    document.body.appendChild(s);
  });
}

export async function fetchDayData(dateObj) {
  const iso = toISO(dateObj);
  const dash = isoToDmyDash(iso);
  const dayKey = JS_DAY_KEY[dateObj.getDay()];
  const list = DAY_MAP[dayKey] || [];
  const scratch = document.getElementById('scratch');
  scratch.innerHTML = '';
  const results = [];
  for (const p of list) {
    const data = await loadProvince(p.s, dash);
    if (data) results.push(data);
  }
  const dayName = getDayNameVi(dateObj);
  const shownDate = (iso && toDMY(parseISOToDate(iso))) || '';
  return { iso, dayName, shownDate, results, dayKey };
}
