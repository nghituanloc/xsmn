import { DAY_MAP, JS_DAY_KEY, PRIZES } from './constants.js';
import { resetStickyProvincePanel } from './sticky-province.js';

const REGULAR_PRIZES = PRIZES.filter((p) => p.k !== 'db');
const DB_PRIZE = PRIZES.find((p) => p.k === 'db');

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildColgroup(provinceCount) {
  const provinceCols = Array.from({ length: provinceCount }, () => '<col class="col-province">').join(
    ''
  );
  return `<colgroup><col class="col-prize">${provinceCols}</colgroup>`;
}

function resultsTableWidthStyle(provinceCount) {
  return `--province-count: ${provinceCount}`;
}

function buildPrizeRows(provinceEntries, prizes) {
  return prizes
    .map((prize) => {
      const cells = provinceEntries
        .map((p) => {
          const value = p.data ? p.data[prize.k] || '' : '';
          const cls = prize.cls ? `prize-value ${prize.cls}` : 'prize-value';
          return `<td class="${cls}" data-province-index="${p.index}" data-prize-key="${prize.api}" data-cell>${value}</td>`;
        })
        .join('');
      return `
      <tr data-prize-key="${prize.api}">
        <th class="prize-label" scope="row">${escapeHtml(prize.n)}</th>
        ${cells}
      </tr>`;
    })
    .join('');
}

function buildProvinceThead(provinceEntries) {
  return `
    <thead class="province-thead">
      <tr>
        <th class="prize-col" scope="col"><span class="visually-hidden">Giải</span></th>
        ${provinceEntries
          .map(
            (p) =>
              `<th class="province-col" scope="col" data-province-index="${p.index}">${escapeHtml(p.name)}</th>`
          )
          .join('')}
      </tr>
    </thead>`;
}

function buildResultsTable(provinceEntries) {
  const n = provinceEntries.length;
  const colgroup = buildColgroup(n);
  const thead = buildProvinceThead(provinceEntries);
  const mainRows = buildPrizeRows(provinceEntries, REGULAR_PRIZES);
  const dbRows = DB_PRIZE ? buildPrizeRows(provinceEntries, [DB_PRIZE]) : '';

  return `
    <div class="results-block" style="${resultsTableWidthStyle(n)}">
      <div class="province-head-sticky">
        <div class="province-head-scroll">
          <table class="results-table results-table-head">
            ${colgroup}
            ${thead}
          </table>
        </div>
      </div>
      <div class="results-scroll">
        <table class="results-table results-table-main">
          ${colgroup}
          <tbody>${mainRows}</tbody>
        </table>
        ${
          dbRows
            ? `<table class="results-table results-table-db" aria-label="Giải đặc biệt">
          ${colgroup}
          <tbody>${dbRows}</tbody>
        </table>`
            : ''
        }
      </div>
    </div>`;
}

function provinceEntriesFromCols(cols) {
  return cols.map((c, i) => ({ name: c.province, index: i, data: c }));
}

function provinceEntriesFromList(list) {
  return list.map((p, i) => ({ name: p.n, index: i, data: null }));
}

export function buildDayContent(cols, forRealtime, dayKey) {
  if (!cols || cols.length === 0) {
    if (forRealtime) {
      const provinceList = DAY_MAP[dayKey] || [];
      if (provinceList.length === 0) {
        return '<p class="empty-message">Chưa có dữ liệu, vui lòng thử lại sau.</p>';
      }
      return buildResultsTable(provinceEntriesFromList(provinceList));
    }
    return '<p class="empty-message">Chưa có dữ liệu, vui lòng thử lại sau.</p>';
  }

  return buildResultsTable(provinceEntriesFromCols(cols));
}

export function renderPanel({ iso, dayName, shownDate, contentHtml }) {
  const captionId = `caption-${iso}`;
  return `
    <section class="panel day-panel" data-iso="${iso}" role="region" aria-labelledby="${captionId}">
      <h2 id="${captionId}" class="caption caption-sticky">${escapeHtml(dayName)} - ${escapeHtml(shownDate)}</h2>
      <div class="panel-body">${contentHtml}</div>
    </section>`;
}

export function ensureRealtimeLayout(panel, provinceNames) {
  if (!panel) return null;
  const body = panel.querySelector('.panel-body');
  if (!body) return null;

  const headers = body.querySelectorAll('.results-table-head .province-col');
  const existingNames = Array.from(headers).map((th) => th.textContent.trim());

  const needsRebuild =
    headers.length !== provinceNames.length ||
    existingNames.some((n, i) => n !== provinceNames[i]);

  if (needsRebuild) {
    const entries = provinceNames.map((name, index) => ({ name, index, data: null }));
    body.innerHTML = buildResultsTable(entries);
    resetStickyProvincePanel(panel);
  }

  return body.querySelector('.results-table-main');
}

export function getRealtimeCell(panel, provinceIndex, prizeApi) {
  const row = panel.querySelector(`tr[data-prize-key="${prizeApi}"]`);
  if (!row) return null;
  return row.querySelector(`td[data-province-index="${provinceIndex}"][data-cell]`);
}

export function getDayKeyForDate(dateObj) {
  return JS_DAY_KEY[dateObj.getDay()];
}
