// ==========================================================================
// [2.9.7 신규] 10_Basic_검출_개인정보 유형 정의
//   검출 > 개인정보 유형 정의 > 개인정보 식별 유형 정의 · 식별 키워드 정의 (조회 · 창 열고 닫기만 — 저장 · 삭제 안 누름)
//   1. 식별 유형 정의
//      - 목록 = 유형 API 건수 · 정보주체 설정 아이콘 수 = API 의 정보주체 수
//      - 유형 명 검색(「주소」) → 요청에 검색어 · 모든 행에 검색어
//      - 「정보주체만 조회」 → 요청 onlyDataSubjectYn=true · 결과가 모두 정보주체
//      - 「삭제된 유형 포함」 → 요청 deleteYn=true · 건수가 같거나 늘어남
//      - 추가(+) 창 열기 → 닫기 → 목록 그대로
//   2. 식별 키워드 정의
//      - 안내 문구(재기동 안내)
//      - 트리 : 묶음 이름 옆 숫자 = 그 아래 항목 수 (전역 · 업무 시스템 · 업무시스템별 폴더)
//      - 키워드 항목 선택 → 오른쪽 「식별 키워드 설정」 의 개인정보 유형이 그 키워드의 유형
//      - 유사 키워드 검색 (기록만)
//   반복 실행 설계 : 조회 · 창 열고 닫기만 → 데이터 바뀌지 않음
//   2.9.7 확인 사항 (probe18, 2026-11-12)
//     - 유형 API : GET /api/v1/privacy-type/types?deleteYn=&onlyDataSubjectYn=&typeNameKeywords= → etcData[{ codeAlias, dataSubjectYn, deleteYn, … }]
//     - 표 보이는 칸 : 유형 명 · 정보주체 설정(아이콘 fa-check-square) · 주체 우선순위 · 활성화 · 등록일시 · 수정일시 · (삭제 fa-trash · 복구 fa-redo)
//       (유형 코드 · 식별 우선순위 칸은 숨김) / 화면 이름은 API codeAlias 와 띄어쓰기가 다를 수 있음 (계좌번호 ↔ 계좌 번호)
//     - 키워드 트리 : vue-treeselect (전역 (1) / 업무 시스템 (8) → 업무시스템_Content-Type 폴더 (2) → 「<유형>_<임의 문자>」 키워드)
//     - 키워드 설정 칸 : 개인정보 유형 · 유형(일치) · 대상(전역 / 업무시스템 지정) · 키워드 값 · 키워드명 자동 등록 · 설명 · 확정 키워드 · 저장
//   2026-11-13 첫 실행
//     - 키워드 트리 위 검색칸에 「(unknown)」 이 보임 (✕ 와 함께) → 기록만 (Mantis 0039003)
//     - 키워드 선택 : 사람이 누르면 설정 칸이 그 키워드로 바뀜(수동 확인) · 자동화는 realClick({ scrollBehavior: false }) 로 선택 (화면 스크롤하는 realClick · mousedown 은 안 먹음) → 설정 칸 대조
//     - 사이트맵 메뉴가 가끔 안 보여 실패 → 화면 주소로 바로 열기 (안 뜨면 메뉴로)
//     - 「키워드 값」 칩이 입력칸 테두리 밖으로 벗어남 (다크 · 라이트 모두) → 위치만 기록 (Mantis 0039004)
//     - 유형 목록은 쪽 표시 대신 행 수로 비교 (쪽당 25행)
//   관찰 기록 : cypress/probe/B10P_관찰.json
//   비밀번호: cypress.env.json (LC_PW)
// ==========================================================================
const A = require('../../support/anomaly');
const KW = '주소';
const PER_PAGE = 25;

const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const nos = (s) => String(s || '').replace(/\s+/g, '');

