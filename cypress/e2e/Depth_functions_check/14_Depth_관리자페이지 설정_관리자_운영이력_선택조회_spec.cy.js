// ==========================================================================
// [2.9.7 신규] 14_Depth_관리자페이지 설정_관리자_운영이력_선택조회 — 회귀 확인 (관찰 Mantis 0039022) · 조회 전용
//   0039022 : 설정 > 관리자 > 운영 이력 — 이벤트 「선택」 검색 시 이상행위 결과 조회 이력(대상 「[Anomaly Result] : 경보 목록 조회」)을
//             메뉴 ID 숫자로 바꾸다 NumberFormatException(9999) → 화면은 안내 없이 「No data available」
//   1. 분석 > 사용자 이상행위 결과 화면을 연다 (운영 이력에 이벤트 「선택」 · 대상 「[Anomaly Result] : 경보 목록 조회」 행이 생김)
//   2. 설정 > 관리자 > 운영 이력 : 기간 기본(최근 7일) · 검색 대상 「시스템 이벤트」 · 이벤트 「선택」 → 「검색」
//   3. 판정 : 응답 code 9999 이면 「관찰 0039022」 기록 후 통과 (해결 전)
//             정상 응답이면 결과에 「[Anomaly Result] : 경보 목록 조회」 행이 있어야 통과 (해결 후 회귀 확인)
// ==========================================================================
const A = require('../../support/anomaly');

const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const obs = {};
const note = (k, v) => {
  obs[k] = v;
  cy.log(`📝 ${k}: ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 300)}`);
  cy.writeFile('cypress/probe/D14S_관찰.json', obs, { log: false });
};
// [2026-11-23] 2.9.9.0: 대상명이 영문 「[Anomaly Result] : alert list」로 바뀜 (9999 없이 정상 조회 → 0039022 해결)
const TARGET = '[Anomaly Result] : alert list';

describe('14_Depth_관리자페이지 설정_관리자_운영이력_선택조회', () => {
  A.ignoreErrors();
  beforeEach(() => { A.loginAdmin(); });

  it('운영 이력 — 이벤트 「선택」 검색 (이상행위 결과 조회 이력 포함)', { retries: 0 }, () => {
    // 1. 이상행위 결과 화면 열기 → 운영 이력 「선택」 행 생성
    A.goAnomaly('사용자 이상행위 결과');
    cy.wait(3000);

    // 2. 운영 이력 · 이벤트 「선택」 검색
    cy.visit('/logcatch/settings/admin/operatingLogs');
    cy.wait(4000);
    cy.contains('.c-headline', '검색 조건', { timeout: 15000 }).should('exist');
    // 「이벤트」 칸은 「검색 대상」을 고른 뒤에 나타남 (2026-11-16 확인) → 검색 대상 「시스템 이벤트」 먼저
    cy.get('input[aria-label="검색 대상"]').filter(':visible').click({ force: true });
    cy.wait(800);
    cy.get('.v-menu__content:visible').last().find('.v-list__tile__title').filter((i, e) => t(e) === '시스템 이벤트').first().click({ force: true });
    cy.wait(1000);
    cy.get('body').type('{esc}');
    cy.intercept('POST', '**/logcatch/common/com06/work-history').as('wh');
    cy.get('input[aria-label="이벤트"]', { timeout: 10000 }).filter(':visible').click({ force: true });
    cy.wait(800);
    cy.get('.v-menu__content:visible').last().find('.v-list__tile__title').filter((i, e) => t(e) === '선택').first().click({ force: true });
    cy.wait(500);
    cy.get('body').type('{esc}');
    cy.get('input[aria-label="이벤트"]').closest('.v-input').should('contain.text', '선택');
    cy.get('.v-btn__content').filter((i, e) => shown(e) && /^검색/.test(t(e))).first().click({ force: true });

    // 3. 판정
    cy.wait('@wh', { timeout: 30000 }).then((x) => {
      const body = x.response && x.response.body;
      const code = body && typeof body === 'object' ? String(body.code) : null;
      // 오류 메시지에도 대상 글자가 들어 있으므로, 결과 데이터(data · list)만 보고 판단
      const raw = JSON.stringify((body && (body.resultObject || body.data || body.list || body.result)) || ''); // 2.9.9.0 응답 목록 키 = resultObject
      cy.wait(1500);
      cy.get('body').then(($b) => {
        const rows = $b.find('tbody tr').filter((i, e) => shown(e) && e.querySelectorAll('td').length > 1).toArray().map(t);
        const r = { 요청본문: x.request.body, 상태: x.response && x.response.statusCode, code, message: body && body.message, 화면행: rows.length, 대상행: rows.filter((s) => s.includes(TARGET)).length, 응답에대상: raw.includes(TARGET) };
        note('D14S_선택검색', r);
        A.dumpScreen('D14S_1_선택검색');
        if (code === '9999') {
          note('D14S_관찰_0039022', `이벤트 「선택」 검색 실패 (9999 · ${body.message || ''}) — 화면 행 ${rows.length}`);
          cy.log('⚠️ [관찰 0039022] 이벤트 「선택」 검색이 9999 로 실패 — 해결되면 아래 확인으로 통과');
          return;
        }
        // [2026-11-23] 판정 전에 기록(note)이 파일에 남도록 cy.then 안에서 판정 — 2.9.9.0 에서 9999 가 아닌데 대상 행이 없어 원인 확인용
        note('D14S_응답앞', JSON.stringify(body || '').slice(0, 1500));
        cy.then(() => {
          expect(r.상태, '운영 이력 검색 응답').to.be.within(200, 299);
          expect(r.응답에대상 || r.대상행 > 0, `검색 결과에 「${TARGET}」 행`).to.eq(true);
        });
      });
    });
  });
});
