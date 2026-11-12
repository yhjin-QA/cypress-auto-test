// ==========================================================================
// [2.9.7 신규] 08_Depth_분석_프로파일링
//   분석 > 프로파일링 (프로파일 정책 · 프로파일링 결과)
//   A. 기본 프로파일(조회만) : 카드 정보 ↔ 쓰는 정책(link) ↔ 실행이력(history) ↔ 결과 탭(기준선 · 대상 수) 이 서로 맞는지
//   B. 임시 프로파일 수명주기 : 등록(필수값 확인) → 즉시 실행 → 결과 탭 → (편집 창이 있으면) 수정 → 삭제
//   반복 실행 설계
//     - 임시 프로파일 이름 : auto_임시_PF_<실행 시각> — 시작할 때 · 끝날 때(after) 남아 있는 auto_임시_PF_ 를 모두 삭제
//     - 기본 프로파일은 바꾸지 않음 (삭제 버튼도 누르지 않음 — 쓰는 정책이 있으면 지울 수 없는 설계)
//     - 쓰는 정책(link)에서 이상행위 정책 창을 열면 「취소」로 닫음 (저장 안 함)
//   2.9.7 확인 사항 (probe15, 2026-11-12)
//     - 카드 .pp-card : .pp-card-id(#n) · .pp-card-ver(vN) · .pp-card-name · .pp-fact(.pp-fact-k/.pp-fact-v) · .pp-card-foot(최근 실행 시각·상태)
//       사실 항목 : 평소 수준을 볼 기간 · 지표 수 · 대상 수 · 쓰는 정책 / 버튼 : 즉시 실행 · link · history · delete
//     - 등록 창 .ppd-body : 이름(필수) · 설명 · 단위 칩 · 지표 칩(.ppd-chip--metric) · 모집단 칩 · 기간/간격/보관(.ppd-num) · cron · 사용 · 값 없는 대상 제외 → 취소/저장
//     - 결과 탭 : 프로파일 선택(aria-label 프로파일 정책) → .profiling-meta 「기준선 90일 · 대상 62」 · 대상 카드 .id-card
//     - API : /api/v1/anomaly/profile-policies · /{id}/execution-logs · /{id}/policies · /anomaly/profiles?policyId=
//     - 이름 없이 저장 → 「이름을 입력해 주세요.」 · 저장 직후 카드 : v1 · 대상 수 0 · 최근 실행 없음
//     - 즉시 실행 → 1분 안팎에 카드 「YYYY-MM-DD HH:mm 성공」 · 실행이력 유형 「즉시 실행」 (배치는 「배치」)
//     - 카드 이름 클릭 → 편집 창(등록 창과 같은 구성) · 기간 변경 저장 → 버전 v1 → v2
//     - 삭제 확인창 「이 프로파일 정책을 지웁니다. 쌓인 슬롯은 남아 있어 같은 조합의 정책을 다시 만들면 그대로 쓰입니다. 계속할까요?」 취소/확인
//   비밀번호: cypress.env.json (LC_PW)
// ==========================================================================
const A = require('../../support/anomaly');
const PREFIX = 'auto_임시_PF_';
const BASE = '[기본]';

const p2 = (n) => String(n).padStart(2, '0');
const stamp = () => { const d = new Date(); return `${p2(d.getMonth() + 1)}${p2(d.getDate())}_${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`; };
const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);

