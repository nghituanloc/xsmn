export const DAY_MAP = {
  mon: [{ n: 'TP. HCM', s: 'tp-hcm' }, { n: 'Đồng Tháp', s: 'dong-thap' }, { n: 'Cà Mau', s: 'ca-mau' }],
  tue: [{ n: 'Bến Tre', s: 'ben-tre' }, { n: 'Vũng Tàu', s: 'vung-tau' }, { n: 'Bạc Liêu', s: 'bac-lieu' }],
  wed: [{ n: 'Đồng Nai', s: 'dong-nai' }, { n: 'Cần Thơ', s: 'can-tho' }, { n: 'Sóc Trăng', s: 'soc-trang' }],
  thu: [{ n: 'Tây Ninh', s: 'tay-ninh' }, { n: 'An Giang', s: 'an-giang' }, { n: 'Bình Thuận', s: 'binh-thuan' }],
  fri: [{ n: 'Vĩnh Long', s: 'vinh-long' }, { n: 'Bình Dương', s: 'binh-duong' }, { n: 'Trà Vinh', s: 'tra-vinh' }],
  sat: [{ n: 'TP. HCM', s: 'tp-hcm' }, { n: 'Long An', s: 'long-an' }, { n: 'Bình Phước', s: 'binh-phuoc' }, { n: 'Hậu Giang', s: 'hau-giang' }],
  sun: [{ n: 'Tiền Giang', s: 'tien-giang' }, { n: 'Kiên Giang', s: 'kien-giang' }, { n: 'Đà Lạt', s: 'da-lat' }],
};

export const JS_DAY_KEY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const DAY_NAMES_VI = ['CHỦ NHẬT', 'THỨ 2', 'THỨ 3', 'THỨ 4', 'THỨ 5', 'THỨ 6', 'THỨ 7'];

export const REFRESH_START_MIN = 16 * 60 + 15;
export const RESULT_FINAL_MIN = 16 * 60 + 40;
export const REALTIME_API_URL = 'https://live.minhngoc.net/O0O/0/xstt/js_m1.js';

export const PRIZES = [
  { k: 'g8', n: 'Giải 8', cls: 'g8', api: '8' },
  { k: 'g7', n: 'Giải 7', cls: '', api: '7' },
  { k: 'g6', n: 'Giải 6', cls: '', api: '6' },
  { k: 'g5', n: 'Giải 5', cls: '', api: '5' },
  { k: 'g4', n: 'Giải 4', cls: '', api: '4' },
  { k: 'g3', n: 'Giải 3', cls: '', api: '3' },
  { k: 'g2', n: 'Giải Nhì', cls: '', api: '2' },
  { k: 'g1', n: 'Giải Nhất', cls: '', api: '1' },
  { k: 'db', n: 'ĐẶC BIỆT', cls: 'db', api: '0' },
];

export const PULL_THRESHOLD = 70;
export const VISIBILITY_REFRESH_GAP = 30000;
