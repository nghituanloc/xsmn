// --- LOGIC CÀI APP (PWA) ---
let deferredPrompt;
const btnInstall = document.getElementById('btnInstall');
const btnTop = document.getElementById('btnTop');
const btnNext = document.getElementById('btnNext');
let appInstalled = false;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  btnInstall.style.display = 'inline-block';
  refreshNavInstallButton();
});

btnInstall.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    deferredPrompt = null;
    btnInstall.style.display = 'none';
    refreshNavInstallButton();
  }
});

window.addEventListener('appinstalled', () => {
  appInstalled = true;
  deferredPrompt = null;
  btnInstall.style.display = 'none';
  refreshNavInstallButton();
});

// --- LOGIC XỔ SỐ (GIỮ NGUYÊN) ---
const DAY_MAP = {
  mon:[{n:'TP. HCM',s:'tp-hcm'},{n:'Đồng Tháp',s:'dong-thap'},{n:'Cà Mau',s:'ca-mau'}],
  tue:[{n:'Bến Tre',s:'ben-tre'},{n:'Vũng Tàu',s:'vung-tau'},{n:'Bạc Liêu',s:'bac-lieu'}],
  wed:[{n:'Đồng Nai',s:'dong-nai'},{n:'Cần Thơ',s:'can-tho'},{n:'Sóc Trăng',s:'soc-trang'}],
  thu:[{n:'Tây Ninh',s:'tay-ninh'},{n:'An Giang',s:'an-giang'},{n:'Bình Thuận',s:'binh-thuan'}],
  fri:[{n:'Vĩnh Long',s:'vinh-long'},{n:'Bình Dương',s:'binh-duong'},{n:'Trà Vinh',s:'tra-vinh'}],
  sat:[{n:'TP. HCM',s:'tp-hcm'},{n:'Long An',s:'long-an'},{n:'Bình Phước',s:'binh-phuoc'},{n:'Hậu Giang',s:'hau-giang'}],
  sun:[{n:'Tiền Giang',s:'tien-giang'},{n:'Kiên Giang',s:'kien-giang'},{n:'Đà Lạt',s:'da-lat'}]
};
const JS_DAY_KEY = ['sun','mon','tue','wed','thu','fri','sat'];
const DAY_NAMES_VI = ['CHỦ NHẬT', 'THỨ 2', 'THỨ 3', 'THỨ 4', 'THỨ 5', 'THỨ 6', 'THỨ 7'];

const REFRESH_START_MIN = 16*60 + 15; 
const RESULT_FINAL_MIN = 16*60 + 45;

