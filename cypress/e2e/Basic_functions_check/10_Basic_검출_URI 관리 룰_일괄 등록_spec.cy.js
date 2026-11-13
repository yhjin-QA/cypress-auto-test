// ==========================================================================
// [2.9.7 신규] 10_Basic_검출_URI 관리 룰_일괄 등록
//   검출 > 검출 메뉴 관리 > URI 관리 룰 · URI 관리 일괄 등록 (저장 · 일괄 저장 안 누름)
//   1. URI 관리 룰
//      - 왼쪽 업무시스템 목록 (Master) = 시스템 API (이름 · BsnId)
//      - 업무시스템 고르기 → 정책 설정 제목 · 업무시스템 명 · 시스템 ID · is_global 스위치 · 메뉴 키 조합 규칙 = 설정 API
//      - 「규칙 추가」 → 행 1개 늘어남 → 새 행 close → 원래대로 (저장 안 함)
//   2. URI 관리 일괄 등록
//      - 업무시스템 고르기 → 제목에 시스템 이름 · 정책 미설정 경고 없음 · 이미 등록된 메뉴 목록 (N건)
//      - 「표준 템플릿 다운로드」 → cypress/downloads 에 엑셀 파일
//      - 그 템플릿을 「엑셀 업로드」 → 등록 대기 데이터 확인만 (일괄 저장 안 함)
//   반복 실행 설계 : 저장하지 않음 → 데이터 바뀌지 않음 (내려받은 템플릿은 다음 실행 때 downloads 정리로 지워짐)
//   2.9.7 확인 사항 (probe18, 2026-11-12)
//     - 왼쪽 목록 .master-system-tile : 이름(.v-list__tile__title) · 「BsnId: N」 · 칩 「설정됨」
//     - 룰 화면 .rule-content-card : 제목 「<시스템> 정책 설정」 · .rule-summary-card(업무시스템 명 · 시스템 ID) · .global-scope-card(is_global 스위치)
//       규칙 행 : 번호 칩 · select(요청 헤더 …) · input(placeholder 「키 이름 입력 (예: globalMenuId)」) · close
//     - API : GET /api/v1/menu-sync/systems → [{ bsnId, nm, statusCd }] · GET /api/v1/menu-sync/configs → [{ bsnId, isGlobal, expressions:[{ expression "#RequestHeader['test']", order }] }]
//     - [관찰] 시스템을 고르기 전 제목 「0 정책 설정」 · 「0 {0} 메뉴 복합 일괄 등록」, 요약 「업무시스템 명 0 · 시스템 ID 0」,
//              일괄 등록은 고르기 전부터 「경고: 선택하신 업무시스템의 정책이 설정되어 있지 않습니다.」 → 기록만 (Mantis 후보)
//   2026-11-13 첫 실행
//     - 일괄 등록 제목이 시스템을 고른 뒤에도 「리눅스_배송관리 {0} 메뉴 복합 일괄 등록」 → 기록만 (Mantis 0038678 — 이미 보고됨)
//       목록 머리 「업무시스템 명 ((필수))」 · 선택 전 「0 정책 설정」 「0 {0} …」 → 기록만 (0038678 에 덧붙임 후보)
//     - is_global 스위치 : isGlobal 1(리눅스_배송관리) → 꺼짐 「포함 안 함」 · 0(WebLogic_CRM고객관리) → 켜짐 「포함」 (저장값을 정상으로 불러옴)
//     - 시스템을 고르면 「기존 설정이 불러와졌습니다」 · 버튼 「설정 전체 삭제」 · 「정책 업데이트」 (누르지 않음)
//   관찰 기록 : cypress/probe/B10M_관찰.json
//   비밀번호: cypress.env.json (LC_PW)
// ==========================================================================
const A = require('../../support/anomaly');
const SYS = '리눅스_배송관리';

const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);

