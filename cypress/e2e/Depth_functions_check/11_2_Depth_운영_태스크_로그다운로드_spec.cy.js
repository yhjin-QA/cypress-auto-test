// ==========================================================================
// [2.9.7 신규] 11_2_Depth_운영_태스크_로그다운로드 — 조회 · 내려받기만 (서버 설정 변경 없음)
//   운영 > 태스크 > 로그 다운로드 : 「어제」 로그 수집기 로그(SQLPARSER_2001_YYYYMMDD.log)를 내려받아 서버 원본과 비교
//     (오늘 파일은 계속 커지므로 크기가 고정된 어제 파일 사용)
//   1. 시작일 = 어제, 태스크 그룹 Background Service · 태스크 유형 로그 수집기 → 검색
//   2. 어제 파일 행의 「파일 크기」 기록 → 행 끝 내려받기(get_app) 아이콘 클릭 → cypress/downloads 에 새 파일이 생길 때까지 대기 (최대 60초)
//   3. 내려받은 파일 : 이름 · 크기 > 0 / SSH 로 서버 원본(find /home/logcatch -name <파일>) 크기와 비교
//   첫 실행은 내려받기 형식(원본 · zip) 확인 단계 — cypress/probe/D11L_관찰.json 을 보고 비교 조건을 확정
// ==========================================================================
const A = require('../../support/anomaly');

const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const obs = {};
const note = (k, v) => {
  obs[k] = v;
  cy.log(`📝 ${k}: ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 300)}`);
  cy.writeFile('cypress/probe/D11L_관찰.json', obs, { log: false });
};
const ssh = (cmd) => cy.task('runSSH', cmd, { timeout: 60000, log: false })
  .then((r) => String(r == null ? '' : (typeof r === 'object' ? (r.stdout || '') : r)).trim());
const DL = 'cypress/downloads';

const KST = 9 * 3600 * 1000;
const yest = new Date(Date.now() + KST - 86400000);
const Y = `${yest.getUTCFullYear()}${String(yest.getUTCMonth() + 1).padStart(2, '0')}${String(yest.getUTCDate()).padStart(2, '0')}`;
const FILE = `SQLPARSER_2001_${Y}.log`;

const dateInputs = () => cy.get('.v-input__icon--prepend-inner i.material-icons')
  .filter(':visible').filter((i, el) => el.innerText.trim() === 'event').closest('.v-input');
// 시작일 달력에서 어제 날짜 고르기 (달이 바뀌면 이전 달로 이동)
const pickStartYesterday = () => {
  dateInputs().eq(0).find('input').click({ force: true });
  cy.wait(800);
  const picker = () => cy.get('.menuable__content__active').filter(':visible').find('.v-picker--date').filter(':visible');
  picker().find('.v-date-picker-header__value').invoke('text').then((h) => {
    const m = h.match(/(\d{4})\D+(\d{1,2})/);
    if (m && (+m[1] * 12 + (+m[2] - 1)) > (yest.getUTCFullYear() * 12 + yest.getUTCMonth())) {
      picker().find('.v-date-picker-header button').first().click({ force: true });
      cy.wait(400);
    }
  });
  picker().find('.v-date-picker-table--date button').filter(':visible')
    .filter((i, el) => el.textContent.replace(/\D/g, '') === String(yest.getUTCDate())).not('.v-btn--disabled').first().click({ force: true });
  cy.wait(500);
  cy.get('body').type('{esc}');
  cy.wait(800);
};
const pick = (label, item) => {
  cy.get(`input[aria-label="${label}"]`).last().click({ force: true });
  cy.wait(800);
  cy.get('.v-menu__content:visible').last().find('.v-list__tile__title').filter((i, e) => t(e) === item).first().click({ force: true });
  cy.wait(800);
  cy.get(`input[aria-label="${label}"]`).closest('.v-input').should('contain', item);
};

