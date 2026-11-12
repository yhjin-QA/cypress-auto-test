// ==========================================================================
// [2.9.7 신규] 10_Basic_검출_행위유형 관리
//   검출 > 행위유형 관리 > 정책 관리 (조회만 — 저장 · 삭제 안 누름)
//   1. 목록 : 표 머리 · 전체 수 · 첫 쪽 행 수
//   2. 검색
//      - URI 주소 : 목록의 주소 입력 → 검색 요청에 그 값 · 결과에 그 정책 (다른 주소 정책 없음)
//                   없는 주소 입력 → 검색 요청에 그 값 · 앞 검색 대상이 남지 않음
//      - 행위 유형 · 업무시스템 : 고른 값 → 모든 행이 그 값
//   3. 추가 창 : 입력칸 · 안내 문구 → 취소 → 목록 그대로
//   4. 수정(edit) 창 : 그 행의 URI 주소 패턴 · 행위 유형이 채워짐 → 취소 → 목록 그대로
//   반복 실행 설계 : 조회 · 창 열고 취소만 → 데이터 바뀌지 않음
//   2.9.7 확인 사항 (probe18 · 첫 실행, 2026-11-12)
//     - 검색 조건 : 업무시스템 · 행위 유형 (선택) · URI 주소 (입력) · 「검색」 / 「추가」 → POST /logcatch/pams/action-type/policy-list
//     - 표 : 정책 ID · 업무 시스템 · URI 주소 패턴 · 행위 유형 · edit / 10행씩 「1-10 of N」
//     - 추가 창 : 업무시스템(미선택 시 모든 시스템) · URI 주소 패턴 (/api/v1/user/**) · 행위 유형 · 취소 / 저장 / 수정 창 제목 「수정」
//     - [첫 실행] URI 주소를 입력하자마자 「검색」 → 한 단계 전 입력값으로 조회됨
//         주소 입력 → 16건(빈 값으로 조회) · 없는 주소 입력 → 1건(앞에 입력한 주소로 조회)
//       → 입력 뒤 1.5초 기다렸다 검색하고 「요청에 입력값이 들어갔는지」 확인 / 입력 직후 검색 · Enter 검색은 기록만
//   관찰 기록 : cypress/probe/B10A_관찰.json · 검색 요청 · 응답 : cypress/probe/B10A_api.json
//   비밀번호: cypress.env.json (LC_PW)
// ==========================================================================
const A = require('../../support/anomaly');
const NONE = '/zz_auto_없는주소_zz/none';

const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);