function vnNow(){ return new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Ho_Chi_Minh'})); }
function pad(n){return n<10?('0'+n):n}
function toDMY(d){return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`}
function toISO(d){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
function parseISOToDate(iso){ const [y,m,d] = iso.split('-').map(Number); return new Date(y, (m||1)-1, d||1); }
function isoToDmyDash(iso){ if(!iso) return ''; const [y,m,d] = iso.split('-'); return `${d}-${m}-${y}`; }

let baseDate = vnNow();
const now = vnNow();
if((now.getHours()*60 + now.getMinutes()) < REFRESH_START_MIN){
  baseDate.setDate(baseDate.getDate()-1);
}
let currentDay = JS_DAY_KEY[baseDate.getDay()];

let loadedDates = new Set();
let nextDate = null;
let isLoadingMore = false;
let scrollAttached = false;
let hideTopTimer = null;
let lastScrollY = 0;

window.addEventListener('load', () => { registerServiceWorker(); detectInstalledMode(); resetAndLoad(baseDate); manageAutoRefresh(); setupInfiniteScroll(); });

function registerServiceWorker(){
  if(!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('service-worker.js').catch(()=>{});
}

function detectInstalledMode(){
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if(standalone){ appInstalled = true; }
}

function updateUI(dateObj) {
  const iso = toISO(dateObj);
  document.getElementById('date').value = iso;
  currentDay = JS_DAY_KEY[dateObj.getDay()];
  refreshNavInstallButton();
}

function checkFutureAndAlert(selectedDate) {
  const current = vnNow();
  const todayStart = new Date(current.getFullYear(), current.getMonth(), current.getDate());
  const selectedStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

  if (selectedStart > todayStart) {
    const diffTime = selectedStart - todayStart;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    alert(`Chưa có kết quả ngày ${toDMY(selectedDate)}, vui lòng đợi ${diffDays} ngày nữa nhé!`);
    return true; 
  }
  return false; 
}

function changeDate(offset) {
  const input = document.getElementById('date');
  const d = parseISOToDate(input.value);
  d.setDate(d.getDate() + offset);
  if(checkFutureAndAlert(d)) return;
  resetAndLoad(d);
  manageAutoRefresh();
}

function handleDateChange() {
  const input = document.getElementById('date');
  if(!input.value) return;
  const d = parseISOToDate(input.value);
  if(checkFutureAndAlert(d)) {
    updateUI(vnNow());
    return;
  }
  resetAndLoad(d);
  manageAutoRefresh();
}

async function resetAndLoad(dateObj){
  const panels = document.getElementById('panels');
  panels.innerHTML = '';
  loadedDates = new Set();
  const normalized = new Date(dateObj);
  baseDate = normalized;
  updateUI(baseDate);
  await appendDay(baseDate);
  nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate()-1);
}

function loadProvince(slug, dmyDash){
  return new Promise(resolve=>{
    const scratch = document.getElementById('scratch');
    scratch.id = 'box_kqxs_minhngoc';
    const s = document.createElement('script');
    s.src = dmyDash ? `https://www.minhngoc.com.vn/getkqxs/${slug}/${dmyDash}.js` : `https://www.minhngoc.com.vn/getkqxs/${slug}.js`;
    s.onerror = ()=>{ document.getElementById('box_kqxs_minhngoc').id = 'scratch'; resolve(null); };
    s.onload = ()=>{
      const holder = document.getElementById('box_kqxs_minhngoc');
      holder.id = 'scratch';
      const $box = $('#scratch').find('.box_kqxs_mini').last();
      if($box.length===0){ resolve(null); return; }
      const title = $box.find('.title').text().trim();
      const m = title.match(/KQXS\s+(.+?)\s+(\d{2}\/\d{2}\/\d{4})/i);
      const province = m ? m[1] : slug;
      const dateText = m ? m[2] : '';
      function pick(sel){ return ($box.find(sel).first().text()||'').replace(/\s+/g,' ').trim(); }
      function prettify(s){ return s ? s.split('-').map(x=>x.trim()).join('<br>') : ''; }
      resolve({
        province, date: dateText,
        g8: prettify(pick('.giai8')), g7: prettify(pick('.giai7')), g6: prettify(pick('.giai6')),
        g5: prettify(pick('.giai5')), g4: prettify(pick('.giai4')), g3: prettify(pick('.giai3')),
        g2: prettify(pick('.giai2')), g1: prettify(pick('.giai1')), db: prettify(pick('.giaidb'))
      });
    };
    document.body.appendChild(s);
  });
}

async function fetchDayData(dateObj){
  const iso = toISO(dateObj);
  const dash = isoToDmyDash(iso);
  const dayKey = JS_DAY_KEY[dateObj.getDay()];
  const list = DAY_MAP[dayKey] || [];
  $('#scratch').empty();
  const results = [];
  for (const p of list){
    const data = await loadProvince(p.s, dash);
    if(data) results.push(data);
  }
  const dayName = DAY_NAMES_VI[JS_DAY_KEY.indexOf(dayKey)];
  const shownDate = (iso && toDMY(parseISOToDate(iso))) || '';
  return {iso, dayName, shownDate, results};
}

function buildTable(dayName, cols){
  const prizes = [
    {k:'g8',n:'Giải 8',cls:'g8'},{k:'g7',n:'Giải 7'},{k:'g6',n:'Giải 6'},
    {k:'g5',n:'Giải 5'},{k:'g4',n:'Giải 4'},{k:'g3',n:'Giải 3'},
    {k:'g2',n:'Giải Nhì'},{k:'g1',n:'Giải Nhất'},{k:'db',n:'ĐẶC BIỆT',cls:'db'}
  ];
  if(!cols || cols.length===0){
    return '<tbody><tr><td style="padding:30px; font-size:18px; line-height:1.5;">Không tải được dữ liệu. Có thể thiết bị đang chặn JavaScript hoặc chặn script từ minhngoc.com.vn. Vui lòng bật JavaScript hoặc cho phép nội dung, sau đó thử lại.</td></tr></tbody>';
  }
  const thead = `
    <thead>
      <tr>
        <th class="province">${dayName}</th>
        ${cols.map(c=>`<th class="province">${c.province}</th>`).join('')}
      </tr>
    </thead>`;
  const tbody = `<tbody>${prizes.map(p=>`<tr><td class="prize">${p.n}</td>${cols.map(c=>`<td class="${p.cls||''}">${c[p.k]||''}</td>`).join('')}</tr>`).join('')}</tbody>`;
  return thead + tbody;
}