const obs = {};
const note = (k, v) => {
  obs[k] = v;
  cy.log(`📝 ${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
  cy.writeFile('cypress/probe/B10P_관찰.json', obs, { log: false });
};

// [2026-11-13 09:34 실행] 사이트맵 → 「검출」 → 「개인정보 유형 정의」 메뉴가 안 보여 실패(메뉴 흔들림)
//   → 화면 주소로 바로 열고, 15초 안에 화면이 안 뜨면 그때만 사이트맵 메뉴로
const PAGE = {
  type: { path: '/logcatch/detect/privacyTypeDefinition/detectionType', ready: ($b) => $b.find('table.v-datatable').toArray().some(shown) && $b.find('.v-btn__content').toArray().some((e) => shown(e) && t(e) === '검색') },
  kw: { path: '/logcatch/detect/privacyTypeDefinition/detectionKeywords', ready: ($b) => $b.find('.privacy-keyword-tree-root').toArray().some(shown) }
};
const viaMenu = (tabLabel) => {
  cy.visit('/logcatch/com/siteMap');
  cy.wait(3500);
  cy.contains('button', '검출').click({ force: true });
  cy.wait(2000);
  cy.get('.v-list__tile__title', { timeout: 15000 }).filter(':visible').filter((i, e) => t(e) === '개인정보 유형 정의').first().click({ force: true });
  cy.wait(3500);
  if (tabLabel) {
    cy.get('.v-btn__content').filter(':visible').filter((i, e) => t(e) === tabLabel).first().click({ force: true });
    cy.wait(3000);
  }
};
const go = (tabLabel) => {
  const p = tabLabel === '식별 키워드 정의' ? PAGE.kw : PAGE.type;
  const waitReady = (left) => cy.get('body', { log: false }).then(($b) => {
    if (p.ready($b)) return true;
    if (left <= 0) return false;
    cy.wait(1000, { log: false });
    return waitReady(left - 1);
  });
  cy.visit(p.path);
  cy.wait(2500);
  waitReady(15).then((ok) => {
    if (ok) return;
    note('B10P_화면열기', `${p.path} 바로 열기 15초 안에 안 뜸 → 사이트맵 메뉴`);
    viaMenu(tabLabel);
  });
  cy.get('body', { timeout: 20000 }).should(($b) => expect(p.ready($b), `${tabLabel || '식별 유형 정의'} 화면`).to.eq(true));
  cy.wait(1000);
};

// ---------- 식별 유형 정의 ----------
const decode = (u) => { try { return decodeURIComponent(String(u).replace(/\+/g, ' ')); } catch (e) { return String(u); } };
const typesOf = (x) => (x.response && x.response.body && x.response.body.etcData) || [];
const readTypes = ($b) => {
  const root = $b.find('.v-content__wrap').last()[0] || $b[0];
  const tb = [...root.querySelectorAll('table.v-datatable')].filter(shown)[0];
  const trs = tb ? [...tb.querySelectorAll('tbody tr')].filter((tr) => tr.querySelectorAll('td').length > 1) : [];
  // [2026-11-13 첫 실행] 이 화면 본문 글자에서 「x-y of N」 을 찾으면 1-0 of 0 이 잡힘(23행이 보이는데) → 행 수로 비교, 쪽 표시는 기록만
  const pages = (t(root).match(/\d+\s*-\s*\d+\s*of\s*\d+/g) || []);
  return {
    pages,
    total: trs.length,
    names: trs.map((tr) => t(tr.querySelector('td'))),
    subject: trs.filter((tr) => tr.querySelector('i.fa-check-square')).length,
    rows: trs.length,
    restoreOn: trs.filter((tr) => { const r = tr.querySelector('i.fa-redo'); const b = r && r.closest('button'); return b && !b.disabled; }).map((tr) => t(tr.querySelector('td')))
  };
};
const types = (check) => cy.get('body', { timeout: 20000 }).should(($b) => { if (check) check(readTypes($b)); }).then(($b) => readTypes($b));
const clickSearch = () => {
  cy.get('.v-btn__content').filter((i, e) => shown(e) && t(e) === '검색' && !e.closest('.v-dialog')).first().click({ force: true });
  return cy.wait('@pt', { timeout: 20000 });
};
const toggle = (label) => {
  cy.get('label.v-label').filter((i, e) => shown(e) && t(e) === label).first().click({ force: true });
  cy.wait(500);
};
const switchOn = (label) => cy.get(`input[aria-label="${label}"]`).first().invoke('attr', 'aria-checked');

// ---------- 식별 키워드 트리 ----------
const clean = (s) => String(s || '').replace(/^(folder\s*)+/, '').trim();
const countOf = (s) => { const m = clean(s).match(/\((\d+)\)\s*$/); return m ? Number(m[1]) : null; };
const labelOf = (item) => clean(t(item.querySelector(':scope > .vue-treeselect__option .vue-treeselect__label')));
const kidsOf = (item, level) => [...item.querySelectorAll(`.vue-treeselect__list-item.vue-treeselect__indent-level-${level}`)];

describe('10_Basic_검출_개인정보 유형 정의', () => {
  A.ignoreErrors();

  beforeEach(() => {
    cy.intercept('GET', /\/api\/v1\/privacy-type\/types/).as('pt');
    A.loginAdmin();
  });

  it('식별 유형 정의 — 목록 = API · 유형 명 검색 · 정보주체만 · 삭제된 유형 포함 · 추가 창 (조회만)', { retries: 0 }, () => {
    go();
    cy.wait('@pt', { timeout: 20000 }).then((x) => cy.wrap(typesOf(x), { log: false }).as('base'));
    A.dumpScreen('B10P_1_유형_목록');

    // ---------- 1. 목록 = API ----------
    cy.get('@base').then((base) => types((s) => {
      expect(s.rows, '목록 행 수 = 유형 API 건수 (쪽당 25행)').to.eq(Math.min(PER_PAGE, base.length));
      expect(s.subject, '정보주체 설정 아이콘 수 = API 정보주체 수').to.eq(base.filter((y) => y.dataSubjectYn).length);
    }).then((s) => note('B10P_유형_목록', { 행: s.rows, 정보주체: s.subject, API: base.length, 쪽표시: s.pages })));

    // ---------- 2. 유형 명 검색 ----------
    cy.get('input[aria-label="개인정보 유형 명"]').filter((i, e) => shown(e)).first().clear({ force: true }).type(KW, { force: true, delay: 0 });
    cy.wait(1000);
    clickSearch().then((x) => {
      const res = typesOf(x);
      note('B10P_유형_검색', { 요청: decode(x.request.url).replace(/^https?:\/\/[^/]+/, ''), 결과: res.length });
      expect(decode(x.request.url), '검색 요청에 유형 명').to.include(`typeNameKeywords=${KW}`);
      types((s) => {
        expect(s.rows, `「${KW}」 검색 결과 행 수 = API`).to.eq(Math.min(PER_PAGE, res.length));
        expect(s.rows, `「${KW}」 검색 결과`).to.be.greaterThan(0);
        s.names.forEach((n) => expect(nos(n), `유형 명 「${n}」`).to.include(KW));
      });
    });
    A.dumpScreen('B10P_2_유형_검색');
    // [2026-11-13 두 번째 실행] 지우기만 하면 다음 검색 요청에 「주소」 가 남음 → 지운 뒤 칸을 벗어나고(blur) 잠깐 기다림
    cy.get('input[aria-label="개인정보 유형 명"]').filter((i, e) => shown(e)).first().clear({ force: true }).blur({ force: true });
    cy.wait(1000);

    // ---------- 3. 정보주체만 조회 ----------
    toggle('정보주체만 조회');
    switchOn('정보주체만 조회').should('eq', 'true');
    cy.wait(800);
    clickSearch().then((x) => {
      const res = typesOf(x);
      note('B10P_유형_정보주체만', { 요청: decode(x.request.url).replace(/^https?:\/\/[^/]+/, ''), 결과: res.length });
      expect(decode(x.request.url), '요청 onlyDataSubjectYn').to.include('onlyDataSubjectYn=true');
      expect(decode(x.request.url), '유형 명을 지운 뒤 요청 typeNameKeywords 비어 있음').to.match(/typeNameKeywords=(&|$)/);
      res.forEach((y) => expect(y.dataSubjectYn, `「${y.codeAlias}」 정보주체`).to.eq(true));
      types((s) => {
        expect(s.rows, '정보주체만 결과 행 수 = API').to.eq(Math.min(PER_PAGE, res.length));
        expect(s.subject, '정보주체 아이콘 = 모든 행').to.eq(s.rows);
      });
    });
    toggle('정보주체만 조회');
    switchOn('정보주체만 조회').should('eq', 'false');

    // ---------- 4. 삭제된 유형 포함 ----------
    toggle('삭제된 유형 포함');
    switchOn('삭제된 유형 포함').should('eq', 'true');
    cy.wait(800);
    cy.get('@base').then((base) => clickSearch().then((x) => {
      const res = typesOf(x);
      const deleted = res.filter((y) => y.deleteYn).map((y) => y.codeAlias);
      expect(decode(x.request.url), '요청 deleteYn').to.include('deleteYn=true');
      expect(res.length, '삭제된 유형 포함 건수 ≥ 기본 건수').to.be.at.least(base.length);
      types((s) => expect(s.rows, '삭제 포함 결과 행 수 = API').to.eq(Math.min(PER_PAGE, res.length))).then((s) => {
        note('B10P_유형_삭제포함', { 결과: res.length, 삭제된유형: deleted, 복구버튼_활성: s.restoreOn });
      });
    }));
    A.dumpScreen('B10P_3_유형_삭제포함');
    toggle('삭제된 유형 포함');

    // ---------- 5. 추가(+) 창 → 닫기 ----------
    cy.get('@base').then((base) => {
      cy.get('.grid-add-button').filter((i, e) => shown(e)).first().click({ force: true });
      cy.wait(1500);
      A.dumpScreen('B10P_4_유형_추가창');
      // 추가 화면 모양은 첫 실행에서 확인 (창이면 닫고, 아니면 기록만)
      cy.get('body').then(($b) => {
        const $d = $b.find('.v-dialog--active').filter((i, e) => shown(e)).last();
        if (!$d.length) { note('B10P_유형_추가창', '(창 없음)'); return; }
        note('B10P_유형_추가창', t($d[0]).slice(0, 500));
        const $x = $d.find('button, .v-btn').filter((i, e) => shown(e) && /^(취소|닫기|close)$/.test(t(e)));
        if ($x.length) cy.wrap($x.last()).click({ force: true }); else cy.get('body').type('{esc}', { force: true });
        cy.wait(1200);
        cy.get('body').should(($b2) => expect($b2.find('.v-dialog--active').filter((i, e) => shown(e)).length, '추가 창 닫힘').to.eq(0));
      });
      go();
      cy.wait('@pt', { timeout: 20000 }).then((x) => expect(typesOf(x).length, '추가 창 취소 뒤 유형 수').to.eq(base.length));
    });
  });

  it('식별 키워드 정의 — 안내 · 트리 묶음 숫자 = 항목 수 · 키워드 선택 → 설정 칸 (조회만)', { retries: 0 }, () => {
    go('식별 키워드 정의');
    A.dumpScreen('B10P_5_키워드_처음');

    // 안내 문구
    cy.get('body').should(($b) => expect(t($b[0]), '재기동 안내').to.include('식별 키워드 수정 후 원활한 탐색을 위해 로그캐치 웹 매니저를 재기동해주시기 바랍니다.'));
    // [관찰] 트리 검색칸에 「(unknown)」 이 보이는지 (probe18 HTML 에 들어 있음 — 화면에 보이는지만 기록)
    cy.get('body').then(($b) => {
      const v = $b.find('.privacy-keyword-tree-root .vue-treeselect__single-value').filter((i, e) => shown(e)).toArray().map(t);
      note('B10P_관찰_트리검색칸', v.length ? `${v.join(', ')} (0039003)` : '(안 보임)');
    });

    // ---------- 트리 : 묶음 숫자 = 항목 수 ----------
    cy.get('.privacy-keyword-tree-root .vue-treeselect__list-item.vue-treeselect__indent-level-0', { timeout: 15000 }).should('have.length.at.least', 1).then(($g) => {
      const groups = $g.toArray().map((g) => ({ g, label: labelOf(g) }));
      note('B10P_키워드_묶음', groups.map((x) => x.label));
      expect(groups.map((x) => x.label.replace(/\s*\(\d+\)$/, '')), '트리 묶음').to.include.members(['전역', '업무 시스템']);
      groups.forEach(({ g, label }) => {
        const n = countOf(label);
        const kids = kidsOf(g, 1);
        expect(kids.length, `「${label}」 아래 항목 수`).to.eq(n);
        kids.forEach((k) => {
          const kl = labelOf(k);
          const kn = countOf(kl);
          const leaves = kidsOf(k, 2);
          if (kn !== null) expect(leaves.length, `「${kl}」 아래 키워드 수`).to.eq(kn);
        });
      });
      const empty = groups.flatMap(({ g }) => kidsOf(g, 1)).filter((k) => countOf(labelOf(k)) === null).map((k) => `${labelOf(k)} (키워드 ${kidsOf(k, 2).length})`);
      if (empty.length) note('B10P_키워드_숫자없는폴더', empty);
    });

    // ---------- 키워드 항목 선택 → 설정 칸 ----------
    //   [2026-11-13 수동 확인] 「도로명 주소_b4gk0u」 를 누르면 오른쪽 설정 칸이 그 키워드로 바뀜
    //     개인정보 유형 도로명 주소 · 대상 업무시스템 지정 · 업무 시스템 리눅스_VIP고객 · Content Type NEXACRO_SSV · 키워드 값 (1) 거주지 주소
    //     · 이름 도로명 주소_b4gk0u · 트리 위 검색칸에도 그 이름
    //   자동화에서 보통 realClick 은 화면을 스크롤하며 다른 곳을 누름 → 스크롤 없이 realClick (안 되면 vue-treeselect 가 받는 mousedown)
    //   폴더 이름 「<업무시스템>_<Content Type> (N)」 과 설정 칸의 업무 시스템 · Content Type 을 대조
    const leafSel = '.privacy-keyword-tree-root .vue-treeselect__list-item.vue-treeselect__indent-level-2';
    const nameInput = () => cy.get('input[aria-label="이름"]').filter((i, e) => shown(e)).first();
    const selText = (label) => cy.get(`input[aria-label="${label}"]`).first().parents('.v-select').first().then(($s) => t($s.find('.v-select__selections')[0]));
    cy.get(leafSel).filter((i, e) => shown(e)).first().then(($leaf) => {
      const kid = clean(t($leaf[0].querySelector('label.text-label')));
      const folderItem = $leaf[0].closest('.vue-treeselect__indent-level-1');
      const folder = clean(labelOf(folderItem)).replace(/\s*\(\d+\)$/, '');
      // [2026-11-13 09:34 실행] mousedown 은 안 먹고 realClick({ scrollBehavior: false }) 로 선택됨 → realClick 먼저, 안 되면 mousedown
      cy.get(leafSel).filter((i, e) => shown(e)).first().find('label.text-label').first().realClick({ scrollBehavior: false });
      cy.wait(2500);
      cy.get('body').then(($b) => {
        const v = $b.find('input[aria-label="이름"]').filter((i, e) => shown(e)).val();
        if (v === kid) { note('B10P_키워드_선택방법', 'realClick'); return; }
        cy.get(leafSel).filter((i, e) => shown(e)).first().find('.vue-treeselect__label-container').first().trigger('mousedown', { button: 0, which: 1, force: true });
        cy.wait(2500);
        note('B10P_키워드_선택방법', 'realClick 안 됨 → mousedown');
      });
      A.dumpScreen('B10P_6_키워드_선택');
      nameInput().should('have.value', kid);
      selText('개인정보 유형').then((type) => expect(nos(kid).startsWith(nos(type)), `키워드 「${kid}」 ↔ 개인정보 유형 「${type}」`).to.eq(true));
      cy.get('input[aria-label="업무시스템 지정"]').first().should('have.attr', 'aria-checked', 'true');
      selText('업무 시스템').then((sys) => {
        expect(sys, '업무 시스템').to.not.eq('');
        expect(folder.startsWith(`${sys}_`), `폴더 「${folder}」 ↔ 업무 시스템 「${sys}」`).to.eq(true);
        cy.get('input[aria-label="Content Type"]').first().parents('.v-select').first().find('.v-chip').then(($c) => {
          const cts = $c.toArray().map(t).map((x) => x.replace(/\s*(cancel|close)$/, '').trim()).filter(Boolean);
          expect(cts.length, 'Content Type 칩').to.be.greaterThan(0);
          expect(cts.some((ct) => folder === `${sys}_${ct}`), `폴더 「${folder}」 ↔ Content Type ${JSON.stringify(cts)}`).to.eq(true);
          // [관찰 2026-11-13 수동 확인] 「키워드 값」 칩이 입력칸 테두리 밖(왼쪽 위 · 아래)으로 벗어나 보임 (다크 · 라이트 모두) → 칩 · 입력칸 위치를 기록만 (Mantis 0039004)
          //   [2026-11-13 09:44 실행] 칩이 있으면 「항목을 입력하고 …」 안내가 빠져, 그 안내로 찾으면 아래 유사 키워드 칸이 잡힘(칩 0개로 기록됨)
          //   → 「키워드 값 :」 글자 옆 칸의 .v-input__slot 과 그 안 .chips-container 의 칩을 비교
          cy.get('body').then(($b) => {
            const lab = $b.find('.flex').filter((i, e) => shown(e) && /^키워드 값(\s*\(\d+\))?\s*:?$/.test(t(e)))[0];
            const slot = lab && lab.parentElement && lab.parentElement.querySelector('.v-input__slot');
            if (!slot) { note('B10P_관찰_키워드값_칩위치', { mantis: '0039004', 결과: '(키워드 값 칸 못 찾음)' }); return; }
            const box = slot.getBoundingClientRect();
            const cc = slot.querySelector('.chips-container');
            const chips = (cc ? [...cc.children] : []).filter(shown).map((c) => {
              const r = c.getBoundingClientRect();
              return { text: t(c), out: { left: Math.round(box.left - r.left), top: Math.round(box.top - r.top), bottom: Math.round(r.bottom - box.bottom), right: Math.round(r.right - box.right) } };
            });
            note('B10P_관찰_키워드값_칩위치', {
              mantis: '0039004',
              글자: t(lab),
              칸: { top: Math.round(box.top), bottom: Math.round(box.bottom), left: Math.round(box.left), right: Math.round(box.right), height: Math.round(box.height) },
              칩: chips,
              벗어남: chips.some((c) => c.out.left > 0 || c.out.top > 0 || c.out.bottom > 0 || c.out.right > 0)
            });
          });
          cy.get('.privacy-keyword-tree-root .vue-treeselect__single-value').first().then(($v) => {
            note('B10P_키워드_선택', { 항목: kid, 폴더: folder, 업무시스템: sys, ContentType: cts, 트리검색칸: t($v[0]) });
            expect(t($v[0]), '트리 위 검색칸 = 고른 키워드').to.eq(kid);
          });
        });
      });
    });

    // ---------- 유사 키워드 검색 (기록만) ----------
    cy.get('.v-btn__content').filter((i, e) => shown(e) && t(e) === '검색').first().click({ force: true });
    cy.wait(2500);
    cy.get('body').then(($b) => {
      const pg = (t($b.find('.v-content__wrap').last()[0]).match(/(\d+)\s*-\s*(\d+)\s*of\s*(\d+)/g) || []);
      note('B10P_유사키워드_검색', pg);
    });
    A.dumpScreen('B10P_7_유사키워드');
  });
});
