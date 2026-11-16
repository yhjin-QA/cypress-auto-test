// ==========================================================================
// [2.9.7 신규] 14_1_Basic_관리자_PROXY_통계정책_라이선스
//   커버리지(2026-11-16) 관리자 관리 · 설정 중 기능 동작 검증이 없던 화면 — 조회 전용
//   1. 관리자 관리 > 시스템 > PROXY 관리 : 목록 · 이름 검색(있는 이름 / 없는 이름) · 등록 창 열고 닫기 · 첫 행 열고 닫기
//   2. 관리자 관리 > 데이터 시각화 관리 > 통계 정책 관리 : 「총 N건」 = 행 수 · 검색어 필터 · 활성/비활성 필터 · 실행 이력 · 수정 창 열고 닫기
//   3. 관리자 설정 > 관리자 > 라이선스 관리 : 발급 정보 값 · LOG CATCH 라이선스 표 (라이선스 키 가져오기 · 변경은 누르지 않음)
//   [안전장치] 저장 · 삭제 · 실행 성격 요청(delete · remove · save · insert · modify · regist · update · execute · rebuild · run)은
//             intercept 로 서버에 보내지 않고 막은 뒤, 막은 요청이 0건인지 확인 (즉시 실행 · 날짜 재구축 · 삭제 버튼은 누르지 않음)
//   첫 실행은 화면 구조 기록 단계 — cypress/probe/B14P_관찰.json · B14P_*.json 을 보고 확인 항목을 구체화
//   비밀번호: cypress.env.json (LC_PW)
// ==========================================================================
const A = require('../../support/anomaly');

