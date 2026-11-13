// ==========================================================================
// [2.9.7 신규] 10_Depth_검출_행위유형 관리
//   검출 > 행위유형 관리 > 정책 관리 — 등록 · 수정 · 삭제 (실제 저장)
//   1. 추가 창 : 업무시스템 화살표 클릭 열기/닫기 (!1199 회귀) · 행위 유형 없이 저장 → 막힘
//              → 등록(리눅스_배송관리 · 고정 URI · 조회) → 목록 · 전체 수 +1 · URI 검색
//              → (삭제 기능이 있을 때만) 같은 값 다시 등록 → 관찰 기록 후 정리
//   2. 수정 : 행위 유형 조회 → 다운로드 저장 → 정책 ID · 업무시스템 그대로, 전체 수 그대로, 행위 유형 검색에 나옴
//            → 수정 창에서 다시 바꾸고 「취소」 → 반영 안 됨
//   3. 삭제 : 삭제 → 목록 · 검색에서 사라짐 · 전체 수 -1
//            (삭제 기능이 화면에 없으면 「관찰」로 기록하고 행위 유형만 조회로 되돌림)
//   반복 실행 설계
//     - 등록 값은 고정 URI 「/zz_auto_actiontype_qa/**」(실제 접속 URI 에 걸리지 않는 값) · 업무시스템 리눅스_배송관리 한정
//     - URI 를 비우고 저장하지 않는다 (미입력 = 조건 없음 → 그 업무시스템 모든 URI 에 적용되므로 위험)
//     - 시작 · after() 에서 고정 URI 정책 정리 : 삭제 기능이 있으면 삭제, 없으면 1건만 남기고 행위 유형 조회로 원복
//     - it 마다 스스로 로그인하고 필요한 정책이 없으면 만든다 → 단독 실행 · 전체 실행 결과 같음
//   첫 실행 전 확인 사항 (Basic B10A probe, 2026-11-12 기준)
//     - 목록 행에는 edit 아이콘만 보였고 수정 창 버튼도 취소 · 저장뿐 → 삭제 수단을 3곳에서 찾음
//         ① 행 아이콘(delete 등) ② 행 선택칸 + 「삭제」 버튼 ③ 수정 창 「삭제」 버튼
//     - 저장 요청 · 안내 문구 · 확인창 문구는 아직 모름 → 모두 관찰 기록(D10A_관찰.json · D10A_net.json)으로 남김
//   2.9.7 확인 사항 (2026-11-13 첫 실행)
//     - 등록 안내 「추가했습니다.」 · 삭제 수단 = 행 아이콘(row) · 삭제 안내 「삭제했습니다.」
//     - 목록 API 응답 : id · bsnIds · url · actionTypeCd(조회 1) · bsnIdsStr (리눅스_배송관리 bsnId 1)
//     - 같은 값(업무시스템 · URI · 행위 유형) 재등록이 막히지 않고 새 정책 생성 → 기록만 (Mantis 0039012, 개선)
//     - 중복 로그인 차단 : .21 에서 다른 실행이 admin 으로 로그인해 있으면 로그인 400 → 단독 실행은 전체 수행이 없을 때
//   관찰 기록 : cypress/probe/D10A_관찰.json · 요청 기록 : cypress/probe/D10A_net.json
//   비밀번호: cypress.env.json (LC_PW)
// ==========================================================================
const A = require('../../support/anomaly');

const SYS = '리눅스_배송관리';
const URI = '/zz_auto_actiontype_qa/**';
const TYPE1 = '조회';
const TYPE2 = '다운로드';
const FORM = 'input[aria-label^="URI 주소 패턴"]';

const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);

