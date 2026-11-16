// ==========================================================================
// [Probe · 조회 전용] 접속기록 무결성 Depth 설계용 현황 기록 — 아무것도 저장 · 실행 · 삭제하지 않음
//   1. 운영 > 실행 플랜 > 스케줄러 : 위변조 · 무결성 관련 플랜 행 (이름 · 상태 · 주기)
//   2. 보관 > 접속기록 무결성 > 위변조 검사 정책 / 플랜 : 정책 목록
//   3. 위변조 검사 이력 조회 : 최근 행 (접속기록 날짜 · 점검 횟수 · 최초 · 최종 점검일 · 상태)
//   4. 파일 위변조 검사 이력 조회 : 최근 행
//   결과 : cypress/probe/P07I_관찰.json · P07I_*.json
// ==========================================================================
const A = require('../../support/anomaly');

const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const obs = {};
const note = (k, v) => { obs[k] = v; cy.writeFile('cypress/probe/P07I_관찰.json', obs, { log: false }); };
const rowsOf = ($b, n = 15) => $b.find('.v-content__wrap').last().find('tbody tr').filter((i, e) => shown(e) && e.querySelectorAll('td').length > 1)
  .toArray().slice(0, n).map((r) => [...r.querySelectorAll('td')].map(t));
const heads = ($b) => $b.find('.v-content__wrap').last().find('th').filter((i, e) => shown(e)).toArray().map(t);

describe('probe_07_무결성_현황', () => {
  A.ignoreErrors();
  beforeEach(() => {
    // 혹시 모를 저장 · 실행 요청은 서버로 보내지 않음
    A.loginAdmin();
    cy.intercept({ method: /^(POST|PUT|DELETE|PATCH)$/, url: /\/logcatch\/.*(delete|remove|save|insert|modify|regist|update|execute|start|stop)/i }, (req) => req.reply({ statusCode: 418, body: { code: 418 } })).as('blocked');
  });

  it('무결성 정책 · 플랜 · 이력 현황 기록', { retries: 0 }, () => {
    cy.visit('/logcatch/operate/executePlan/scheduler');
    cy.wait(5000);
    cy.get('body').then(($b) => {
      const rows = $b.find('.v-content__wrap').last().find('tbody tr').filter((i, e) => shown(e)).toArray().map(t);
      note('스케줄러_머리', heads($b));
      note('스케줄러_위변조행', rows.filter((r) => /위변조|무결성|Integrity|integrity/i.test(r)).slice(0, 20));
      note('스케줄러_행수', rows.length);
      // 추가 창의 정책 목록 이름 형식(「[위변조 …] 정책명」)은 창을 열어야 보여서 이번에는 생략
    });
    A.dumpScreen('P07I_1_스케줄러');

    cy.contains('button', '보관').filter(':visible').first().click({ force: true });
    cy.wait(2000);
    cy.get('.v-list__tile__title').filter(':visible').filter((i, e) => t(e) === '접속기록 무결성').first().click({ force: true });
    cy.wait(3000);
    const tab = (label, key) => {
      cy.get('.tab-btn').filter((i, e) => shown(e) && t(e) === label).first().click({ force: true });
      cy.wait(3500);
      cy.get('body').then(($b) => {
        note(`${key}_url`, $b[0].ownerDocument.location.pathname);
        note(`${key}_머리`, heads($b));
        note(`${key}_행`, rowsOf($b));
        note(`${key}_전체문구`, (t($b.find('.v-content__wrap').last()[0]).match(/\d+\s*-\s*\d+\s*of\s*\d+|총\s*\d+\s*건/g) || []).slice(0, 3));
      });
      A.dumpScreen(`P07I_${key}`);
    };
    tab('위변조 검사 정책 / 플랜', '정책');
    tab('위변조 검사 이력 조회', '이력');
    tab('파일 위변조 검사 이력 조회', '파일이력');
    cy.get('@blocked.all').then((xs) => note('막은요청', xs.map((x) => `${x.request.method} ${x.request.url.replace(/^https?:\/\/[^/]+/, '')}`)));
  });
});
