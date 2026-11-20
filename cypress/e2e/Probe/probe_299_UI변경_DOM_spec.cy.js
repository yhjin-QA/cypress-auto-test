// 2.9.9.0 UI 변경 관찰 (조회 전용 · .71) — UI_Module_GitLab_Check 실패 6건의 화면 구조를 기록
// 결과 : cypress/probe/P299_관찰.json
// 저장 · 삭제 버튼은 누르지 않는다 (정책 생성 창은 열고 취소만)
const HOST = 'https://10.10.54.71:18443';
const obs = {};
const note = (k, v) => { obs[k] = v; cy.writeFile('cypress/probe/P299_관찰.json', obs, { log: false }); };
const t = (e) => (e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim();
const vis = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const html = (el, n = 4000) => (el ? el.outerHTML.replace(/\s+/g, ' ').slice(0, n) : null);

describe('probe_299 UI 변경 DOM', () => {
  Cypress.on('uncaught:exception', () => false);

  it('로그인 → 화면별 구조 기록', () => {
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
    cy.wait(4000);

    // ---- 15 점검 : 로그인 첫 화면 · 점검 하위 메뉴 ----
    cy.url().then((u) => note('15_로그인첫화면', u));
    cy.contains('button', '점검').click({ force: true });
    cy.wait(1500);
    cy.get('body').then(($b) => {
      const items = $b.find('.v-list__tile__title, .v-list-item__title, .v-menu__content a, .v-menu__content .v-list__tile').filter((i, e) => vis(e)).toArray();
      note('15_점검_하위메뉴', items.map((e) => ({ text: t(e), cls: e.className, tag: e.tagName })).slice(0, 20));
      const menu = $b.find('.v-menu__content.menuable__content__active')[0];
      note('15_점검_메뉴HTML', html(menu, 3000));
    });
    cy.get('body').then(($b) => {
      const it = $b.find('*').filter((i, e) => vis(e) && e.children.length === 0 && t(e) === '점검 대시보드')[0];
      if (it) cy.wrap(it).click({ force: true });
    });
    cy.wait(4000);
    cy.url().then((u) => note('15_점검대시보드_URL', u));
    cy.get('body').then(($b) => note('15_점검대시보드_c-headline', $b.find('.c-headline').filter((i, e) => vis(e)).toArray().map(t)));

    // ---- 03 이력 파일 다운로드 ----
    cy.visit(`${HOST}/logcatch/record/accessLog/fileDownloadLog`);
    cy.wait(5000);
    cy.get('body').then(($b) => {
      note('03_탭', $b.find('.tab-btn').filter((i, e) => vis(e)).toArray().map((e) => ({ text: t(e), cls: e.className })));
      note('03_c-headline', $b.find('.c-headline').filter((i, e) => vis(e)).toArray().map(t));
      note('03_제목후보', $b.find('h1,h2,h3,h4,.headline,.title,.subtitle-1,.v-toolbar__title,.breadcrumb, .v-breadcrumbs').filter((i, e) => vis(e)).toArray().map((e) => ({ tag: e.tagName, cls: e.className, text: t(e).slice(0, 80) })).slice(0, 20));
      note('03_표위HTML', html($b.find('table').filter((i, e) => vis(e)).first().closest('.v-card, .card, section, div')[0], 2500));
    });

    // ---- 12 소명 > 신청 > 이상행위 경보 ----
    cy.visit(`${HOST}/logcatch/approval/submit/anomaly-alerts`);
    cy.wait(5000);
    cy.get('body').then(($b) => {
      const panel = $b.find('.basic-filter-panel').filter((i, e) => vis(e))[0] || $b.find('.basic-filter-panel__title').closest('div').parent()[0];
      note('12_입력칸', $b.find('input').filter((i, e) => vis(e)).toArray().map((e) => ({ type: e.type, ph: e.placeholder, cls: e.className, parent: (e.closest('[class]') || {}).className })).slice(0, 15));
      note('12_날짜영역HTML', html($b.find('input[placeholder*="YYYY"]').first().closest('div').parent().parent()[0], 3000));
      note('12_기본필터HTML', html(panel, 5000));
    });

    // ---- 10 검출 > URI 관리 일괄 등록 : 쪽 표시 ----
    cy.visit(`${HOST}/logcatch/detect/menu/management/bulkReg`);
    cy.wait(5000);
    cy.get('body').then(($b) => {
      note('10_쪽표시', $b.find('.v-datatable__actions, .v-data-footer, .table-footer, .v-datatable__actions__select').filter((i, e) => vis(e)).toArray().map((e) => ({ cls: e.className, text: t(e) })).slice(0, 6));
    });

    // ---- 13 관리 > 데이터 시각화 관리 > 통계 정책 관리 : 첫 행 ----
    cy.visit(`${HOST}/logcatch/management/dataVisualization/statsPolicyManagement`);
    cy.wait(6000);
    cy.get('body').then(($b) => {
      const row = $b.find('tbody tr').filter((i, e) => vis(e) && e.querySelector('.policy-id-cell'))[0] || $b.find('tbody tr').filter((i, e) => vis(e))[0];
      note('13_첫행HTML', html(row, 5000));
      note('13_적재테이블칸', row ? Array.from(row.querySelectorAll('td')).map((td, i) => ({ i, cls: td.className, text: t(td).slice(0, 60), inner: td.innerHTML.replace(/\s+/g, ' ').slice(0, 300) })) : null);
    });

    // ---- 09 분석 > 사용자 이상행위 정책 > 새 정책 : 경보 메시지 카드 ----
    cy.visit(`${HOST}/logcatch/analyze/customAnomalyBehaviorPolicy`);
    cy.wait(6000);
    cy.get('.v-btn__content').filter(':visible').contains('새 정책').click({ force: true });
    cy.wait(2500);
    cy.get('body').then(($b) => {
      const card = $b.find('.v-dialog--active .rule-msg-card')[0];
      note('09_경보메시지카드HTML', html(card, 8000));
      note('09_카드글자', card ? Array.from(card.querySelectorAll('*')).filter((e) => e.children.length === 0 && t(e)).map((e) => ({ tag: e.tagName, cls: e.className, text: t(e).slice(0, 60) })).slice(0, 40) : null);
    });
    cy.get('.v-dialog--active').contains('button', '취소').click({ force: true });
    cy.wait(1000);
  });
});