function renderPanel({iso, dayName, shownDate, tableHtml}){
  return `
    <div class="panel" data-iso="${iso}">
      <div class="caption">${dayName} - ${shownDate}</div>
      <div class="tableWrap">
        <table class="tbl">${tableHtml}</table>
      </div>
    </div>
  `;
}

async function appendDay(dateObj){
  const iso = toISO(dateObj);
  if(loadedDates.has(iso)) return;
  loadedDates.add(iso);
  const data = await fetchDayData(dateObj);
  const tableHtml = buildTable(data.dayName, data.results);
  const panelHtml = renderPanel({iso: data.iso, dayName: data.dayName, shownDate: data.shownDate, tableHtml});
  document.getElementById('panels').insertAdjacentHTML('beforeend', panelHtml);
}

async function reloadDay(dateObj){
  const iso = toISO(dateObj);
  const panel = document.querySelector(`.panel[data-iso="${iso}"]`);
  if(!panel){
    await appendDay(dateObj);
    return;
  }
  const data = await fetchDayData(dateObj);
  panel.querySelector('.caption').textContent = `${data.dayName} - ${data.shownDate}`;
  panel.querySelector('.tableWrap').innerHTML = `<table class="tbl">${buildTable(data.dayName, data.results)}</table>`;
}

function setupInfiniteScroll(){
  if(scrollAttached) return;
  scrollAttached = true;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if(ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      handleScrollWork();
    });
  });
}

btnTop.addEventListener('click', () => {
  window.scrollTo({top:0, behavior:'smooth'});
});

function handleScrollWork(){
  const currentY = window.scrollY;
  const direction = currentY > lastScrollY ? 'down' : 'up';
  loadMoreIfNeeded();
  toggleScrollTop(currentY, direction);
  lastScrollY = currentY;
}

function isViewingToday(){
  const viewingDate = parseISOToDate(document.getElementById('date').value);
  const now = vnNow();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const viewStart = new Date(viewingDate.getFullYear(), viewingDate.getMonth(), viewingDate.getDate());
  return viewStart.getTime() === today.getTime();
}

function refreshNavInstallButton(){
  if(!btnNext) return;
  const shouldOfferInstall = !appInstalled && deferredPrompt && isViewingToday();
  if(shouldOfferInstall){
    btnNext.textContent = 'Cài app';
    btnNext.onclick = handleNavInstallClick;
  }else{
    btnNext.innerHTML = '&#10095;';
    btnNext.onclick = () => changeDate(1);
  }
}

async function handleNavInstallClick(){
  if(!deferredPrompt){
    if(btnInstall) btnInstall.click();
    return;
  }
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if(outcome === 'accepted'){
    appInstalled = true;
    btnInstall.style.display = 'none';
  }
  deferredPrompt = null;
  refreshNavInstallButton();
}

function toggleScrollTop(pos, direction){
  if(!btnTop) return;
  const beyondThreshold = pos > 300;
  if(!beyondThreshold || direction === 'up'){
    hideTopButton();
    return;
  }
  showTopButton();
}

function showTopButton(){
  btnTop.style.display = 'block';
  resetHideTopTimer();
}

function hideTopButton(){
  btnTop.style.display = 'none';
  if(hideTopTimer){
    clearTimeout(hideTopTimer);
    hideTopTimer = null;
  }
}

function resetHideTopTimer(){
  if(hideTopTimer){
    clearTimeout(hideTopTimer);
  }
  hideTopTimer = setTimeout(()=>hideTopButton(), 500);
}

async function loadMoreIfNeeded(){
  if(isLoadingMore || !nextDate) return;
  const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;
  if(!nearBottom) return;
  isLoadingMore = true;
  const targetDate = new Date(nextDate);
  nextDate.setDate(nextDate.getDate()-1);
  try{
    await appendDay(targetDate);
  }finally{
    isLoadingMore = false;
  }
}

let refreshTimer = null;
function manageAutoRefresh(){
  if(refreshTimer) clearInterval(refreshTimer);
  const n = vnNow();
  const m = n.getHours()*60 + n.getMinutes();
  const viewingDate = parseISOToDate(document.getElementById('date').value);
  const today = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  if(viewingDate.getTime() === today.getTime() && m >= REFRESH_START_MIN && m < RESULT_FINAL_MIN){
    refreshTimer = setInterval(()=>reloadDay(baseDate), 60000);
  }
}