const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const tc = (e) => (e ? (e.textContent || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const obs = {};
const note = (k, v) => {
  obs[k] = v;
  cy.log(`📝 ${k}: ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 300)}`);
  cy.writeFile('cypress/probe/B14P_관찰.json', obs, { log: false });
};
const main = ($b) => $b.find('.v-content__wrap').filter((i, e) => shown(e)).last()[0] || $b[0];
const structure = (k) => cy.get('body').then(($b) => {
  const d = $b.find('.v-dialog--active').filter((i, e) => shown(e)).last()[0];
  const root = d || main($b);
  const v = {
    창: !!d,
    url: $b[0].ownerDocument.location.pathname,
    제목: [...root.querySelectorAll('.c-headline, .v-card__title, .v-toolbar__title, .headline')].filter(shown).map(t).slice(0, 15),
    입력칸: [...root.querySelectorAll('input, textarea')].filter(shown).map((e) => `${e.getAttribute('aria-label') || e.getAttribute('placeholder') || '?'}=${String(e.value).slice(0, 30)}`).slice(0, 40),
    표머리: [...root.querySelectorAll('th')].filter(shown).map(t).slice(0, 30),
    버튼: [...new Set([...root.querySelectorAll('button, .v-btn')].filter(shown).map(t).filter(Boolean))].slice(0, 40)
  };
  note(k, v);
  return cy.wrap(v, { log: false });
});
// 열린 창이면 취소/닫기 (저장 아님) — 창이 아니면 아무것도 안 함
const closeDialog = () => cy.get('body').then(($b) => {
  const $d = $b.find('.v-dialog--active').filter((i, e) => shown(e)).last();
  if (!$d.length) return;
  const $x = $d.find('button, .v-btn').filter((i, e) => shown(e) && /^(취소|닫기|close|clear)$/.test(t(e)));
  if ($x.length) cy.wrap($x.last()).click({ force: true });
  else cy.get('body').type('{esc}', { force: true });
  cy.wait(1200);
});

// ---------- 이동 ----------
const admin = (side, sub) => {
  cy.visit('/logcatch/com/siteMap');
  cy.wait(2500);
  cy.get('.g-IConfig', { timeout: 15000 }).filter(':visible').first().click({ force: true });
  cy.wait(2000);
  cy.get('button.side-menu').filter((i, e) => shown(e) && t(e).includes(side)).first().click({ force: true });
  cy.wait(1200);
  cy.get('.v-list__tile__title').filter((i, e) => shown(e) && t(e) === sub).first().click({ force: true });
  cy.wait(4000);
};
// 탭 : 글자는 CSS 로 대문자 표시될 수 있어 textContent · 대소문자 무시로 비교
const tab = (label) => {
  cy.get('.v-btn__content, button.tab-btn').filter((i, e) => shown(e) && tc(e).toLowerCase() === label.toLowerCase()).last().click({ force: true });
  cy.wait(3000);
};

// ---------- 요청 점검 ----------
const WRITE = /\/logcatch\/.*(delete|remove|save|insert|modify|regist|update|execute|rebuild|run)/i;
const bodyOf = (x) => (x.response && x.response.body && typeof x.response.body === 'object' ? x.response.body : null);
const netFrom = () => cy.get('@net.all', { log: false }).then((xs) => xs.length);
const netOk = (k, from) => cy.get('@net.all', { log: false }).then((xs) => {
  const mine = xs.slice(from).filter((x) => x.response);
  const bad = mine.filter((x) => x.response.statusCode >= 500 || (bodyOf(x) && String(bodyOf(x).code) === '9999'))
    .map((x) => `${x.request.method} ${x.request.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 120)} → ${x.response.statusCode}`);
  note(`${k}_요청`, { 수: mine.length, 오류: bad, 주소: [...new Set(mine.map((x) => `${x.request.method} ${x.request.url.replace(/^https?:\/\/[^/]+/, '').replace(/\?.*/, '')}`))].slice(0, 25) });
  expect(bad, `${k} 요청 오류 (5xx · code 9999)`).to.deep.eq([]);
});

describe('14_1_Basic_관리자_PROXY_통계정책_라이선스', () => {
  A.ignoreErrors();

  beforeEach(() => {
    cy.intercept({ method: /^(POST|PUT|DELETE|PATCH)$/, url: WRITE }, (req) => {
      req.reply({ statusCode: 418, body: { code: 418, message: 'blocked by 14_1_Basic (조회 전용)' } });
    }).as('blocked');
    cy.intercept({ url: /\/logcatch\/(?!.*\.(js|css|png|svg|ico|gif|woff2?|ttf|map)(\?|$))/ }).as('net');
    A.loginAdmin();
  });

  afterEach(() => {
    cy.get('@blocked.all', { log: false }).then((xs) => {
      const v = xs.map((x) => `${x.request.method} ${x.request.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 150)}`);
      if (v.length) note('B14P_막은요청', v);
      expect(v, '저장 · 삭제 · 실행 성격 요청 (조회 전용이라 0건이어야 함)').to.deep.eq([]);
    });
  });

  it('PROXY 관리 — 목록 · 이름 검색 · 등록 창 · 첫 행 열고 닫기', { retries: 0 }, () => {
    netFrom().then((n0) => {
      admin('관리', '시스템');
      tab('Proxy 관리');
      cy.get('th').filter(':visible').should(($th) => {
        const h = $th.toArray().map(tc);
        ['Proxy Address', 'Logtracer'].forEach((x) => expect(h.join(' | '), `PROXY 표 머리 「${x}」`).to.include(x));
      });
      cy.get('body').then(($b) => {
        const root = main($b);
        const pg = t(root).match(/(\d+)\s*-\s*(\d+)\s*of\s*(\d+)/);
        const rows = [...root.querySelectorAll('table tbody tr')].filter((r) => shown(r) && r.querySelectorAll('td').length > 1).map((r) => [...r.querySelectorAll('td')].map(t));
        note('B14P_PROXY_목록', { 전체: pg ? Number(pg[3]) : rows.length, 첫행: rows[0] || null, 행수: rows.length });
        cy.wrap(rows, { log: false }).as('proxyRows');
      });
      A.dumpScreen('B14P_1_PROXY');

      // 이름 검색 : 첫 행 이름 → 그 행 포함 / 없는 이름 → 0건
      cy.get('@proxyRows').then((rows) => {
        if (!rows.length) { note('B14P_PROXY_검색', 'PROXY 없음 — 검색 생략'); return; }
        const name = rows[0][0];
        cy.get('input[aria-label="이름"]').filter(':visible').first().clear({ force: true }).type(name, { force: true });
        cy.get('.v-btn__content').filter((i, e) => shown(e) && t(e) === '검색').first().click({ force: true });
        cy.wait(2500);
        cy.get('body').should(($b) => {
          const r = [...main($b).querySelectorAll('table tbody tr')].filter((x) => shown(x) && x.querySelectorAll('td').length > 1).map((x) => t(x.querySelector('td')));
          expect(r, `PROXY 이름 「${name}」 검색 결과`).to.include(name);
        });
        cy.get('input[aria-label="이름"]').filter(':visible').first().clear({ force: true }).type('zz_auto_없는_proxy', { force: true });
        cy.get('.v-btn__content').filter((i, e) => shown(e) && t(e) === '검색').first().click({ force: true });
        cy.wait(2500);
        cy.get('body').should(($b) => {
          const r = [...main($b).querySelectorAll('table tbody tr')].filter((x) => shown(x) && x.querySelectorAll('td').length > 1);
          expect(r.length, '없는 이름 검색 결과 0건').to.eq(0);
        });
      });

      // 등록 → 창 구조 기록 → 취소로 닫기 (저장 안 함)
      tab('Proxy 관리');
      cy.get('body').then(($b) => {
        const $add = $b.find('button, .v-btn').filter((i, e) => shown(e) && t(e) === '등록').last();
        if (!$add.length) { note('B14P_PROXY_추가', '「등록」 버튼 못 찾음'); return; }
        cy.wrap($add).click({ force: true });
        cy.wait(2000);
        structure('B14P_PROXY_추가');
        A.dumpScreen('B14P_2_PROXY추가');
        closeDialog();
      });

      // 첫 행 열기 → 구조 기록 → 닫기
      cy.get('@proxyRows').then((rows) => {
        if (!rows.length) return;
        admin('관리', '시스템');
        tab('Proxy 관리');
        cy.get('table').filter(':visible').find('tbody tr').first().find('td').first()
          .then(($td) => cy.wrap($td.find('a').get(0) || $td.get(0)).realClick({ position: 'left' }));
        cy.wait(2500);
        structure('B14P_PROXY_상세');
        A.dumpScreen('B14P_3_PROXY상세');
        closeDialog();
      });
      netOk('B14P_PROXY', n0);
    });
  });

  it('통계 정책 관리 — 총 건수 · 검색어 · 활성 필터 · 실행 이력 · 수정 창', { retries: 0 }, () => {
    const go = () => {
      admin('관리', '데이터 시각화 관리');
      cy.contains('button.tab-btn', /^\s*통계 정책 관리\s*$/).click({ force: true });
      cy.wait(3000);
      cy.get('.policy-table', { timeout: 15000 }).should('be.visible');
    };
    const rowsOf = ($b) => $b.find('.policy-table tbody tr').filter((i, e) => shown(e) && e.querySelectorAll('td').length > 1).toArray().map((r) => ({
      id: tc(r.querySelector('.policy-id-cell')),
      name: tc(r.querySelector('.policy-name-cell')),
      cls: tc(r.querySelector('.policy-class-cell')),
      active: tc(r.querySelectorAll('td')[5])
    }));
    const total = ($b) => parseInt((tc($b.find('.table-footer .caption')[0]).match(/총\s*(\d+)\s*건/) || [])[1] || '-1', 10);
    netFrom().then((n0) => {
      go();
      cy.get('body').then(($b) => {
        const rows = rowsOf($b);
        note('B14P_통계정책_목록', { 총: total($b), 행수: rows.length, 활성값: [...new Set(rows.map((r) => r.active))], 분류: [...new Set(rows.map((r) => r.cls))], 첫행: rows[0] || null });
        expect(total($b), '「총 N건」 = 행 수').to.eq(rows.length);
        cy.wrap(rows, { log: false }).as('rows');
      });
      A.dumpScreen('B14P_4_통계정책');

      // 검색어 : 첫 정책 이름 → 결과 행 모두 그 글자 포함 (정책명 · 테이블 · 분류 중)
      cy.get('@rows').then((rows) => {
        if (!rows.length) return;
        const kw = rows[0].name;
        cy.get('input[placeholder="정책명, 테이블명, 분류 검색"]').filter(':visible').first().clear({ force: true }).type(kw, { force: true });
        cy.wait(2000);
        cy.get('body').should(($b) => {
          const r = $b.find('.policy-table tbody tr').filter((i, e) => shown(e) && e.querySelectorAll('td').length > 1).toArray().map(tc);
          expect(r.length, `검색어 「${kw}」 결과`).to.be.greaterThan(0);
          r.forEach((x) => expect(x, `검색어 「${kw}」 결과 행`).to.include(kw));
        });
        cy.get('body').then(($b) => note('B14P_통계정책_검색', { 검색어: kw, 결과수: $b.find('.policy-table tbody tr').filter((i, e) => shown(e)).length, 총: total($b) }));
        cy.get('input[placeholder="정책명, 테이블명, 분류 검색"]').filter(':visible').first().clear({ force: true });
        cy.wait(1500);
      });

      // 활성 · 비활성 필터 : 각 결과 수 합 = 전체
      ['활성', '비활성', '전체'].forEach((f) => {
        cy.get('.severity-filter-group button.sev-filter-btn').filter((i, e) => tc(e) === f).first().click({ force: true });
        cy.wait(1500);
        cy.get('body').then(($b) => {
          const rows = rowsOf($b);
          obs[`B14P_통계정책_필터_${f}`] = { 행수: rows.length, 활성값: [...new Set(rows.map((r) => r.active))] };
          note(`B14P_통계정책_필터_${f}`, obs[`B14P_통계정책_필터_${f}`]);
        });
      });
      cy.get('@rows').then((rows) => {
        const on = obs.B14P_통계정책_필터_활성.행수;
        const off = obs.B14P_통계정책_필터_비활성.행수;
        expect(on + off, `활성(${on}) + 비활성(${off}) = 전체(${rows.length})`).to.eq(rows.length);
        expect(obs.B14P_통계정책_필터_전체.행수, '「전체」로 되돌리면 전체 행').to.eq(rows.length);
      });

      // 실행 이력 · 수정 : 첫 행 버튼 → 창 구조 기록 → 닫기 (즉시 실행 · 삭제는 누르지 않음)
      cy.get('@rows').then((rows) => {
        if (!rows.length) return;
        ['실행 이력', '수정'].forEach((title) => {
          go();
          cy.get('.policy-table tbody tr').filter(':visible').first().find(`.policy-action-cell button[title="${title}"]`).click({ force: true });
          cy.wait(2500);
          structure(`B14P_통계정책_${title.replace(/\s/g, '')}`).then((v) => {
            expect(v.창 || v.입력칸.length > 0 || v.표머리.length > 0, `통계 정책 「${title}」 열림`).to.eq(true);
          });
          A.dumpScreen(`B14P_5_통계정책_${title.replace(/\s/g, '')}`);
          closeDialog();
        });
      });
      netOk('B14P_통계정책', n0);
    });
  });

  it('라이선스 — 발급 정보 · LOG CATCH 라이선스 표 (조회만)', { retries: 0 }, () => {
    netFrom().then((n0) => {
      admin('설정', '관리자');
      tab('라이선스 관리');
      cy.contains('.c-headline', '발급 라이선스 정보').should('exist');
      cy.get('body').then(($b) => {
        const val = (label) => {
          const i = $b.find(`input[aria-label="${label}"]`).filter((k, e) => shown(e))[0];
          return i ? String(i.value) : null;
        };
        const info = { 발급아이디: val('발급 아이디'), 이름: val('이름'), 설명: val('설명'), 국가: val('국가'), 발급일시: val('발급 일시') };
        const tb = [...$b.find('table').toArray()].filter(shown).find((x) => /라이선스 유형/.test(tc(x)));
        const head = tb ? [...tb.querySelectorAll('th')].map(tc) : [];
        // LOG CATCH 표는 세로형 (th = 항목, td = 값)
        const kv = {};
        if (tb) [...tb.querySelectorAll('tr')].forEach((r) => { const h = r.querySelector('th'); const d = r.querySelector('td'); if (h && d) kv[tc(h)] = tc(d); });
        const rows = Object.entries(kv);
        note('B14P_라이선스', { 발급정보: info, 표머리: head, 행: rows });
        ['발급아이디', '발급일시'].forEach((k) => expect(info[k], `라이선스 ${k} 값`).to.be.a('string').and.not.be.empty);
        expect(info.발급일시, '발급 일시 형식').to.match(/\d{4}-\d{2}-\d{2}/);
        expect(head.join(' | '), 'LOG CATCH 표 머리').to.include('라이선스 유형').and.include('Log Tracer 가용 대수');
        expect(kv['라이선스 유형'], '라이선스 유형 값').to.be.a('string').and.not.be.empty;
        expect(kv['Log Tracer 가용 대수'], 'Log Tracer 가용 대수 = 숫자').to.match(/^\d[\d,]*$/);
      });
      // 다크 대비 래퍼(Dark_Contrast_Check_Basic/14_1)는 클릭 직전 화면을 검사하므로, 라이선스 화면이 검사되도록 제목을 한 번 클릭 (동작 없음)
      cy.contains('.c-headline', '발급 라이선스 정보').click({ force: true });
      A.dumpScreen('B14P_6_라이선스');
      netOk('B14P_라이선스', n0);
    });
  });
});
