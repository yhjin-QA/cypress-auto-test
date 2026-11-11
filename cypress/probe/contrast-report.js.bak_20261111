// =====================================================================
// 다크 모드 검사 결과(ndjson) → 엑셀 요약
//
//   npm run contrast:report                         오늘 결과
//   npm run contrast:report -- 20261105             특정 날짜
//   npm run contrast:report -- 20261104 20261105    두 날짜 비교 (앞 = 이전, 뒤 = 이후)
//   npm run contrast:report -- 20261105 --since 11:20   그날 11:20 이후 실행분만
//   npm run contrast:report -- 20261105 --host 54.51    서버(.51) 결과만 (주소 일부로 지정)
//   (서버를 지정하지 않으면 모든 서버를 서버 열로 구분해 함께 표시)
//
//   결과 : cypress/reports/contrast/contrast-<날짜>.xlsx  (비교 시 contrast-<이전>_vs_<이후>.xlsx)
//   시트 : 요약 / 결함 후보 / 상세 / 비교(두 날짜일 때)
//   알려진 Mantis 매칭 규칙 : scripts/contrast-known.json
// =====================================================================
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const DIR = path.join(__dirname, '..', 'cypress', 'reports', 'contrast');
const args = process.argv.slice(2);
let since = null;
const si = args.indexOf('--since');
if (si >= 0) { since = args[si + 1]; args.splice(si, 2); }
let hostFilter = null;
const hi = args.indexOf('--host');
if (hi >= 0) { hostFilter = args[hi + 1]; args.splice(hi, 2); }
const today = (() => { const d = new Date(); return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`; })();
const dates = args.length ? args : [today];

const known = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'contrast-known.json'), 'utf8')).rules || []; }
  catch (e) { return []; }
})();

// ---------- 읽기 ----------
function load(ymd) {
  const f = path.join(DIR, `contrast-${ymd}.ndjson`);
  if (!fs.existsSync(f)) { console.error(`❌ 결과 파일 없음 : ${f}`); process.exit(1); }
  let rows = fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean);
  // host 가 없는 기록(초기 none·not-dark)은 같은 spec 의 앞·뒤 기록에서 채움
  const fill = (list) => { const last = {}; list.forEach((r) => { if (r.host) last[r.spec] = r.host; else if (last[r.spec]) r.host = last[r.spec]; }); };
  fill(rows); fill([...rows].reverse());
  if (since) {
    // at 은 UTC. --since 는 한국 시각(HH:MM) 으로 받음
    const [h, m] = since.split(':').map(Number);
    const cut = new Date(`${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}T${String(h).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}:00+09:00`).toISOString();
    rows = rows.filter((r) => (r.at || '') >= cut);
  }
  if (hostFilter) rows = rows.filter((r) => (r.host || '').includes(hostFilter));
  return rows;
}

const hostOf = (r) => (r.host || '').replace(/:\d+$/, '').replace(/^10\.10\.54\./, '.') || '-';
const specName = (s) => (s || '').replace(/_spec\.cy\.js$/, '').replace(/^\d+_다크대비\d*_/, '');
const cls = (r) => {
  const m = (r.text || '').match(/class="([^"]*)"/);
  if (m) return m[1].split(/\s+/).filter((c) => !/^(theme--|v-.*--active)/.test(c)).slice(0, 3).join(' ');
  const t = (r.target || '').split('>').pop().trim();
  return t.replace(/:nth-child\(\d+\)/g, '').replace(/\[[^\]]*\]/g, '');
};
const plain = (r) => (r.text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
const normTarget = (t) => (t || '').replace(/:nth-child\(\d+\)/g, '').replace(/\[data-v-[^\]]*\]/g, '');
const screenOf = (r) => (r.screen || '').replace(/^\/logcatch/, '');

function mantisOf(r) {
  const hit = known.find((k) =>
    (!k.kind || k.kind === r.kind) &&
    (!k.screen || (r.screen || '').includes(k.screen)) &&
    (!k.target || (r.target || '').includes(k.target) || (r.text || '').includes(k.target)) &&
    (!k.text || plain(r).includes(k.text) || (r.text || '').includes(k.text)) &&
    (!k.fg || (r.fg || '').toLowerCase() === k.fg.toLowerCase()) &&
    (!k.bg || (r.bg || '').toLowerCase() === k.bg.toLowerCase()));
  return hit ? hit.mantis : '';
}

// 같은 날 여러 번 돌린 중복 제거 (spec·화면·종류·요소)
function dedupe(rows) {
  const m = new Map();
  rows.forEach((r) => m.set([r.host, r.spec, r.screen, r.kind, r.target, plain(r)].join('|'), r));
  // 밝은 바탕 검사 초기 실행분에 섞인 「원래 밝은 부품」(스위치·슬라이더 손잡이) 제외 — contrast.js 의 제외 목록과 같음
  return [...m.values()].filter((r) => !(r.kind === 'light-bg' && /switch__thumb|slider__thumb|progress-circular__underlay/.test(r.target || '')));
}

const ISSUE = (r) => r.kind === 'violation' || r.kind === 'light-bg' || (r.kind === 'incomplete' && r.ratio !== '' && r.ratio != null);

// ---------- 시트 ----------
function summarySheet(rows) {
  const by = new Map();
  rows.forEach((r) => {
    const k = `${hostOf(r)}|${specName(r.spec)}`;
    if (!by.has(k)) by.set(k, { screens: new Set(), violation: 0, incomplete: 0, light: 0, notDark: 0 });
    const o = by.get(k);
    o.screens.add(r.screen);
    if (r.kind === 'violation') o.violation++;
    else if (r.kind === 'incomplete') o.incomplete++;
    else if (r.kind === 'light-bg') o.light++;
    else if (r.kind === 'not-dark') o.notDark++;
  });
  const out = [...by.entries()].sort().map(([k, o]) => ({
    '서버': k.split('|')[0], '메뉴(spec)': k.split('|')[1], '검사 화면 수': o.screens.size, '대비 미달': o.violation, '확인 필요': o.incomplete, '밝은 바탕': o.light, '다크 아님': o.notDark,
  }));
  const t = out.reduce((a, x) => { ['검사 화면 수', '대비 미달', '확인 필요', '밝은 바탕', '다크 아님'].forEach((c) => { a[c] = (a[c] || 0) + x[c]; }); return a; }, { '서버': '', '메뉴(spec)': '합계' });
  return out.concat([t]);
}

function candidateSheet(rows) {
  const g = new Map();
  rows.filter(ISSUE).forEach((r) => {
    const k = [hostOf(r), r.kind, r.fg || '', r.bg || '', cls(r), specName(r.spec)].join('|');
    if (!g.has(k)) g.set(k, { r, n: 0, screens: new Set(), texts: new Set(), vals: [], mantis: new Set() });
    const o = g.get(k);
    o.n++; o.screens.add(screenOf(r)); if (plain(r)) o.texts.add(plain(r));
    o.vals.push(Number(r.kind === 'light-bg' ? r.lum : r.ratio));
    const mt = mantisOf(r); if (mt) o.mantis.add(mt);
  });
  const kindKo = { violation: '대비 미달', incomplete: '확인 필요', 'light-bg': '밝은 바탕' };
  return [...g.values()].map((o) => {
    const v = o.vals.filter((x) => !isNaN(x));
    const isLight = o.r.kind === 'light-bg';
    return {
      'Mantis': [...o.mantis].join(', '),
      '서버': hostOf(o.r),
      '종류': kindKo[o.r.kind] || o.r.kind,
      '메뉴(spec)': specName(o.r.spec),
      '화면': [...o.screens].join('\n'),
      '요소(class)': cls(o.r),
      '글자 예': [...o.texts].slice(0, 3).join(' / '),
      '글자색': o.r.fg || '', '배경색': o.r.bg || '',
      '대비(최소)': isLight ? '' : (v.length ? Math.min(...v) : ''),
      '밝기(최대)': isLight ? (v.length ? Math.max(...v) : '') : '',
      '건수': o.n,
      '판정 메모': '',
    };
  }).sort((a, b) => (a.Mantis ? 1 : 0) - (b.Mantis ? 1 : 0) || (a['대비(최소)'] || 9) - (b['대비(최소)'] || 9));
}

function detailSheet(rows) {
  return rows.map((r) => ({
    'Mantis': ISSUE(r) ? mantisOf(r) : '', '서버': hostOf(r),
    '종류': r.kind, '메뉴(spec)': specName(r.spec), '화면': screenOf(r),
    '요소': r.target || '', '글자': plain(r), '글자색': r.fg || '', '배경색': r.bg || '',
    '대비': r.ratio ?? '', '기준': r.expected || '', '밝기': r.lum ?? '', '크기': r.size || '',
    '시각(UTC)': r.at || '',
  }));
}

function compareSheet(before, after) {
  const key = (r) => [hostOf(r), specName(r.spec), r.screen, r.kind, normTarget(r.target), plain(r)].join('|');
  const b = new Map(before.filter(ISSUE).map((r) => [key(r), r]));
  const a = new Map(after.filter(ISSUE).map((r) => [key(r), r]));
  const specsB = new Set(before.map((r) => specName(r.spec)));
  const specsA = new Set(after.map((r) => specName(r.spec)));
  const out = [];
  const row = (state, r) => ({
    '상태': state, 'Mantis': mantisOf(r), '서버': hostOf(r), '종류': r.kind, '메뉴(spec)': specName(r.spec), '화면': screenOf(r),
    '요소(class)': cls(r), '글자': plain(r), '글자색': r.fg || '', '배경색': r.bg || '',
    '대비/밝기': r.kind === 'light-bg' ? r.lum : r.ratio,
  });
  a.forEach((r, k) => {
    if (!specsB.has(specName(r.spec))) out.push(row('비교 불가(이전에 안 돌림)', r));
    else out.push(row(b.has(k) ? '그대로' : '새로 생김', r));
  });
  b.forEach((r, k) => {
    if (a.has(k)) return;
    out.push(row(specsA.has(specName(r.spec)) ? '없어짐(수정 추정)' : '비교 불가(이후에 안 돌림)', r));
  });
  const order = { '새로 생김': 0, '없어짐(수정 추정)': 1, '그대로': 2 };
  return out.sort((x, y) => (order[x['상태']] ?? 9) - (order[y['상태']] ?? 9));
}

// ---------- 쓰기 ----------
function addSheet(wb, name, data, widths) {
  const ws = XLSX.utils.json_to_sheet(data.length ? data : [{ '결과': '없음' }]);
  if (widths) ws['!cols'] = widths.map((w) => ({ wch: w }));
  if (data.length) ws['!autofilter'] = { ref: ws['!ref'] };
  XLSX.utils.book_append_sheet(wb, ws, name);
}

const wb = XLSX.utils.book_new();
const after = dedupe(load(dates[dates.length - 1]));
addSheet(wb, '요약', summarySheet(after), [8, 26, 12, 10, 10, 10, 10]);
const cand = candidateSheet(after);
addSheet(wb, '결함 후보', cand, [12, 8, 10, 20, 50, 34, 34, 18, 22, 10, 10, 6, 24]);
addSheet(wb, '상세', detailSheet(after), [10, 10, 18, 46, 50, 34, 14, 22, 8, 8, 8, 10, 18, 24]);
const hostTag = hostFilter ? `_${hostFilter.replace(/[^\w.]/g, '')}` : '';
let outName = `contrast-${dates[dates.length - 1]}${hostTag}.xlsx`;
if (dates.length > 1) {
  const before = dedupe(load(dates[0]));
  addSheet(wb, '비교', compareSheet(before, after), [24, 10, 8, 10, 20, 46, 34, 34, 18, 22, 10]);
  outName = `contrast-${dates[0]}_vs_${dates[1]}${hostTag}.xlsx`;
}
const outPath = path.join(DIR, outName);
XLSX.writeFile(wb, outPath);

const unknown = cand.filter((x) => !x.Mantis).length;
console.log(`✅ ${outPath}`);
console.log(`   결함 후보 ${cand.length}묶음 (Mantis 매칭 ${cand.length - unknown} / 미등록 ${unknown})`);