const obs = {};
const note = (k, v) => {
  obs[k] = v;
  cy.log(`📝 ${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
  cy.writeFile('cypress/probe/B10A_관찰.json', obs, { log: false });
};
// 검색 요청 (주소 + 본문, 인코딩 풀어서) · 응답 전체 수
const reqText = (x) => {
  const b = x.request.body;
  const s = `${x.request.url} ${typeof b === 'string' ? b : JSON.stringify(b || '')}`;
  try { return decodeURIComponent(s.replace(/\+/g, ' ')); } catch (e) { return s; }
};
const totalOf = (x) => (x.response && x.response.body ? x.response.body.totalCount : undefined);

// 화면 열기 → 목록 요청(@pl) 끝날 때까지
const go = () => {
  cy.visit('/logcatch/com/siteMap');
  cy.wait(2500);
  cy.contains('button', '검출').click({ force: true });
  cy.wait(1500);
  cy.get('.v-list__tile__title').filter(':visible').filter((i, e) => t(e) === '행위유형 관리').first().click({ force: true });
  cy.wait('@pl', { timeout: 20000 });
  cy.get('table.v-datatable', { timeout: 15000 }).filter(':visible').should('have.length.at.least', 1);
  cy.wait(800);
};
const readList = ($b) => {
  const root = $b.find('.v-content__wrap').last()[0] || $b[0];
  const tb = [...root.querySelectorAll('table.v-datatable')].filter(shown)[0];
  const tr = tb && tb.querySelector('thead tr');
  const pg = t(root).match(/(\d+)\s*-\s*(\d+)\s*of\s*(\d+)/);
  return {
    head: tr ? [...tr.querySelectorAll('th')].map((th) => t(th).replace(/arrow_(upward|downward)/g, '').trim()) : [],
    rows: tb ? [...tb.querySelectorAll('tbody tr')].filter((r) => r.querySelectorAll('td').length > 1).map((r) => [...r.querySelectorAll('td')].map(t)) : [],
    total: pg ? Number(pg[3]) : 0
  };
};
const list = (check) => cy.get('body', { timeout: 20000 }).should(($b) => { if (check) check(readList($b)); }).then(($b) => readList($b));
// 검색 조건 영역 (창 밖) 의 입력칸
const searchInput = (label) => cy.get(`input[aria-label="${label}"]`).filter((i, e) => shown(e) && !e.closest('.v-dialog'));
const typeUri = (v) => searchInput('URI 주소').first().clear({ force: true }).type(v, { force: true, delay: 0, parseSpecialCharSequences: false });
// 「검색」 → 그 검색 요청(@pl)을 넘김
const clickSearch = () => {
  cy.get('.v-btn__content').filter((i, e) => shown(e) && t(e) === '검색' && !e.closest('.v-dialog')).first().click({ force: true });
  return cy.wait('@pl', { timeout: 20000 }).then((x) => {
    cy.wait(800);
    return cy.wrap(x, { log: false });
  });
};
// 선택칸 열고 text 항목 고름
const pick = (label, text) => {
  searchInput(label).first().click({ force: true });
  cy.wait(1000);
  cy.get('.v-menu__content').filter((i, e) => shown(e) && e.querySelectorAll('.v-list__tile__title').length > 0).last()
    .find('.v-list__tile__title').filter((i, e) => shown(e) && t(e) === text).first().click({ force: true });
  cy.wait(800);
  cy.get('body').type('{esc}', { force: true });
  cy.wait(500);
};
const dialog = () => cy.get('.v-dialog--active').filter(':visible').last();
const cancelDialog = () => {
  dialog().find('button, .v-btn').filter((i, e) => shown(e) && t(e) === '취소').first().click({ force: true });
  cy.wait(1500);
  cy.get('body').should(($b) => expect($b.find('.v-dialog--active').filter((i, e) => shown(e)).length, '창 닫힘').to.eq(0));
};
// 검색 대상 : 와일드카드 없는 주소를 가진 첫 행
const targetOf = (b) => b.rows.find((r) => r[2] && !r[2].includes('*')) || b.rows[0];

describe('10_Basic_검출_행위유형 관리', () => {
  A.ignoreErrors();

  beforeEach(() => {
    cy.intercept({ method: 'POST', url: /\/logcatch\/pams\/action-type\/policy-list/ }).as('pl');
    A.loginAdmin();
  });

  it('정책 목록 · 검색 (URI 주소 · 행위 유형 · 업무시스템)', { retries: 0 }, () => {
    go();
    A.dumpScreen('B10A_1_목록');

    // ---------- 1. 목록 ----------
    list((s) => {
      expect(s.head.slice(0, 4), '표 머리').to.deep.eq(['정책 ID', '업무 시스템', 'URI 주소 패턴', '행위 유형']);
      expect(s.total, '전체 정책 수').to.be.greaterThan(0);
      expect(s.rows.length, '첫 쪽 행 수').to.eq(Math.min(10, s.total));
    }).then((s) => cy.wrap(s).as('base'));

    cy.get('@base').then((b) => {
      const target = targetOf(b);
      cy.log(`대상 정책 ${target[0]} · ${target[1]} · ${target[2]} · ${target[3]}`);

      // ---------- 2-1. URI 주소 : 입력 → 1.5초 → 검색 ----------
      typeUri(target[2]);
      cy.wait(1500);
      clickSearch().then((x) => {
        note('B10A_URI검색', { 입력: target[2], 요청: reqText(x).slice(0, 300), 결과수: totalOf(x) });
        expect(reqText(x), `URI 검색 요청에 입력한 주소 「${target[2]}」`).to.include(target[2]);
      });
      A.dumpScreen('B10A_2_URI검색');
      list((s) => {
        expect(s.rows.map((r) => r[0]), `URI 검색 결과에 정책 ${target[0]}`).to.include(target[0]);
        s.rows.forEach((r) => expect(r[2] === target[2] || r[2] === '' || r[2].includes('*'), `URI 검색 결과 정책 ${r[0]} 「${r[2]}」 (검색 「${target[2]}」)`).to.eq(true));
      });

      // ---------- 2-2. 없는 주소 : 입력 → 1.5초 → 검색 ----------
      typeUri(NONE);
      cy.wait(1500);
      clickSearch().then((x) => {
        note('B10A_없는주소검색', { 입력: NONE, 요청: reqText(x).slice(0, 300), 결과수: totalOf(x) });
        expect(reqText(x), `없는 주소 검색 요청에 「${NONE}」`).to.include(NONE);
      });
      A.dumpScreen('B10A_3_없는주소');
      list((s) => {
        expect(s.rows.map((r) => r[0]), `없는 주소 검색 결과에 앞 검색 대상(정책 ${target[0]})이 남지 않음`).to.not.include(target[0]);
        s.rows.forEach((r) => expect(r[2] === '' || r[2].includes('*'), `없는 주소 검색 결과 정책 ${r[0]} 「${r[2]}」`).to.eq(true));
      });
    });

    // ---------- 2-3. (관찰) 입력하자마자 검색 · Enter 검색 ----------
    go();
    cy.get('@base').then((b) => {
      const target = targetOf(b);
      typeUri(target[2]);
      clickSearch().then((x) => note('B10A_관찰_입력직후검색', { 입력: target[2], 요청에_입력값: reqText(x).includes(target[2]), 결과수: totalOf(x), 요청: reqText(x).slice(0, 300) }));
      cy.get('@pl.all').then((xs) => {
        const n0 = xs.length;
        typeUri(NONE);
        searchInput('URI 주소').first().type('{enter}', { force: true });
        cy.wait(2500);
        cy.get('@pl.all').then((ys) => {
          if (ys.length > n0) {
            const x = ys[ys.length - 1];
            note('B10A_관찰_Enter검색', { 입력: NONE, 요청에_입력값: reqText(x).includes(NONE), 결과수: totalOf(x), 요청: reqText(x).slice(0, 300) });
            cy.wait('@pl');
          } else {
            note('B10A_관찰_Enter검색', 'Enter 로는 검색 요청이 없음');
          }
        });
      });
      A.dumpScreen('B10A_3b_입력직후');
    });

    // ---------- 2-4. 행위 유형 ----------
    go();
    cy.get('@base').then((b) => {
      const type = b.rows[0][3];
      pick('행위 유형', type);
      clickSearch().then((x) => note('B10A_행위유형검색', { 고름: type, 요청: reqText(x).slice(0, 300), 결과수: totalOf(x) }));
      A.dumpScreen('B10A_4_행위유형');
      list((s) => {
        expect(s.rows.length, `행위 유형 「${type}」 검색 결과`).to.be.greaterThan(0);
        s.rows.forEach((r) => expect(r[3], `정책 ${r[0]} 행위 유형`).to.eq(type));
      });
    });

    // ---------- 2-5. 업무시스템 ----------
    go();
    cy.get('@base').then((b) => {
      const sys = b.rows[0][1];
      pick('업무시스템', sys);
      clickSearch().then((x) => note('B10A_업무시스템검색', { 고름: sys, 요청: reqText(x).slice(0, 300), 결과수: totalOf(x) }));
      A.dumpScreen('B10A_5_업무시스템');
      list((s) => {
        expect(s.rows.length, `업무시스템 「${sys}」 검색 결과`).to.be.greaterThan(0);
        s.rows.forEach((r) => expect(r[1], `정책 ${r[0]} 업무 시스템`).to.eq(sys));
      });
    });

    // 검색 요청 · 응답 기록
    cy.get('@pl.all').then((xs) => cy.writeFile('cypress/probe/B10A_api.json', xs.map((x) => ({
      url: x.request.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 300),
      req: reqText(x).replace(/^\S+\s/, '').slice(0, 400),
      st: x.response && x.response.statusCode,
      total: totalOf(x)
    }))));
  });

  it('추가 창 · 수정 창 — 입력칸 · 안내 · 채워진 값 → 취소 (저장 안 함)', { retries: 0 }, () => {
    go();
    list().then((s) => cy.wrap(s).as('base'));

    // ---------- 3. 추가 창 ----------
    cy.get('.v-btn__content').filter((i, e) => shown(e) && /^(add\s*)?추가$/.test(t(e)) && !e.closest('.v-dialog')).first().click({ force: true });
    cy.wait(1500);
    A.dumpScreen('B10A_6_추가창');
    dialog().within(() => {
      cy.get('input[aria-label="업무시스템"]').should('exist');
      cy.get('input[aria-label^="URI 주소 패턴"]').should('exist').and('have.value', '');
      cy.get('input[aria-label="행위 유형"]').should('exist');
    });
    dialog().should(($d) => {
      const s = t($d[0]);
      expect(s, '업무시스템 안내').to.include('업무시스템 미선택 시 모든 시스템에 공통 적용됩니다.');
      expect(s, 'URI 패턴 안내').to.include('AntPathMatcher 기반 와일드 카드(*, **) 사용 가능.');
    });
    dialog().find('button, .v-btn').filter((i, e) => shown(e) && t(e) === '저장').should('have.length', 1);
    cancelDialog();
    cy.get('@base').then((b) => list((s) => expect(s.total, '추가 창 취소 뒤 전체 수').to.eq(b.total)));

    // ---------- 4. 수정 창 : 첫 행 ----------
    cy.get('@base').then((b) => {
      const row = b.rows[0];
      cy.get('table.v-datatable').filter(':visible').first().find('tbody tr').first()
        .find('i').filter((i, e) => t(e) === 'edit').first().closest('button').click({ force: true });
      cy.wait(1500);
      A.dumpScreen('B10A_7_수정창');
      dialog().find('input[aria-label^="URI 주소 패턴"]').first().should(($i) => expect(String($i.val()).trim(), `정책 ${row[0]} URI 주소 패턴`).to.eq(row[2]));
      dialog().should(($d) => expect(t($d[0]), `정책 ${row[0]} 행위 유형`).to.include(row[3]));
      dialog().then(($d) => cy.log(`수정 창 : ${t($d[0]).slice(0, 200)}`));
      cancelDialog();
      list((s) => {
        expect(s.total, '수정 창 취소 뒤 전체 수').to.eq(b.total);
        const same = s.rows.find((r) => r[0] === row[0]);
        expect(same, `정책 ${row[0]} 그대로`).to.deep.eq(row);
      });
    });
  });
});