// ---- 정책 화면 · 카드
// 「프로파일 정책 (N)」 — 목록을 다시 불러오는 동안에는 숫자가 없을 수 있어 숫자가 나올 때까지 기다림
const countOf = (s) => parseInt((String(s).match(/\((\d+)\)/) || [])[1] || '-1', 10);
const goPolicy = () => {
  cy.visit('/logcatch/analyze/profiling/policy');
  cy.wait(3500);
  cy.get('body').then(($b) => { if (!$b.find('.pp-panel-title').length) { cy.reload(); cy.wait(4000); } });
  cy.get('.pp-panel-title', { timeout: 15000 }).should('contain', '프로파일 정책');
  // [2026-11-12] 다시 불러오는 동안 제목이 잠깐 「(0)」 · 카드가 늦게 그려짐 → 숫자(1 이상, 기본 프로파일이 항상 있음)와 카드 수가 맞을 때까지 기다림 (한 쪽 20개)
  cy.get('body', { timeout: 20000 }).should(($b) => {
    const n = countOf($b.find('.pp-panel-title').text());
    const c = $b.find('.pp-card').filter((i, e) => shown(e)).length;
    expect(n, '프로파일 정책 수 표시').to.be.greaterThan(0);
    expect(c, `카드 수 = 표시 수 (${n})`).to.eq(Math.min(n, 20));
  });
};
const total = () => cy.get('.pp-panel-title', { timeout: 15000 }).should(($t) => expect(countOf($t.text()), '프로파일 정책 수 표시').to.be.greaterThan(0))
  .invoke('text').then(countOf);
const expectTotal = (n) => cy.get('.pp-panel-title', { timeout: 15000 }).should(($t) => expect(countOf($t.text()), '프로파일 정책 수').to.eq(n));
const nameOf = (c) => t(c.querySelector('.pp-card-name'));
const info = (c) => {
  const facts = {};
  c.querySelectorAll('.pp-fact').forEach((f) => { facts[t(f.querySelector('.pp-fact-k'))] = t(f.querySelector('.pp-fact-v')); });
  const foot = t(c.querySelector('.pp-card-foot'));
  const m = foot.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2})\s*(\S+)?/);
  return { id: t(c.querySelector('.pp-card-id')), ver: t(c.querySelector('.pp-card-ver')), name: nameOf(c), facts,
    when: m ? m[1] : null, status: m ? (m[2] || '') : '', foot };
};
const num = (s) => parseInt(String(s || '').replace(/[^\d]/g, '') || '0', 10);
const ns = (s) => String(s || '').replace(/\s+/g, '');   // 「90 일」 · 「90일」 같은 표기 차이 없앰
const card = (name) => cy.get('.pp-card').filter((i, e) => shown(e) && nameOf(e) === name);
const cardBtn = ($c, label) => $c.find('button, .v-btn').filter((i, e) => shown(e) && t(e) === label).first();
const topDialog = () => cy.get('.v-dialog--active').filter(':visible').last();
const clickInTop = (re) => cy.get('body').then(($b) => {
  const $d = $b.find('.v-dialog--active').filter((i, e) => shown(e)).last();
  const $x = $d.find('button, .v-btn').filter((i, e) => shown(e) && re.test(t(e)));
  if ($x.length) cy.wrap($x.last()).click({ force: true });
});

// 남아 있는 임시 프로파일 삭제 (이전 실행이 중간에 멈춘 경우)
const cleanup = () => {
  goPolicy();
  cy.get('body').then(($b) => {
    const left = $b.find('.pp-card').toArray().filter((e) => nameOf(e).startsWith(PREFIX)).map(nameOf);
    if (!left.length) return;
    cy.log(`🧹 남아 있는 임시 프로파일 ${left.length}개 삭제 : ${left.join(', ')}`);
    left.forEach((n) => deleteProfile(n, 'D08P_0_정리'));
  });
};
// 프로파일 삭제 (카드 delete → 확인창)
const deleteProfile = (name, dump) => {
  goPolicy();
  card(name).should('have.length', 1).then(($c) => cy.wrap(cardBtn($c, 'delete')).click({ force: true }));
  cy.wait(1500);
  if (dump) A.dumpScreen(`${dump}_삭제확인`);
  clickInTop(/^(삭제|확인|예)$/);
  cy.wait(2000);
  goPolicy();
  card(name).should('have.length', 0);
};

