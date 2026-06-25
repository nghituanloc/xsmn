/**
 * Hàng tên đài sticky + đồng bộ cuộn ngang + đo rộng cột theo font thực tế.
 */

const DB_SAMPLE = '012345';

function readRootPx(name, fallback) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

function measureProvinceColumnWidth() {
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const fontFamily =
    cs.getPropertyValue('--font-family').trim() || "'Be Vietnam Pro', sans-serif";
  const fontSize = cs.getPropertyValue('--font-prize').trim() || '2.75rem';
  const padInline = readRootPx('--cell-pad-inline', 0.875) * 16;

  const probe = document.createElement('span');
  probe.setAttribute('aria-hidden', 'true');
  Object.assign(probe.style, {
    position: 'absolute',
    visibility: 'hidden',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    fontFamily,
    fontSize,
    fontWeight: '900',
    letterSpacing: '0.03em',
    fontVariantNumeric: 'tabular-nums',
    left: '-9999px',
    top: '0',
  });
  probe.textContent = DB_SAMPLE;
  document.body.appendChild(probe);
  const digitWidth = probe.getBoundingClientRect().width;
  probe.remove();

  const total = Math.ceil(digitWidth + padInline * 2);
  root.style.setProperty('--col-province-w', `${total}px`);
}

function measurePrizeLabelColumnWidth() {
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const fontFamily =
    cs.getPropertyValue('--font-family').trim() || "'Be Vietnam Pro', sans-serif";
  const fontSize = cs.getPropertyValue('--font-label').trim() || '1.0625rem';

  const labels = ['ĐẶC BIỆT', 'Giải Nhất', 'Giải Nhì'];
  const probe = document.createElement('span');
  probe.setAttribute('aria-hidden', 'true');
  Object.assign(probe.style, {
    position: 'absolute',
    visibility: 'hidden',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    fontFamily,
    fontSize,
    fontWeight: '900',
    left: '-9999px',
    top: '0',
  });
  document.body.appendChild(probe);

  let max = 0;
  labels.forEach((label) => {
    probe.textContent = label;
    max = Math.max(max, probe.getBoundingClientRect().width);
  });
  probe.remove();

  const pad = 16;
  root.style.setProperty('--col-prize-w', `${Math.ceil(max + pad)}px`);
}

function syncBlockColumnLayout(block) {
  const bodyScroll = block.querySelector('.results-scroll');
  const headScroll = block.querySelector('.province-head-scroll');
  if (!bodyScroll || !headScroll) return;

  headScroll.style.width = `${bodyScroll.clientWidth}px`;

  block.querySelectorAll('.results-table').forEach((table) => {
    table.style.width = '';
  });
}

function bindHorizontalScroll(block) {
  if (block.dataset.scrollSync === '1') return;
  const headScroll = block.querySelector('.province-head-scroll');
  const bodyScroll = block.querySelector('.results-scroll');
  if (!headScroll || !bodyScroll) return;

  block.dataset.scrollSync = '1';
  syncBlockColumnLayout(block);
  let syncing = false;

  const mirror = (from, to) => {
    if (syncing) return;
    syncing = true;
    to.scrollLeft = from.scrollLeft;
    syncing = false;
  };

  bodyScroll.addEventListener('scroll', () => mirror(bodyScroll, headScroll), {
    passive: true,
  });
  headScroll.addEventListener('scroll', () => mirror(headScroll, bodyScroll), {
    passive: true,
  });
}

function updatePanel(panel) {
  const caption = panel.querySelector('.caption-sticky');
  const headWrap = panel.querySelector('.province-head-sticky');
  const dbRow = panel.querySelector('.results-table-db tr[data-prize-key="0"]');
  if (!caption || !headWrap) return;

  panel.querySelectorAll('.results-block').forEach((block) => {
    bindHorizontalScroll(block);
    syncBlockColumnLayout(block);
  });

  if (!dbRow) {
    panel.classList.remove('province-sticky-off');
    return;
  }

  const cap = caption.getBoundingClientRect();
  const headH = headWrap.offsetHeight || 0;
  const dbTop = dbRow.getBoundingClientRect().top;
  const releaseLine = cap.bottom + headH;
  panel.classList.toggle('province-sticky-off', dbTop <= releaseLine + 2);
}

export function resetStickyProvincePanel(panel) {
  if (!panel) return;
  panel.querySelectorAll('.results-block').forEach((block) => {
    delete block.dataset.scrollSync;
    block.querySelectorAll('.results-table').forEach((table) => {
      table.style.width = '';
    });
  });
  panel.classList.remove('province-sticky-off');
}

function remeasureColumns() {
  measureProvinceColumnWidth();
  measurePrizeLabelColumnWidth();
  document.querySelectorAll('.day-panel').forEach(updatePanel);
}

export function initStickyProvinceHeaders() {
  const runMeasure = () => {
    if (document.fonts?.ready) {
      document.fonts.ready.then(remeasureColumns).catch(remeasureColumns);
    } else {
      remeasureColumns();
    }
  };

  runMeasure();

  window.addEventListener('scroll', () => {
    document.querySelectorAll('.day-panel').forEach(updatePanel);
  }, { passive: true });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(runMeasure, 120);
  }, { passive: true });

  const panels = document.getElementById('panels');
  if (panels) {
    const mo = new MutationObserver((mutations) => {
      const structureChanged = mutations.some(
        (m) =>
          m.type === 'childList' && (m.addedNodes.length > 0 || m.removedNodes.length > 0)
      );
      if (structureChanged) {
        runMeasure();
      } else {
        document.querySelectorAll('.day-panel').forEach(updatePanel);
      }
    });
    mo.observe(panels, { childList: true, subtree: true });
  }
}
