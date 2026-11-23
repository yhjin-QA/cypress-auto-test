// 2.9.9.0 새 화면 구조 기록 (조회 전용 · .71) — UI 점검 추가용
//  1) 점검 > 이상행위 대시보드  2) 이력 > 접속기록 이력 > 이상행위 탭  3) 설정 > 플로우 시스템 6개 탭
// 결과 : cypress/probe/P299B_관찰.json  (저장 · 추가 · 삭제 · 실행 버튼은 누르지 않는다. 탭 이동만)
const HOST = 'https://10.10.54.71:18443';
const obs = { API오류: [] };
const note = (k, v) => { obs[k] = v; cy.writeFile('cypress/probe/P299B_관찰.json', obs, { log: false }); };
const t = (e) => (e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim();
const vis = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const uniq = (a) => [...new Set(a.filter(Boolean))];

const dump = (key) => cy.url().then((url) => cy.get('body').then(($b) => {
  const V = (sel) => $b.find(sel).filter((i, e) => vis(e)).toArray();
  note(key, {
    url: url.replace(HOST, ''),
    경로: t(V('.v-breadcrumbs')[0] || {}),
    탭: uniq(V('button.tab-btn, .v-tabs__div').map(t)),
    활성탭: uniq(V('button.tab-btn.active, .v-tabs__item--active').map(t)),
    제목: uniq(V('.c-headline, h1, h2, h3, h4, .v-toolbar__title, .section-header, .v-card__title').map((e) => t(e).slice(0, 60))).slice(0, 40),
    버튼: uniq(V('.v-btn__content').map((e) => t(e).slice(0, 40))).slice(0, 50),
    입력칸: V('input, textarea').map((e) => ({ aria: e.getAttribute('aria-label'), ph: e.placeholder, type: e.type, role: e.getAttribute('role') })).slice(0, 40),
    표머리: uniq(V('th').map((e) => t(e).replace(/arrow_upward|arrow_downward/g, '').trim())).slice(0, 40),
    라벨: uniq(V('.v-label, label').map(t)).slice(0, 40),
    안내문: uniq(V('.no-data, .text-xs-center, .caption, .v-alert').map((e) => t(e).slice(0, 80))).slice(0, 30),
  });
}));

describe('probe_299b 새 화면 DOM', () => {
  Cypress.on('uncaught:exception', () => false);

  it('새 화면 3종 구조 기록', () => {
    cy.intercept({ url: /\/logcatch\// }, (req) => {
      req.continue((res) => { if (res.statusCode >= 400) obs.API오류.push(`${res.statusCode} ${req.method} ${req.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 160)}`); });
    });
    cy.visit(`${HOST}/logcatch/login`);
    cy.wait(4000);
    cy.get('body').then(($b) => { if (!$b.find('input[aria-label="사용자 계정"]').length) { cy.reload(); cy.wait(2000); } });
    cy.get('input[aria-label="사용자 계정"]').type('admin', { force: true });
    cy.get('input[aria-label="패스워드"]').type('Manager1!{enter}', { force: true });
    cy.wait(2000);
    cy.get('body').then(($b) => {
      if ($b.find('.v-card__title:contains("이미 접속 중인 계정입니다."):visible').length) {
        cy.contains('.v-card__title', '이미 접속 중인 계정입니다.').closest('.v-card').contains('확인').click({ force: true });
      }
    });
    cy.url({ timeout: 15000 }).should('not.include', '/login');
    cy.wait(6000);

    // 1) 점검 > 이상행위 대시보드 (로그인 첫 화면)
    cy.contains('button', '점검').click({ force: true });
    cy.contains('.side-sub-menu-title', '이상행위 대시보드').click({ force: true });
    cy.wait(6000);
    dump('1_이상행위대시보드');

    // 2) 이력 > 접속기록 이력 > 이상행위 탭
    cy.visit(`${HOST}/logcatch/record/accessLog/fileDownloadLog`);
    cy.wait(5000);
    cy.get('.tab-btn').contains('이상행위').click({ force: true });
    cy.wait(5000);
    dump('2_이력_이상행위탭');

    // 3) 설정 > 플로우 시스템 (관리자 모드)
    cy.get('.g-IConfig').should('be.visible').click({ force: true });
    cy.wait(2500);
    cy.contains('button.side-menu', '설정').click({ force: true });
    cy.wait(2000);
    cy.get('body').then(($b) => note('3_설정_하위메뉴', uniq($b.find('.v-menu__content.menuable__content__active .v-list__tile__title').toArray().map(t))));
    cy.contains('.v-list__tile__title', '플로우 시스템').closest('a, .v-list__tile').click({ force: true });
    cy.wait(5000);
    dump('3_플로우시스템_첫화면');
    ['플로우', '커넥터', '스케줄', '재시도 정책', '실행 이력', '폴링 어댑터'].forEach((tab, i) => {
      cy.get('body').then(($b) => {
        const el = $b.find('button.tab-btn, .v-tabs__div').filter((j, e) => vis(e) && t(e) === tab)[0];
        if (!el) { note(`3_${i + 1}_${tab}`, '탭 없음'); return; }
        cy.wrap(el).click({ force: true });
        cy.wait(4000);
        dump(`3_${i + 1}_${tab}`);
      });
    });
    cy.then(() => note('API오류', obs.API오류));
  });
});