// ---- 결과 탭
const goResult = () => {
  goPolicy();
  cy.get('.v-btn__content, button').filter(':visible').contains(/^\s*프로파일링 결과\s*$/).click({ force: true });
  cy.wait(3500);
  cy.get('input[aria-label="프로파일 정책"]', { timeout: 15000 }).should('exist');
};
const pickProfile = (name) => {
  cy.get('input[aria-label="프로파일 정책"]').closest('.v-input').find('.v-input__slot').click({ force: true });
  cy.wait(1000);
  cy.get('.v-menu__content, .menuable__content__active').filter(':visible').last()
    .find('.v-list__tile, .v-list-item, [role="option"]').filter((i, e) => t(e) === name).first().click({ force: true });
  cy.wait(3000);
  cy.get('input[aria-label="프로파일 정책"]').closest('.v-input').find('.v-select__selection').should('contain', name);
};
const parseMeta = (s) => {
  const b = s.replace(/\s+/g, ' ').match(/기준선\s*(\d+)\s*(일|주|개월)/);
  const d = s.match(/대상\s*(\d+)/);
  return { text: s.replace(/\s+/g, ' ').trim(), base: b ? `${b[1]}${b[2]}` : null, targets: d ? parseInt(d[1], 10) : null };
};
// 결과 탭 머리 「기준선 N일 · 대상 M」 이 기대값이 될 때까지 다시 확인 (프로파일을 바꾼 직후에는 앞 값이 남아 있을 수 있음)
const expectMeta = (label, base, targets) => cy.get('.profiling-meta', { timeout: 20000 }).should(($m) => {
  const m = parseMeta($m[0].innerText || $m.text());
  expect(m.base, `${label} 기준선`).to.eq(ns(base));
  expect(m.targets, `${label} 대상 수`).to.eq(targets);
}).then(($m) => cy.log(`${label} : 결과 「${parseMeta($m.text()).text}」`));