describe('11_2_Depth_운영_태스크_로그다운로드', () => {
  A.ignoreErrors();
  beforeEach(() => { A.loginAdmin(); });

  it(`로그 다운로드 — 어제 로그 수집기 로그 ${FILE} 내려받기 · 서버 원본 크기 비교`, { retries: 0 }, () => {
    cy.visit('/logcatch/operate/task/logView');
    cy.wait(3000);
    cy.contains('.v-btn__content', '로그 다운로드', { timeout: 15000 }).click({ force: true });
    cy.wait(3000);
    cy.contains('.c-headline', '검색 조건').should('exist');
    pickStartYesterday();
    pick('태스크 그룹', 'Background Service');
    pick('태스크 유형', '로그 수집기');
    cy.get('.v-btn__content').filter((i, e) => shown(e) && /^검색/.test(t(e))).first().click({ force: true });
    cy.wait(3000);

    cy.contains('tr', FILE, { timeout: 15000 }).then(($tr) => {
      const cells = [...$tr[0].querySelectorAll('td')].map(t);
      note('D11L_목록행', cells);
      cy.wrap(cells, { log: false }).as('cells');
    });
    A.dumpScreen('D11L_1_목록');

    cy.task('readDirectory', DL).then((before = []) => {
      note('D11L_내려받기전', (before || []).length);
      // 2026-11-16 확인 : 파일 이름은 글자뿐이고, 내려받기는 행 끝 「get_app」 아이콘
      cy.contains('tr', FILE).find('.material-icons, .v-icon').filter((i, e) => t(e) === 'get_app').first()
        .then(($i) => cy.wrap($i.closest('button, .v-btn').length ? $i.closest('button, .v-btn') : $i).click({ force: true }));
      const poll = (i) => cy.task('readDirectory', DL).then((now = []) => {
        const fresh = (now || []).filter((f) => !(before || []).includes(f) && !/\.crdownload$|\.tmp$/i.test(f));
        if (fresh.length || i >= 30) {
          note('D11L_새파일', fresh);
          expect(fresh.length, `cypress/downloads 에 새 파일 (${FILE})`).to.be.greaterThan(0);
          cy.wrap(fresh[0], { log: false }).as('dl');
          return;
        }
        cy.wait(2000, { log: false });
        poll(i + 1);
      });
      poll(0);
    });

    cy.get('@dl').then((name) => {
      cy.readFile(`${DL}/${name}`, null, { timeout: 30000 }).then((buf) => {
        const size = buf.length || buf.byteLength || 0;
        const head = Cypress.Buffer.from(buf).slice(0, 4);
        const kind = head[0] === 0x50 && head[1] === 0x4b ? 'zip' : head[0] === 0x1f && head[1] === 0x8b ? 'gzip' : 'text';
        note('D11L_내려받은파일', { 이름: name, 크기: size, 형식: kind });
        cy.get('@cells').then((cells) => {
          const listSize = Number(String(cells[4] || '').replace(/[^\d]/g, ''));
          note('D11L_목록크기', listSize);
          if (kind === 'text' && listSize) expect(size, '내려받은 파일 크기 = 목록 「파일 크기」').to.eq(listSize);
        });
        expect(size, '내려받은 파일 크기 > 0').to.be.greaterThan(0);
        ssh(`find /home/logcatch -name '${FILE}' -printf '%s %p\\n' 2>/dev/null | head -n 3`).then((o) => {
          note('D11L_서버원본', o.split('\n'));
          const serverSize = Number((o.split('\n')[0] || '').split(' ')[0]);
          expect(serverSize, `서버 원본 ${FILE} 있음`).to.be.greaterThan(0);
          if (kind === 'text') expect(size, '내려받은 파일 크기 = 서버 원본 크기').to.eq(serverSize);
          else cy.log(`ℹ️ 내려받기 형식 ${kind} — 압축 해제 비교는 다음 단계에서 확정 (서버 ${serverSize} · 받은 ${size})`);
        });
      });
    });
  });
});
