// ==========================================================================
// [2.9.7 신규] 08_Basic_분석_이상행위 — 사용자 이상행위 정책 / 결과 / 대시보드 기본 동작
//   대상: .21 (TARGET_HOST)   기준 정책: 기본 정책 「접속량 과다」
//   데이터 변경: 「접속량 과다」 사용 ON → 확인 후 OFF 로 원복 (사용여부 변경은 정책 버전에 영향 없음)
//   즉시실행은 확인창 문구만 보고 「취소」 (실행하지 않음) — 실행 흐름은 Depth 04_소명 에서 확인
// ==========================================================================
const A = require('../../support/anomaly');
const POLICY = '접속량 과다';

describe('08_Basic_분석_이상행위', () => {
  A.ignoreErrors();

  it('사용자 이상행위 정책·결과·대시보드 기본 동작', () => {
    A.loginAdmin();

    // ---------- 1. 분석 메뉴 ----------
    cy.contains('button.has-child', '분석').click({ force: true });
    cy.wait(1500);
    ['이상행위', '프로파일링'].forEach((m) => cy.contains('.v-list__tile__title', m).should('be.visible'));
    cy.contains('.v-list__tile__title', '이상행위').click({ force: true });
    cy.wait(2500);
    ['사용자 이상행위 정책', '사용자 이상행위 결과', '사용자 이상행위 대시보드', '외부 연동 설정']
      .forEach((t) => cy.get('.v-btn__content').filter(':visible').contains(t).should('exist'));
    cy.get('.v-btn__content').filter(':visible').contains('사용자 이상행위 정책').click({ force: true });
    cy.wait(2500);
    cy.url().should('include', '/analyze/customAnomalyBehaviorPolicy');

    // ---------- 2. 검색 / 전체 비우기 ----------
    A.searchPolicy('');
    A.policyTotal().then((total) => {
      cy.log(`📊 전체 정책 ${total}건`);
      expect(total).to.be.greaterThan(0);
      cy.wrap(total).as('total');

      // 검색 대상은 정책명·설명·라벨 (입력칸 「정책명 / 설명 / 라벨 검색」)
      //   [2026-11-12] 「접속량 과다」를 복사한 전용 정책(auto_소명_승인 등)은 이름에 「접속량」이 없고 설명에만 있어 함께 검색됨
      //   → 카드에는 설명·라벨이 보이지 않으므로, 검색 응답(정책 목록 API)의 각 정책에 검색어가 들어 있는지로 확인
      const KW = '접속량';
      cy.intercept('GET', new RegExp(`/api/v1/anomaly/policies\\?.*keyword=${encodeURIComponent(KW)}`)).as('kwSearch');
      A.searchPolicy(KW);
      A.policyTotal().then((n) => {
        expect(n, `「${KW}」 검색 건수`).to.be.within(1, total - 1);
      });
      A.policyName(POLICY).should('be.visible');
      cy.wait('@kwSearch').then(({ response }) => {
        // 응답 안의 정책 배열 (가장 큰 객체 배열)
        const arrays = [];
        const walk = (v, d) => {
          if (Array.isArray(v)) { if (v.length && typeof v[0] === 'object') arrays.push(v); return; }
          if (v && typeof v === 'object' && d < 3) Object.values(v).forEach((x) => walk(x, d + 1));
        };
        walk(response && response.body, 0);
        const list = arrays.sort((a, b) => b.length - a.length)[0] || [];
        const nameOf = (p) => p.name || p.policyName || p.title || p.id;
        const miss = list.filter((p) => !JSON.stringify(p).includes(KW)).map(nameOf);
        cy.log(`검색 응답 정책 ${list.length}건 : ${list.map(nameOf).join(', ')}`);
        expect(list.length, '검색 응답의 정책 수').to.be.greaterThan(0);
        expect(miss, `검색어 「${KW}」가 이름·설명·라벨 어디에도 없는 정책`).to.deep.eq([]);
      });
      cy.get('body').then(($b) => {                         // 카드 보기일 때만 기록 (목록 보기면 0개)
        const $n = $b.find('.policy-card-name:visible');
        const byName = $n.toArray().filter((e) => e.innerText.includes(KW)).length;
        cy.log(`카드 ${$n.length}개 중 이름 일치 ${byName}개 · 설명/라벨 일치 ${$n.length - byName}개`);
      });
      A.searchPolicy('');
      A.policyTotal().should('eq', total);
    });

    // ---------- 3. 필터 (위험도 / 데이터셋 / 사용여부) ----------
    cy.get('@total').then((total) => {
      // 위험도 - 심각
      cy.contains('.filter-label', '위험도').parent().within(() => cy.get('button.sev-filter-btn--1').click({ force: true }));
      cy.wait(1500);
      A.policyTotal().then((n) => expect(n).to.be.lessThan(total));
      cy.get('body').then(($b) => {
        const chips = $b.find('.policy-card:visible .sev-chip-sm .v-chip__content');
        chips.each((i, e) => expect(e.innerText.trim()).to.eq('심각'));
      });
      cy.contains('.filter-label', '위험도').parent().within(() => cy.contains('button', '전체').click({ force: true }));
      cy.wait(1500);

      // 데이터셋 - 개인정보 사용 기준 탐지
      cy.contains('.filter-label', '데이터셋').parent().within(() => cy.contains('button', '개인정보 사용 기준 탐지').click({ force: true }));
      cy.wait(1500);
      A.policyTotal().then((n) => expect(n).to.be.lessThan(total));
      cy.contains('.filter-label', '데이터셋').parent().within(() => cy.contains('button', '전체').click({ force: true }));
      cy.wait(1500);
      A.policyTotal().should('eq', total);
    });

    // ---------- 4. 정책 열기 (사용자 모드) ----------
    A.searchPolicy(POLICY);
    A.policyName(POLICY).click({ force: true });
    cy.wait(1500);
    A.activeDialog().within(() => {
      cy.contains(POLICY).should('exist');
      cy.contains('button', '전문가 모드로 열기').should('be.visible');
      cy.contains('같은 대상의 다른 방식').should('exist');
      cy.get('.severity-radio-btn--active').should('have.length', 1);
      ['정책 취급', '탐지 기준', '적용 대상'].forEach((h) => cy.contains(h).should('exist'));
      ['심각', '경계', '주의'].forEach((s) => cy.contains(s).should('exist'));
      ['사용', '소명', '경보 알림 메일'].forEach((l) => cy.contains(l).should('exist'));
      // 사용자 모드 스위치는 라벨 요소 없이 [사용, 소명, 경보 알림 메일] 순서로 3개
      cy.get('input[type="checkbox"]').filter((i, e) => !e.getAttribute('aria-label')).should('have.length.at.least', 3);
      cy.contains('집계 단위').should('exist');
      cy.contains('.v-text-field__suffix', '건 이상').should('exist');
      ['업무시스템', '부서', '사용자'].forEach((t) => cy.contains(t).should('exist'));
      cy.contains('button', '취소').should('be.visible');
      cy.contains('button', '저장').should('be.visible');
    });
    A.thresholdInput().should('have.value', '1000');
    A.dialogSwitch('소명').should('have.attr', 'aria-checked', 'false');
    A.dumpScreen('B08_사용자모드');

    // 전문가 모드 전환 → 정책 수정 화면 요약 문구
    A.activeDialog().contains('button', '전문가 모드로 열기').click({ force: true });
    cy.wait(1500);
    A.activeDialog().within(() => {
      cy.contains('정책 수정').should('exist');
      cy.contains(/발생 횟수 >= \d+이면 탐지합니다/).should('exist');
      cy.contains('button', '사용자 모드로 열기').should('exist');
      cy.contains('button', '즉시실행').should('exist');
    });
    A.activeDialog().contains('button', '취소').click({ force: true });
    cy.wait(1000);
    cy.get('body').type('{esc}', { force: true });
    cy.get('.v-dialog--active').should('not.exist');

    // ---------- 5. 사용 ON → 사용여부 ON 필터 → OFF 원복 ----------
    A.policyActive(POLICY).invoke('attr', 'aria-checked').then((orig) => {
      cy.wrap(orig).as('origActive');
      if (orig !== 'true') {
        A.policyActive(POLICY).parents('.v-input--selection-controls').first().find('.v-input--selection-controls__input').click({ force: true });
        A.confirmIfAny();
      }
    });
    A.policyActive(POLICY).should('have.attr', 'aria-checked', 'true');
    cy.contains('.filter-label', '사용여부').parent().within(() => cy.get('.severity-filter-group button').eq(1).click({ force: true }));
    cy.wait(1500);
    A.policyName(POLICY).should('be.visible');
    cy.contains('.filter-label', '사용여부').parent().within(() => cy.get('.severity-filter-group button').eq(0).click({ force: true }));
    cy.wait(1500);
    cy.get('@origActive').then((orig) => {
      if (orig !== 'true') {
        A.policyActive(POLICY).parents('.v-input--selection-controls').first().find('.v-input--selection-controls__input').click({ force: true });
        A.confirmIfAny();
        A.policyActive(POLICY).should('have.attr', 'aria-checked', 'false');
      }
    });

    // ---------- 6. 즉시실행 확인창 (취소) ----------
    A.policySelect(POLICY).check({ force: true });
    cy.contains('.toolbar-action-btn', '즉시실행').should('not.be.disabled').click({ force: true });
    A.activeDialog().within(() => {
      cy.contains('즉시실행').should('exist');
      cy.contains('지금 한 번 실행합니다').should('exist');
      cy.contains(POLICY).should('exist');
      cy.contains('button', '취소').click({ force: true });
    });
    cy.wait(800);
    A.policySelect(POLICY).uncheck({ force: true });
    A.searchPolicy('');

    // ---------- 7. 결과 탭 ----------
    cy.get('.v-btn__content').filter(':visible').contains('사용자 이상행위 결과').click({ force: true });
    cy.wait(2500);
    cy.url().should('include', '/analyze/customAnomalyBehaviorPolicyResult');
    ['오늘', '최근 7일', '최근 30일', '3개월', '1년'].forEach((p) => {
      cy.get('button.sev-filter-btn').filter(':visible').contains(p).click({ force: true });
      cy.wait(1200);
      cy.get('.v-toolbar__title').filter(':visible').contains('경보').invoke('text').should('match', /경보 \(.+ \d+건\)/);
    });
    cy.url().should('include', 'dateFrom=').and('include', 'dateTo=');
    cy.get('input[placeholder="정책 선택"]').should('exist');
    cy.get('input[placeholder="메시지 + 정책명 검색"]').type(POLICY, { force: true });
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1500);
    cy.get('.v-toolbar__title').filter(':visible').contains('경보').should('exist');
    cy.get('.basic-filter-panel__clear-all').filter(':visible').click({ force: true });
    cy.wait(1000);

    // ---------- 8. 대시보드 / 외부 연동 설정 ----------
    cy.get('.v-btn__content').filter(':visible').contains('사용자 이상행위 대시보드').click({ force: true });
    cy.wait(3000);
    cy.url().should('include', 'Dashboard');
    cy.contains('전체 현황').should('be.visible');
    cy.get('.v-btn__content').filter(':visible').contains('외부 연동 설정').click({ force: true });
    cy.wait(3000);
    A.dumpScreen('B08_외부연동설정');
    cy.get('.v-btn__content').filter(':visible').contains('사용자 이상행위 정책').should('exist');

    // ---------- 9. 프로파일링 ----------
    cy.contains('button.has-child', '분석').click({ force: true });
    cy.wait(1500);
    cy.contains('.v-list__tile__title', '프로파일링').click({ force: true });
    cy.wait(3000);
    cy.url().should('not.include', 'customAnomalyBehaviorPolicy');
    A.dumpScreen('B08_프로파일링');
  });
});