describe('08_Depth_분석_프로파일링', () => {
  A.ignoreErrors();

  after(() => {
    cy.log('🧹 임시 프로파일 정리');
    A.loginAdmin();
    cleanup();
  });

  it('기본 프로파일 정보 대조 · 임시 프로파일 등록 → 즉시 실행 → 결과 → 삭제', { retries: 0 }, () => {
    A.loginAdmin();
    cleanup();

    // ---------- 1. 기본 프로파일 카드 정보 ----------
    goPolicy();
    A.dumpScreen('D08P_1_정책');
    cy.get('.pp-card').filter(':visible').should('have.length.greaterThan', 0).then(($cs) => {
      const all = $cs.toArray().map(info);
      const base = all.filter((c) => c.name.startsWith(BASE));
      cy.writeFile('cypress/probe/D08P_1_카드.json', all);
      expectTotal(all.length);
      expect(base.length, '기본 프로파일 수').to.be.greaterThan(0);
      base.forEach((c) => {
        expect(c.when, `${c.id} ${c.name} 최근 실행 시각`).to.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
        expect(c.status, `${c.id} ${c.name} 최근 실행 상태`).to.match(/성공/);
      });
      cy.wrap(base).as('baseCards');
    });

    // ---------- 2. 쓰는 정책(link) : 개수 = 카드의 「쓰는 정책」 → 첫 정책으로 이동 ----------
    cy.get('@baseCards').then((base) => {
      const c0 = base.find((c) => num(c.facts['쓰는 정책']) > 0) || base[0];
      const used = num(c0.facts['쓰는 정책']);
      card(c0.name).then(($c) => cy.wrap(cardBtn($c, 'link')).click({ force: true }));
      cy.wait(2000);
      topDialog().should('contain', '쓰는 정책').and('contain', c0.name);
      A.dumpScreen('D08P_2_쓰는정책');
      topDialog().then(($d) => {
        const rows = $d[0].innerText.replace(/\s+/g, ' ').match(/#\d+\s/g) || [];
        cy.log(`쓰는 정책 ${rows.length}개 : ${rows.join(' ')}`);
        expect(rows.length, `${c0.id} 쓰는 정책 목록 수 = 카드의 쓰는 정책 ${used}`).to.eq(used);
        if (!used) { clickInTop(/^(닫기|close|✕)$/); cy.get('body').type('{esc}', { force: true }); return; }
        // 첫 정책 줄 → 이상행위 정책 화면으로 이동해 그 정책 창이 열림
        const first = $d.find('*').toArray().filter((e) => /^#\d+\s/.test(t(e)) && shown(e)).sort((a, b) => t(a).length - t(b).length)
          .filter((e, i, arr) => !arr.some((o) => o !== e && e.contains(o)))[0];
        // 줄 글자 「#20 신규 업무시스템 접속 주의 미사용 chevron_right」 → 정책명만 (한글 뒤에서는 \b 가 안 먹어 공백 기준으로 자름)
        const pname = t(first).replace(/^#\d+\s+/, '').replace(/\s+(주의|경계|심각)(\s.*)?$/, '').trim();
        cy.log(`→ 「${pname}」 으로 이동`);
        cy.wrap(first).click({ force: true });
        cy.wait(3500);
        cy.url().should('include', 'customAnomalyBehaviorPolicy');
        cy.get('body').should('contain', pname);
        A.dumpScreen('D08P_2_정책이동');
        cy.get('body').then(($b) => {
          const $dlg = $b.find('.v-dialog--active').filter((i, e) => shown(e));
          if ($dlg.length) {
            expect(t($dlg.last()[0]), '열린 이상행위 정책 창').to.include(pname);
            cy.wrap($dlg.last()).contains('button', /^\s*취소\s*$/).click({ force: true });
            A.confirmIfAny();
          }
        });
      });
    });

    // ---------- 3. 실행이력(history) : 마지막 적재 = 카드의 최근 실행 시각 ----------
    goPolicy();
    cy.get('@baseCards').then((base) => {
      const c0 = base[0];
      card(c0.name).then(($c) => cy.wrap(cardBtn($c, 'history')).click({ force: true }));
      cy.wait(2000);
      topDialog().should('contain', '실행이력');
      A.dumpScreen('D08P_3_실행이력');
      topDialog().then(($d) => {
        const s = $d[0].innerText.replace(/\s+/g, ' ');
        const runs = [...s.matchAll(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s+(즉시 실행|배치)\s+\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\s*~\s*\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\s*\S*?(성공|실패|실행 중|대기)/g)]
          .map((m) => ({ at: m[1], type: m[2], status: m[3] }));
        const last = (s.match(/마지막 적재\s*(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/) || [])[1];
        cy.writeFile('cypress/probe/D08P_3_실행이력.json', { card: c0, runs, last });
        expect(runs.length, '실행이력 줄 수').to.be.greaterThan(0);
        expect(last, `마지막 적재 = 카드 최근 실행 (${c0.when})`).to.eq(c0.when);
      });
      clickInTop(/^(닫기|close|✕)$/);
      cy.wait(800);
    });

    // ---------- 4. 결과 탭 : 프로파일마다 기준선 · 대상 수 = 카드 ----------
    goResult();
    cy.get('@baseCards').then((base) => {
      base.forEach((c) => {
        pickProfile(c.name);
        // 결과 탭 기준선 = 카드 「평소 수준을 볼 기간」 · 대상 수 = 카드 「대상 수」
        expectMeta(`${c.id} ${c.name}`, c.facts['평소 수준을 볼 기간'], num(c.facts['대상 수']));
      });
    });
    A.dumpScreen('D08P_4_결과');

    // ---------- 5. 임시 프로파일 등록 : 필수값(이름) 확인 → 저장 ----------
    const NAME = `${PREFIX}${stamp()}`;
    goPolicy();
    total().as('totalBefore');
    cy.get('button, .v-btn').filter((i, e) => shown(e) && /프로파일 정책 등록/.test(t(e))).first().click({ force: true });
    cy.wait(2000);
    topDialog().find('.ppd-body').should('exist');
    // [필수 입력] 이름 없이 저장 → 저장되지 않고 창이 그대로
    topDialog().find('.ppd-btn').filter((i, e) => t(e) === '저장').first().click({ force: true });
    cy.wait(1500);
    A.dumpScreen('D08P_5_이름없이_저장');
    A.dismissInputNotice('.ppd-body');
    topDialog().find('.ppd-body').should('exist');
    cy.log('✅ 이름 없이는 저장되지 않음');
    // 입력 : 단위 = 사용자 계정 · 지표 = 접속 기록 · 기간 7일 · 간격 1일 (나머지는 기본값)
    topDialog().find('.ppd-body input.ppd-input[type="text"]').first().clear({ force: true }).type(NAME, { force: true });
    topDialog().find('.ppd-body textarea').first().type(`[자동화] 프로파일링 시나리오 ${NAME}`, { force: true });
    const setChips = (metric, wanted) => topDialog().then(($d) => {
      $d.find(`.ppd-chip${metric ? '.ppd-chip--metric' : ':not(.ppd-chip--metric)'}`).toArray()
        .filter((e) => e.closest('.ppd-row') && /평소 수준을 만들 단위|무엇을 셀지/.test(t(e.closest('.ppd-row').querySelector('.ppd-label'))))
        .forEach((e) => { const on = e.classList.contains('ppd-chip--on'); if (on !== wanted.includes(t(e))) cy.wrap(e).click({ force: true }); });
    });
    setChips(false, ['사용자 계정']);
    setChips(true, ['접속 기록']);
    topDialog().then(($d) => {
      const unitsOn = $d.find('.ppd-chip.ppd-chip--on:not(.ppd-chip--metric)').toArray().filter((e) => /평소 수준을 만들 단위/.test(t(e.closest('.ppd-row').querySelector('.ppd-label')))).map(t);
      const metricsOn = $d.find('.ppd-chip--metric.ppd-chip--on').toArray().map(t);
      expect(unitsOn, '선택한 단위').to.deep.eq(['사용자 계정']);
      expect(metricsOn, '선택한 지표').to.deep.eq(['접속 기록']);
    });
    topDialog().find('.ppd-num').eq(0).clear({ force: true }).type('7', { force: true });
    topDialog().find('.ppd-select').eq(0).select('DAYS', { force: true });
    topDialog().find('.ppd-num').eq(1).clear({ force: true }).type('1', { force: true });
    topDialog().find('.ppd-select').eq(1).select('DAYS', { force: true });
    A.dumpScreen('D08P_5_등록입력');
    topDialog().find('.ppd-btn').filter((i, e) => t(e) === '저장').first().click({ force: true });
    cy.wait(1500);
    A.confirmIfAny();
    cy.wait(1500);
    cy.get('.v-dialog--active:visible .ppd-body').should('not.exist');
    goPolicy();
    cy.get('@totalBefore').then((n) => expectTotal(n + 1));
    card(NAME).should('have.length', 1).then(($c) => {
      const c = info($c[0]);
      cy.writeFile('cypress/probe/D08P_5_임시카드.json', c);
      expect(c.ver, '새 프로파일 버전').to.eq('v1');
      expect(ns(c.facts['평소 수준을 볼 기간']), '평소 수준을 볼 기간').to.eq('7일');
      expect(num(c.facts['지표 수']), '지표 수').to.eq(1);
      expect(num(c.facts['쓰는 정책']), '쓰는 정책').to.eq(0);
    });

    // ---------- 6. 즉시 실행 → 최근 실행 「성공」 까지 대기 ----------
    card(NAME).then(($c) => {
      const $run = $c.find('button, .v-btn').filter((i, e) => shown(e) && /즉시 실행/.test(t(e))).first();
      cy.wrap($run).click({ force: true });
    });
    cy.wait(1500);
    A.dumpScreen('D08P_6_즉시실행');
    A.confirmIfAny();
    const waitRun = (left) => {
      goPolicy();
      card(NAME).should('have.length', 1).then(($c) => {
        const c = info($c[0]);
        cy.log(`🕒 ${NAME} 최근 실행 : ${c.when || '(없음)'} ${c.status}`);
        if (c.when && /성공/.test(c.status)) { cy.writeFile('cypress/probe/D08P_6_실행후카드.json', c); cy.wrap(c).as('ranCard'); return; }
        if (c.when && /실패|오류/.test(c.status)) throw new Error(`임시 프로파일 즉시 실행 결과 「${c.status}」 (${c.when})`);
        if (left <= 0) throw new Error(`임시 프로파일 즉시 실행 결과가 나오지 않았습니다 (카드 : ${c.foot})`);
        cy.wait(15000);
        waitRun(left - 1);
      });
    };
    waitRun(12); // 최대 약 4분
    cy.get('@ranCard').then((c) => expect(num(c.facts['대상 수']), '즉시 실행 후 대상 수').to.be.greaterThan(0));
    // 실행이력 : 「즉시 실행」 성공 1줄 이상
    card(NAME).then(($c) => cy.wrap(cardBtn($c, 'history')).click({ force: true }));
    cy.wait(2000);
    topDialog().should('contain', '실행이력').then(($d) => {
      const s = $d[0].innerText.replace(/\s+/g, ' ');
      expect(s, '임시 프로파일 실행이력').to.match(/즉시 실행\s+\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\s*~\s*\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\s*\S*?성공/);
    });
    A.dumpScreen('D08P_6_임시_실행이력');
    clickInTop(/^(닫기|close|✕)$/);
    cy.wait(800);

    // ---------- 7. 결과 탭 : 임시 프로파일 → 기준선 7일 · 대상 수 = 카드 · 지표는 접속 기록만 ----------
    goResult();
    pickProfile(NAME);
    cy.get('@ranCard').then((c) => expectMeta('임시 프로파일', '7일', num(c.facts['대상 수'])));
    cy.get('.id-card').filter(':visible').should('have.length.greaterThan', 0).first().then(($c) => {
      const s = t($c[0]);
      expect(s, '결과 카드 지표').to.include('접속 기록');
      expect(s, '고르지 않은 지표는 없음').not.to.include('개인정보 건수');
    });
    // 적용 대상 사용자 검색 (자동화가 매일 접속 기록을 만드는 user014)
    cy.get('input[aria-label="검색"]').clear({ force: true }).type('user014{enter}', { force: true });
    cy.wait(2500);
    cy.get('.id-card', { timeout: 15000 }).filter(':visible').should(($cs) => {
      expect($cs.length, 'user014 검색 결과 카드').to.be.greaterThan(0);
      $cs.toArray().forEach((c) => expect(t(c), '검색 결과 카드').to.include('user014'));
    });
    A.dumpScreen('D08P_7_임시_결과');

    // ---------- 8. (편집 창이 있으면) 기간 수정 → 카드 반영 ----------
    goPolicy();
    card(NAME).find('.pp-card-name').click({ force: true });
    cy.wait(2000);
    cy.get('body').then(($b) => {
      const $d = $b.find('.v-dialog--active').filter((i, e) => shown(e) && e.querySelector('.ppd-body'));
      if (!$d.length) { cy.log('ℹ️ 카드 이름을 눌러도 편집 창이 없음 — 수정 단계 건너뜀'); A.dumpScreen('D08P_8_편집없음'); return; }
      A.dumpScreen('D08P_8_편집창');
      cy.wrap($d.last()).find('.ppd-num').eq(0).clear({ force: true }).type('14', { force: true });
      cy.wrap($d.last()).find('.ppd-btn').filter((i, e) => t(e) === '저장').first().click({ force: true });
      cy.wait(1500);
      A.confirmIfAny();
      cy.wait(1500);
      goPolicy();
      card(NAME).then(($c) => {
        const c = info($c[0]);
        cy.writeFile('cypress/probe/D08P_8_수정후카드.json', c);
        cy.log(`수정 후 : ${c.ver} · 기간 ${c.facts['평소 수준을 볼 기간']}`);
        expect(ns(c.facts['평소 수준을 볼 기간']), '수정한 기간').to.eq('14일');
        // 기간을 바꾸면 버전이 오름 (2026-11-12 확인 : v1 → v2) — 이상행위 정책과 같은 규칙
        expect(c.ver, '기간 수정 후 버전').to.eq('v2');
      });
    });

    // ---------- 9. 삭제 ----------
    deleteProfile(NAME, 'D08P_9');
    cy.get('@totalBefore').then((n) => expectTotal(n));
    A.dumpScreen('D08P_9_삭제후');
  });
});