const obs = {};
const note = (k, v) => {
  obs[k] = v;
  cy.log(`📝 ${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
  cy.writeFile('cypress/probe/B10M_관찰.json', obs, { log: false });
};

// 검출 > 검출 메뉴 관리 > 탭 (시스템 · 설정 API 응답을 @sysList · @cfgList 로)
const go = (tabLabel) => {
  cy.visit('/logcatch/com/siteMap');
  cy.wait(2500);
  cy.contains('button', '검출').click({ force: true });
  cy.wait(1500);
  cy.get('.v-list__tile__title').filter(':visible').filter((i, e) => t(e) === '검출 메뉴 관리').first().click({ force: true });
  cy.wait(3500);
  cy.get('.v-btn__content').filter(':visible').filter((i, e) => t(e) === tabLabel).first().click({ force: true });
  cy.wait('@sys', { timeout: 20000 }).then((x) => cy.wrap((x.response && x.response.body && x.response.body.etcData) || [], { log: false }).as('sysList'));
  cy.wait('@cfg', { timeout: 20000 }).then((x) => cy.wrap((x.response && x.response.body && x.response.body.etcData) || [], { log: false }).as('cfgList'));
  cy.get('.master-system-tile', { timeout: 15000 }).filter((i, e) => shown(e)).should('have.length.greaterThan', 0);
  cy.wait(1000);
};
const tiles = () => cy.get('.master-system-tile').filter((i, e) => shown(e));
const pickSystem = (name) => {
  tiles().filter((i, e) => t(e.querySelector('.v-list__tile__title')) === name).first().find('a').first().click({ force: true });
  cy.wait(2500);
};
// 왼쪽 목록 = 시스템 API
const checkMaster = (prefix) => cy.get('@sysList').then((sys) => cy.get('@cfgList').then((cfg) => tiles().then(($t) => {
  const ui = $t.toArray().map((e) => ({ nm: t(e.querySelector('.v-list__tile__title')), sub: t(e.querySelector('.v-list__tile__sub-title')), chip: t(e.querySelector('.v-chip')) }));
  expect(ui.length, '업무시스템 목록 수 = 시스템 API').to.eq(sys.length);
  sys.forEach((s) => {
    const u = ui.find((x) => x.nm === s.nm);
    expect(u, `목록에 「${s.nm}」`).to.not.eq(undefined);
    expect(u.sub, `「${s.nm}」 BsnId`).to.include(`BsnId: ${s.bsnId}`);
  });
  // [관찰] 「설정됨」 칩 ↔ 설정 API 에 그 시스템 설정이 있는지
  const cfgIds = cfg.map((c) => c.bsnId);
  const mismatch = sys.filter((s) => (ui.find((x) => x.nm === s.nm) || {}).chip === '설정됨' && !cfgIds.includes(s.bsnId)).map((s) => `${s.nm}(${s.bsnId})`);
  note(`${prefix}_설정됨칩`, { 칩: ui.map((x) => `${x.nm}:${x.chip}`), 설정API_bsnId: cfgIds, 설정없는데_설정됨: mismatch });
})));
const globalSwitch = () => cy.get('.global-scope-card').filter((i, e) => shown(e)).first().find('input[role="checkbox"]').first();
const ruleInputs = () => cy.get('.rule-content-card').filter((i, e) => shown(e)).first()
  .find('input[placeholder*="globalMenuId"]').filter((i, e) => shown(e));
const parseExpr = (s) => { const m = String(s || '').match(/^#(\w+)\['(.*)'\]$/); return m ? { from: m[1], key: m[2] } : { from: null, key: String(s || '') }; };

describe('10_Basic_검출_URI 관리 룰_일괄 등록', () => {
  A.ignoreErrors();

  beforeEach(() => {
    cy.intercept('GET', /\/api\/v1\/menu-sync\/systems/).as('sys');
    cy.intercept('GET', /\/api\/v1\/menu-sync\/configs/).as('cfg');
    A.loginAdmin();
  });

  it('URI 관리 룰 — 업무시스템 목록 · 시스템 정책 불러오기 · 규칙 추가/삭제 (저장 안 함)', { retries: 0 }, () => {
    go('URI 관리 룰');
    A.dumpScreen('B10M_1_룰_처음');
    checkMaster('B10M_룰');

    // 고르기 전 (관찰)
    cy.get('.rule-content-card').filter((i, e) => shown(e)).first().then(($c) => {
      note('B10M_관찰_룰_선택전', { 제목: t($c.find('h2')[0]), 요약: t($c.find('.rule-summary-card')[0]) });
    });

    // ---------- 시스템 고르기 → 설정 API 와 같은지 ----------
    pickSystem(SYS);
    A.dumpScreen('B10M_2_룰_선택');
    cy.get('@sysList').then((sys) => cy.get('@cfgList').then((cfg) => {
      const s = sys.find((x) => x.nm === SYS);
      expect(s, `시스템 API 에 「${SYS}」`).to.not.eq(undefined);
      const c = cfg.find((x) => x.bsnId === s.bsnId);
      note('B10M_룰_설정API', c || '(설정 없음)');
      cy.get('.rule-content-card').filter((i, e) => shown(e)).first().should(($c) => {
        expect(t($c.find('h2')[0]), '정책 설정 제목').to.include(SYS);
        const sum = t($c.find('.rule-summary-card')[0]);
        expect(sum, '업무시스템 명').to.include(SYS);
        expect(sum, '시스템 ID').to.match(new RegExp(`시스템 ID[^0-9]*${s.bsnId}\\b`));
      });
      if (c) {
        // is_global 스위치 : [2026-11-13 첫 실행] isGlobal=1 인 리눅스_배송관리가 「꺼짐」으로 보임 (왼쪽 「포함 (켬)」 · 오른쪽 「포함 안 함 (끔)」)
        //   → 켬/끔 방향을 단정하지 않고, isGlobal 이 다른 시스템과 스위치 상태가 서로 다른지(저장값을 불러오는지)로 확인
        globalSwitch().invoke('attr', 'aria-checked').then((v) => cy.wrap({ name: SYS, isGlobal: c.isGlobal, on: v }, { log: false }).as('g1'));
        const want = (c.expressions || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0)).map((x) => parseExpr(x.expression));
        ruleInputs().should(($i) => {
          expect($i.length, '메뉴 키 조합 규칙 행 수 = 설정 API expressions').to.eq(want.length);
          expect($i.toArray().map((e) => e.value), '규칙 키 이름').to.deep.eq(want.map((w) => w.key));
        });
        cy.get('.rule-content-card').filter((i, e) => shown(e)).first().find('select.custom-input').filter((i, e) => shown(e)).then(($s) => {
          note('B10M_룰_규칙_출처', { 화면: $s.toArray().slice(0, want.length).map((e) => e.options[e.selectedIndex] ? t(e.options[e.selectedIndex]) : e.value), API: want.map((w) => w.from) });
        });
      }
    }));
    cy.get('.rule-content-card').filter((i, e) => shown(e)).first().find('button, .v-btn').filter((i, e) => shown(e) && /정책 (저장|수정|업데이트)|저장$|업데이트$/.test(t(e)))
      .then(($b) => note('B10M_룰_저장버튼', $b.toArray().map(t)));

    // ---------- is_global 이 다른 시스템을 골라 스위치 상태 비교 → 원래 시스템으로 ----------
    cy.get('@sysList').then((sys) => cy.get('@cfgList').then((cfg) => cy.get('@g1').then((g1) => {
      const other = cfg.find((x) => Number(x.isGlobal) !== Number(g1.isGlobal) && sys.some((y) => y.bsnId === x.bsnId));
      if (!other) { note('B10M_룰_is_global', { ...g1, 비교: 'isGlobal 이 다른 시스템 없음' }); return; }
      const name2 = sys.find((y) => y.bsnId === other.bsnId).nm;
      pickSystem(name2);
      cy.get('.rule-content-card').filter((i, e) => shown(e)).first().find('h2').should('contain', name2);
      globalSwitch().invoke('attr', 'aria-checked').then((v2) => {
        const g2 = { name: name2, isGlobal: other.isGlobal, on: v2 };
        note('B10M_룰_is_global', [g1, g2]);
        expect(v2, `is_global ${g1.isGlobal}(${g1.name}) · ${g2.isGlobal}(${g2.name}) — 스위치 상태가 달라야 함 (저장값을 불러옴)`).to.not.eq(g1.on);
        // [2026-11-13 두 번째 실행] isGlobal 1 → 꺼짐(포함 안 함) · 0 → 켜짐(포함) 으로 확인 → 방향까지 확인
        [g1, g2].forEach((g) => expect(g.on, `${g.name} is_global ${g.isGlobal} → 스위치 ${Number(g.isGlobal) === 1 ? '꺼짐(포함 안 함)' : '켜짐(포함)'}`).to.eq(String(Number(g.isGlobal) !== 1)));
      });
      A.dumpScreen('B10M_2b_룰_다른시스템');
      pickSystem(SYS);
      cy.get('.rule-content-card').filter((i, e) => shown(e)).first().find('h2').should('contain', SYS);
    })));

    // ---------- 규칙 추가 → 새 행 close → 원래대로 ----------
    ruleInputs().its('length').then((n0) => {
      cy.get('.rule-content-card').filter((i, e) => shown(e)).first().find('button, .v-btn').filter((i, e) => shown(e) && /규칙 추가$/.test(t(e))).first().click({ force: true });
      cy.wait(800);
      ruleInputs().should('have.length', n0 + 1);
      ruleInputs().last().should('have.value', '');
      A.dumpScreen('B10M_3_룰_규칙추가');
      // 새 행의 close : 마지막 입력칸에서 위로 올라가며 close 버튼을 가진 첫 조상(= 그 행)
      ruleInputs().last().then(($in) => {
        let el = $in[0].parentElement;
        const closes = (x) => [...x.querySelectorAll('button')].filter((btn) => shown(btn) && t(btn) === 'close');
        while (el && !closes(el).length) el = el.parentElement;
        expect(el, '새 규칙 행의 close 버튼').to.not.eq(null);
        cy.wrap(closes(el).pop()).click({ force: true });
      });
      cy.wait(800);
      ruleInputs().should('have.length', n0);
    });
    A.dumpScreen('B10M_4_룰_원래대로');
  });

  it('URI 관리 일괄 등록 — 업무시스템 고르기 · 표준 템플릿 다운로드 · 업로드 미리보기 (일괄 저장 안 함)', { retries: 0 }, () => {
    go('URI 관리 일괄 등록');
    A.dumpScreen('B10M_5_일괄_처음');
    checkMaster('B10M_일괄');

    // 고르기 전 (관찰)
    cy.get('.content-card').filter((i, e) => shown(e)).first().then(($c) => {
      note('B10M_관찰_일괄_선택전', {
        제목: t($c.find('h2')[0]),
        경고: $c.find('.v-alert').filter((i, e) => shown(e)).toArray().map(t).join(' | ') || '(없음)'
      });
    });

    // ---------- 시스템 고르기 ----------
    pickSystem(SYS);
    A.dumpScreen('B10M_6_일괄_선택');
    cy.get('.content-card').filter((i, e) => shown(e)).first().should(($c) => {
      expect(t($c.find('h2')[0]), '일괄 등록 제목에 업무시스템').to.include(SYS);
    }).then(($c) => {
      // [2026-11-13 첫 실행] 선택 뒤에도 「리눅스_배송관리 {0} 메뉴 복합 일괄 등록」 — 자리표시자 그대로 → 기록만 (Mantis 0038678 — 고쳐지면 확인 조건으로 바꿈)
      const h = t($c.find('h2')[0]);
      note('B10M_관찰_일괄_제목', h.includes('{0}') ? `자리표시자 그대로 (0038678) : 「${h}」` : h);
    });
    cy.get('@sysList').then((sys) => cy.get('@cfgList').then((cfg) => {
      const s = sys.find((x) => x.nm === SYS);
      const hasCfg = cfg.some((c) => c.bsnId === s.bsnId);
      cy.get('.content-card').filter((i, e) => shown(e)).first().then(($c) => {
        const warn = $c.find('.v-alert').filter((i, e) => shown(e)).toArray().map(t).join(' | ');
        note('B10M_일괄_선택뒤_경고', warn || '(없음)');
        if (hasCfg) expect(warn, `정책이 설정된 「${SYS}」 — 미설정 경고 없어야 함`).to.not.include('정책이 설정되어 있지 않습니다');
      });
    }));
    // 이미 등록된 메뉴 목록 (N건) ↔ 표 행 수 (쪽당 10행)
    cy.get('h3').filter((i, e) => shown(e) && /이미 등록되어 있는 메뉴 목록/.test(t(e))).first().then(($h) => {
      const n = Number((t($h[0]).match(/\((\d+)\s*건\)/) || [])[1]);
      note('B10M_일괄_등록된메뉴', n);
      expect(n, '이미 등록된 메뉴 건수 표시').to.be.at.least(0);
      cy.wrap($h).parents('.content-card').first().find('table tbody tr').then(($r) => {
        const rows = $r.toArray().filter((tr) => tr.querySelectorAll('td').length > 1);
        expect(rows.length, '등록된 메뉴 표 행 수').to.eq(Math.min(10, n));
      });
    });

    // [2026-11-13 첫 실행] 등록된 메뉴 목록 머리 「업무시스템 명 ((필수))」 — 괄호 겹침 → 기록만
    cy.get('h3').filter((i, e) => shown(e) && /이미 등록되어 있는 메뉴 목록/.test(t(e))).first().parents('.content-card').first().find('thead th').then(($th) => {
      const hs = $th.toArray().map(t).filter(Boolean);
      note('B10M_일괄_목록머리', hs);
      if (hs.some((x) => x.includes('(('))) note('B10M_관찰_일괄_목록머리', `괄호 겹침 : ${hs.filter((x) => x.includes('((')).join(', ')}`);
    });

    // ---------- 표준 템플릿 다운로드 ----------
    cy.task('readDirectory', 'cypress/downloads').then((before) => {
      cy.get('button, .v-btn').filter((i, e) => shown(e) && t(e) === '표준 템플릿 다운로드').first().click({ force: true });
      const waitFile = (left) => cy.task('readDirectory', 'cypress/downloads').then((after) => {
        const fresh = after.filter((f) => !before.includes(f) && !/\.crdownload$|\.tmp$/i.test(f));
        if (!fresh.length && left > 0) { cy.wait(1000); return waitFile(left - 1); }
        return cy.wrap(fresh, { log: false });
      });
      waitFile(15).then((fresh) => {
        note('B10M_일괄_템플릿', fresh);
        expect(fresh.length, '표준 템플릿 파일 내려받음').to.be.greaterThan(0);
        const file = fresh[0];
        expect(file, '템플릿 확장자').to.match(/\.xlsx?$/i);
        cy.task('getFileStats', `cypress/downloads/${file}`).then((st) => expect(st && st.size, '템플릿 파일 크기').to.be.greaterThan(0));

        // ---------- 템플릿 그대로 업로드 → 미리보기 (일괄 저장 안 함) ----------
        cy.get('input[type="file"][accept*=".xlsx"]').first().selectFile(`cypress/downloads/${file}`, { force: true });
        cy.wait(2500);
        A.dumpScreen('B10M_7_일괄_업로드');
        cy.get('body').then(($b) => {
          const wait = $b.find('h3').filter((i, e) => shown(e) && /등록 대기중인 데이터/.test(t(e))).toArray().map(t).join(' | ');
          const msgs = $b.find('.v-snack__content, .v-alert, .v-dialog--active').filter((i, e) => shown(e)).toArray().map(t).filter(Boolean).join(' | ');
          const save = $b.find('button, .v-btn').filter((i, e) => shown(e) && /일괄 저장$/.test(t(e)));
          note('B10M_일괄_업로드뒤', { 대기: wait, 안내: msgs.slice(0, 400), 일괄저장: save.length ? (A.isDisabled(save.first()) ? '비활성' : '활성') : '(없음)' });
        });
        // 업로드 뒤 창이 떠 있으면 닫기 (저장 · 확인 버튼은 누르지 않음)
        cy.get('body').then(($b) => {
          const $d = $b.find('.v-dialog--active').filter((i, e) => shown(e)).last();
          if (!$d.length) return;
          const $x = $d.find('button, .v-btn').filter((i, e) => shown(e) && /^(취소|닫기|close)$/.test(t(e)));
          if ($x.length) cy.wrap($x.last()).click({ force: true }); else cy.get('body').type('{esc}', { force: true });
          cy.wait(800);
        });
      });
    });
  });
});