const obs = {};
const note = (k, v) => {
  obs[k] = v;
  cy.log(`📝 ${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
  cy.writeFile('cypress/probe/D10A_관찰.json', obs, { log: false });
};
const reqText = (x) => {
  const b = x.request.body;
  const s = `${x.request.url} ${typeof b === 'string' ? b : JSON.stringify(b || '')}`;
  try { return decodeURIComponent(s.replace(/\+/g, ' ')); } catch (e) { return s; }
};
const dumpNet = () => cy.get('@at.all', { log: false }).then((xs) => cy.writeFile('cypress/probe/D10A_net.json', xs.map((x) => ({
  m: x.request.method,
  url: x.request.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 200),
  st: x.response && x.response.statusCode,
  req: reqText(x).replace(/^\S+\s/, '').slice(0, 400),
  body: x.response ? (typeof x.response.body === 'string' ? x.response.body : JSON.stringify(x.response.body || '')).slice(0, 400) : null
})), { log: false }));

// ---------- 화면 · 목록 ----------
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
  const pg = t(root).match(/(\d+)\s*-\s*(\d+)\s*of\s*(\d+)/);
  const rows = tb ? [...tb.querySelectorAll('tbody tr')].filter((r) => r.querySelectorAll('td').length > 1).map((r) => [...r.querySelectorAll('td')].map(t)) : [];
  return { rows, total: pg ? Number(pg[3]) : rows.length };
};
const list = (check) => cy.get('body', { timeout: 20000 }).should(($b) => { if (check) check(readList($b)); }).then(($b) => readList($b));
const ours = (s) => s.rows.filter((r) => r[2] === URI);

const searchInput = (label) => cy.get(`input[aria-label="${label}"]`).filter((i, e) => shown(e) && !e.closest('.v-dialog'));
// 「검색」 → 검색 요청(@pl)을 넘김
//   ok 를 주면 요청 내용이 ok 를 만족할 때까지 「검색」을 다시 누름 (최대 retry 번)
//   [2026-11-13 첫 실행] URI 를 넣고 1.5초 뒤 검색해도 uriLike "" 요청이 잡힘
//     (화면 진입 때 늦게 나간 목록 요청이 먼저 잡히거나 입력값 반영이 늦음) → 요청 내용 확인 후 재검색
const clickSearch = (ok, retry = 3) => {
  cy.get('.v-btn__content').filter((i, e) => shown(e) && t(e) === '검색' && !e.closest('.v-dialog')).first().click({ force: true });
  return cy.wait('@pl', { timeout: 20000 }).then((x) => {
    cy.wait(800);
    if (ok && !ok(reqText(x)) && retry > 0) {
      cy.log(`↻ 검색 요청에 조건이 아직 없음 → 다시 검색 (${retry})`);
      cy.wait(1200);
      return clickSearch(ok, retry - 1);
    }
    return cy.wrap(x, { log: false });
  });
};
// URI 입력 → 값 반영(change) → 1.5초 → 검색 · 요청에 그 값이 실렸는지 확인
const searchUri = (v) => {
  searchInput('URI 주소').first().clear({ force: true });
  if (v) searchInput('URI 주소').first().type(v, { force: true, delay: 0, parseSpecialCharSequences: false });
  searchInput('URI 주소').first().trigger('change', { force: true });
  cy.wait(1500);
  const want = v ? (s) => s.includes(v) : (s) => s.includes('"uriLike":""');
  return clickSearch(want).then((x) => {
    expect(reqText(x), `검색 요청에 URI 「${v}」`).to.satisfy(want);
    return list();
  });
};
// 검색 조건 선택칸 (창 밖) 고르기
const pickSearch = (label, text) => {
  searchInput(label).first().click({ force: true });
  cy.wait(1000);
  menuPick(text);
  cy.get('body').type('{esc}', { force: true });
  cy.wait(500);
};
const menuPick = (text) => cy.get('.v-menu__content').filter((i, e) => shown(e) && e.querySelectorAll('.v-list__tile__title').length > 0).last()
  .find('.v-list__tile__title').filter((i, e) => shown(e) && t(e) === text).first().click({ force: true });

// ---------- 추가 · 수정 창 ----------
const dialog = () => cy.get('.v-dialog--active').filter((i, e) => shown(e) && !!e.querySelector(FORM)).last();
const openAdd = () => {
  cy.get('.v-btn__content').filter((i, e) => shown(e) && /^(add\s*)?추가$/.test(t(e)) && !e.closest('.v-dialog')).first().click({ force: true });
  cy.wait(1500);
  dialog().should('exist');
};
const rowById = (id) => cy.get('table.v-datatable').filter(':visible').first().find('tbody tr')
  .filter((i, e) => t(e.querySelector('td')) === String(id)).first();
const openEdit = (id) => {
  rowById(id).find('i').filter((i, e) => t(e) === 'edit').first().closest('button').click({ force: true });
  cy.wait(1500);
  dialog().should('exist');
};
const dlgPick = (label, text) => {
  dialog().find(`input[aria-label="${label}"]`).first().click({ force: true });
  cy.wait(1000);
  menuPick(text);
  cy.wait(800);
  // 목록이 남아 있으면 창 제목을 눌러 닫음 (esc 는 창까지 닫힐 수 있음)
  cy.get('body').then(($b) => {
    if ($b.find('.v-menu__content.menuable__content__active').filter((i, e) => shown(e)).length) {
      dialog().find('.v-card__title, .c-headline, .headline').first().click({ force: true });
      cy.wait(500);
    }
  });
};
const dlgUri = (v) => dialog().find(FORM).first().clear({ force: true }).type(v, { force: true, delay: 0, parseSpecialCharSequences: false });
const dlgBtn = (label) => dialog().find('button, .v-btn').filter((i, e) => shown(e) && t(e) === label).first();
const formOpen = ($b) => $b.find('.v-dialog--active').filter((i, e) => shown(e) && !!e.querySelector(FORM)).length > 0;

// 저장 · 삭제 뒤 확인창(입력 창이 아닌 맨 위 창)이 뜨면 문구 기록 후 확인
const confirmTop = (name) => {
  cy.wait(1200);
  cy.get('body').then(($b) => {
    const $d = $b.find('.v-dialog--active').filter((i, e) => shown(e) && !e.querySelector(FORM)).last();
    if (!$d.length) return;
    note(`${name}_확인창`, t($d[0]).slice(0, 300));
    const $ok = $d.find('button, .v-btn').filter((i, e) => shown(e) && /^(확인|예|삭제|저장|OK)$/i.test(t(e)));
    if ($ok.length) cy.wrap($ok.last()).click({ force: true });
  });
  cy.wait(1500);
};
const clearSnack = () => cy.get('body', { log: false }).then(($b) => {
  const $x = $b.find('.v-snack button, .v-snack .v-btn').filter((i, e) => shown(e));
  if ($x.length) { cy.wrap($x).click({ force: true, multiple: true }); cy.wait(600); }
});
const waitSnack = (name, left = 16) => cy.get('body', { log: false }).then(($b) => {
  const s = $b.find('.v-snack__content').filter((i, e) => shown(e)).toArray().map(t).filter(Boolean).join(' | ').replace(/\s*close$/, '');
  if (s || left <= 0) { note(`${name}_안내`, s || '(없음)'); return cy.wrap(s, { log: false }); }
  cy.wait(300, { log: false });
  return waitSnack(name, left - 1);
});
const save = (name) => {
  clearSnack();
  dlgBtn('저장').click({ force: true });
  confirmTop(name);
  waitSnack(name);
  cy.get('body', { timeout: 10000 }).should(($b) => expect(formOpen($b), `${name} 저장 뒤 입력 창 닫힘`).to.eq(false));
};
const cancel = () => {
  dlgBtn('취소').click({ force: true });
  cy.wait(1200);
  cy.get('body').should(($b) => expect(formOpen($b), '입력 창 닫힘').to.eq(false));
};

// ---------- 등록 · 삭제 수단 ----------
const DEL_ICON = /^(delete|delete_forever|delete_outline|remove_circle|remove_circle_outline)$/;
// 행 아이콘 / 행 선택칸 + 「삭제」 버튼 / 수정 창 「삭제」 버튼 순서로 찾음 → 'row' | 'check' | 'dialog' | null
const findDelete = (id) => cy.get('body').then(($b) => {
  const tr = $b.find('table.v-datatable:visible tbody tr').filter((i, e) => t(e.querySelector('td')) === String(id))[0];
  if (tr && [...tr.querySelectorAll('i, .v-icon')].some((e) => DEL_ICON.test(t(e)) || /fa-trash/.test(e.className))) return 'row';
  const delBtn = $b.find('button, .v-btn').filter((i, e) => shown(e) && t(e) === '삭제' && !e.closest('.v-dialog')).length;
  if (tr && tr.querySelector('input[type="checkbox"], .v-input--selection-controls') && delBtn) return 'check';
  openEdit(id);
  return cy.get('body').then(($b2) => {
    const inDlg = $b2.find('.v-dialog--active').filter((i, e) => shown(e) && !!e.querySelector(FORM)).last()
      .find('button, .v-btn').filter((i, e) => shown(e) && t(e) === '삭제').length;
    cancel();
    return inDlg ? 'dialog' : null;
  });
});
const deleteRow = (id, how, name) => {
  clearSnack();
  if (how === 'row') {
    rowById(id).find('i, .v-icon').filter((i, e) => DEL_ICON.test(t(e)) || /fa-trash/.test(e.className)).first()
      .closest('button, a, .v-btn').click({ force: true });
  } else if (how === 'check') {
    rowById(id).find('input[type="checkbox"], .v-input--selection-controls__ripple').first().click({ force: true });
    cy.wait(500);
    cy.get('button, .v-btn').filter((i, e) => shown(e) && t(e) === '삭제' && !e.closest('.v-dialog')).first().click({ force: true });
  } else {
    openEdit(id);
    dlgBtn('삭제').click({ force: true });
  }
  confirmTop(name);
  waitSnack(name);
};

// 고정 URI 정책 등록 (행위 유형 type) → 새 정책 ID
const addOurs = (type, name) => {
  openAdd();
  dlgPick('업무시스템', SYS);
  dlgUri(URI);
  dlgPick('행위 유형', type);
  save(name);
  go();
  return searchUri(URI).then((s) => {
    const r = ours(s);
    expect(r.length, `${name} 뒤 고정 URI 정책`).to.be.greaterThan(0);
    return Math.max(...r.map((x) => Number(x[0])));
  });
};
// 고정 URI 정책이 있으면 그 ID, 없으면 만들어서 ID
const ensureOurs = () => {
  go();
  return searchUri(URI).then((s) => {
    const r = ours(s);
    if (r.length) return Number(r[0][0]);
    go();
    return addOurs(TYPE1, 'D10A_준비등록');
  });
};
// 정리 : 삭제 기능이 있으면 고정 URI 정책 모두 삭제, 없으면 행위 유형을 조회로 원복
const cleanup = (name, left = 5) => {
  go();
  searchUri(URI).then((s) => {
    const r = ours(s);
    if (!r.length || left <= 0) return;
    const id = Number(r[0][0]);
    findDelete(id).then((how) => {
      note(`${name}_삭제수단`, how || '없음');
      if (how) {
        deleteRow(id, how, `${name}_${id}`);
        cleanup(name, left - 1);
      } else if (r[0][3] !== TYPE1 || r[0][1] !== SYS) {
        openEdit(id);
        dlgPick('업무시스템', SYS);
        dlgPick('행위 유형', TYPE1);
        save(`${name}_원복`);
      }
    });
  });
};

describe('10_Depth_검출_행위유형 관리', () => {
  A.ignoreErrors();

  beforeEach(() => {
    cy.intercept({ method: 'POST', url: /\/logcatch\/pams\/action-type\/policy-list/ }).as('pl');
    cy.intercept({ url: /\/logcatch\/pams\/action-type\// }).as('at');
    A.loginAdmin();
  });

  afterEach(() => dumpNet());

  after(() => {
    cy.intercept({ method: 'POST', url: /\/logcatch\/pams\/action-type\/policy-list/ }).as('pl');
    cy.intercept({ url: /\/logcatch\/pams\/action-type\// }).as('at');
    A.loginAdmin();
    cleanup('D10A_after');
  });

  it('추가 창 — 화살표 열기/닫기(!1199) · 행위 유형 없이 저장 막힘 · 등록 → 목록 · 검색', { retries: 0 }, () => {
    cleanup('D10A_시작');
    go();
    list().then((s) => cy.wrap(s.total).as('total0'));
    // 정리 뒤에도 고정 URI 정책이 남아 있으면(= 삭제 기능 없음) 등록 단계는 건너뜀 (중복이 쌓이지 않게)
    searchUri(URI).then((s) => cy.wrap(ours(s).length).as('pre'));

    // ---------- 1-1. 업무시스템 화살표 : 열기 → 닫기 → 열기 (!1199) ----------
    openAdd();
    //   [2026-11-13 첫 실행] 강제 클릭(force)으로는 입력칸에 초점만 가고 목록이 열리지 않음
    //     → 화살표 아이콘(arrow_drop_down)을 실제 마우스 클릭(realClick)으로 누름
    const arrow = () => dialog().find('input[aria-label="업무시스템"]').first().closest('.v-input')
      .find('.v-input__append-inner .v-icon').filter((i, e) => t(e) === 'arrow_drop_down').first();
    const menuOpen = ($b) => $b.find('.v-menu__content').filter((i, e) => shown(e) && !!e.querySelector('.v-list__tile')).length > 0;
    dialog().find('input[aria-label="업무시스템"]').first().closest('.v-input').then(($v) => note('D10A_화살표_구조', {
      아이콘: [...$v[0].querySelectorAll('.v-input__append-inner .v-icon')].map(t),
      클래스: $v[0].className.slice(0, 200)
    }));
    arrow().realClick();
    cy.get('body').should(($b) => expect(menuOpen($b), '화살표 1번째 클릭 → 목록 열림').to.eq(true));
    cy.wait(500);
    arrow().realClick();
    cy.get('body').should(($b) => expect(menuOpen($b), '화살표 2번째 클릭 → 목록 닫힘 (!1199)').to.eq(false));
    cy.wait(500);
    arrow().realClick();
    cy.get('body').should(($b) => expect(menuOpen($b), '화살표 3번째 클릭 → 다시 열림').to.eq(true));
    menuPick(SYS);
    cy.wait(800);
    A.dumpScreen('D10A_1_화살표');

    // ---------- 1-2. 행위 유형 없이 저장 → 막힘 ----------
    dlgUri(URI);
    clearSnack();
    dlgBtn('저장').click({ force: true });
    cy.wait(1500);
    cy.get('body').then(($b) => {
      const top = $b.find('.v-dialog--active').filter((i, e) => shown(e) && !e.querySelector(FORM)).last()[0];
      const errs = $b.find('.v-dialog--active .v-messages__message, .error--text').filter((i, e) => shown(e)).toArray().map(t).filter(Boolean);
      const snack = $b.find('.v-snack__content').filter((i, e) => shown(e)).toArray().map(t).join(' | ');
      note('D10A_행위유형없이저장', { 안내창: top ? t(top).slice(0, 200) : '(없음)', 입력칸안내: errs, snack: snack || '(없음)', 입력창유지: formOpen($b) });
    });
    A.dismissInputNotice(FORM);
    A.dumpScreen('D10A_2_빈행위유형');
    cy.get('body').should(($b) => expect(formOpen($b), '행위 유형 없이 저장 → 입력 창 그대로 (저장 안 됨)').to.eq(true));
    cancel();
    cy.get('@total0').then((n) => {
      go();
      list((s) => expect(s.total, '행위 유형 없이 저장 시도 뒤 전체 수').to.eq(n));
    });
    cy.get('@pre').then((pre) => {
      searchUri(URI).then((s) => expect(ours(s).length, '행위 유형 없이 저장 → 고정 URI 정책 수 그대로').to.eq(pre));
    });

    cy.get('@pre').then((pre) => {
      if (pre > 0) {
        note('D10A_관찰_등록', `삭제 기능이 없어 고정 URI 정책 ${pre}건이 남아 있음 → 등록 · 중복 등록 단계 건너뜀 (수정 · 삭제 it 는 이 정책 사용)`);
        return;
      }
      addAndCheck();
    });
  });

  // 1-3 · 1-4 : 등록 → 목록 · 전체 수 +1 / (관찰) 같은 값 다시 등록
  const addAndCheck = () => {
    // ---------- 1-3. 등록 → 목록 · 전체 수 +1 · URI 검색 ----------
    go();
    addOurs(TYPE1, 'D10A_등록').then((id) => {
      cy.wrap(id).as('id');
      A.dumpScreen('D10A_3_등록');
      list((s) => {
        const r = s.rows.find((x) => x[0] === String(id));
        expect(r, `정책 ${id}`).to.not.eq(undefined);
        expect(r.slice(1, 4), `정책 ${id} 업무 시스템 · URI · 행위 유형`).to.deep.eq([SYS, URI, TYPE1]);
      });
    });
    cy.get('@total0').then((n) => {
      go();
      list((s) => expect(s.total, '등록 뒤 전체 수 (+1)').to.eq(n + 1));
    });

    // ---------- 1-4. (관찰) 같은 값 다시 등록 — 삭제 기능이 있을 때만 (없으면 정리할 수 없어 건너뜀) ----------
    cy.get('@id').then((id) => {
      go();
      findDelete(id).then((how) => {
        note('D10A_삭제수단', how || '없음');
        if (!how) { note('D10A_관찰_중복등록', '삭제 기능이 없어 건너뜀 (정리 불가)'); return; }
        go();
        openAdd();
        dlgPick('업무시스템', SYS);
        dlgUri(URI);
        dlgPick('행위 유형', TYPE1);
        clearSnack();
        dlgBtn('저장').click({ force: true });
        confirmTop('D10A_중복');
        waitSnack('D10A_중복');
        cy.get('body').then(($b) => { if (formOpen($b)) cancel(); });
        go();
        searchUri(URI).then((s) => {
          note('D10A_관찰_중복등록', { Mantis: '0039012', 고정URI정책수: ours(s).length, 정책ID: ours(s).map((r) => r[0]) });
          ours(s).filter((r) => r[0] !== String(id)).forEach((r) => deleteRow(Number(r[0]), how, `D10A_중복정리_${r[0]}`));
        });
      });
    });
  };

  it('수정 — 행위 유형 변경 → 목록 · 검색 반영 · 정책 ID 그대로 / 수정 창 취소는 반영 안 됨', { retries: 0 }, () => {
    ensureOurs().then((id) => {
      cy.wrap(id).as('id');
      go();
      list().then((s) => cy.wrap(s.total).as('total0'));

      // ---------- 2-1. 수정 창 : 채워진 값 ----------
      go();
      searchUri(URI);
      openEdit(id);
      A.dumpScreen('D10A_4_수정창');
      dialog().find(FORM).first().should(($i) => expect(String($i.val()).trim(), `정책 ${id} URI 주소 패턴`).to.eq(URI));
      dialog().should(($d) => expect(t($d[0]), `정책 ${id} 업무시스템`).to.include(SYS));

      // ---------- 2-2. 행위 유형 → 다운로드 저장 ----------
      dlgPick('행위 유형', TYPE2);
      save('D10A_수정');
      go();
      searchUri(URI).then((s) => {
        const r = s.rows.find((x) => x[0] === String(id));
        expect(r, `수정 뒤 정책 ${id} (ID 그대로)`).to.not.eq(undefined);
        expect(r.slice(1, 4), `수정 뒤 정책 ${id}`).to.deep.eq([SYS, URI, TYPE2]);
        expect(ours(s).length, '수정 뒤 고정 URI 정책 수 (새로 생기지 않음)').to.eq(1);
      });
      A.dumpScreen('D10A_5_수정');
    });
    cy.get('@total0').then((n) => {
      go();
      list((s) => expect(s.total, '수정 뒤 전체 수 그대로').to.eq(n));
    });

    // ---------- 2-3. 검색 : 행위 유형 다운로드 + 업무시스템 → 이 정책 ----------
    cy.get('@id').then((id) => {
      go();
      pickSearch('행위 유형', TYPE2);
      pickSearch('업무시스템', SYS);
      clickSearch((s) => /"actionTypeList":\[\d+\]/.test(s) && /"bsnIdList":\[\d+\]/.test(s)).then((x) => note('D10A_수정_검색요청', reqText(x).slice(0, 300)));
      list((s) => {
        expect(s.rows.map((r) => r[0]), `행위 유형 「${TYPE2}」 · 업무시스템 검색에 정책 ${id}`).to.include(String(id));
        s.rows.forEach((r) => expect([r[1], r[3]], `정책 ${r[0]}`).to.deep.eq([SYS, TYPE2]));
      });

      // ---------- 2-4. 수정 창에서 바꾸고 취소 → 반영 안 됨 ----------
      go();
      searchUri(URI);
      openEdit(id);
      dlgPick('행위 유형', TYPE1);
      cancel();
      go();
      searchUri(URI).then((s) => {
        const r = s.rows.find((x) => x[0] === String(id));
        expect(r && r[3], `취소 뒤 정책 ${id} 행위 유형 그대로`).to.eq(TYPE2);
      });
    });
  });

  it('삭제 — 목록 · 검색에서 사라짐 · 전체 수 -1 (삭제 기능이 없으면 관찰 기록 · 원복)', { retries: 0 }, () => {
    ensureOurs().then((id) => {
      go();
      list().then((s) => cy.wrap(s.total).as('total0'));
      go();
      searchUri(URI);
      findDelete(id).then((how) => {
        note('D10A_삭제수단', how || '없음');
        if (!how) {
          note('D10A_관찰_삭제', `삭제 수단 없음 (행 아이콘 · 선택칸 · 수정 창 모두 없음) — 정책 ${id} 를 남기고 행위 유형만 원복`);
          cleanup('D10A_삭제없음');
          return;
        }
        go();
        searchUri(URI);
        deleteRow(id, how, 'D10A_삭제');
        A.dumpScreen('D10A_6_삭제');
        go();
        searchUri(URI).then((s) => expect(s.rows.map((r) => r[0]), `삭제 뒤 정책 ${id}`).to.not.include(String(id)));
        cy.get('@total0').then((n) => {
          go();
          list((s) => expect(s.total, '삭제 뒤 전체 수 (-1)').to.eq(n - 1));
        });
      });
    });
  });
});
