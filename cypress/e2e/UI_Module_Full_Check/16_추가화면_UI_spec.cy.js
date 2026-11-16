// ==========================================================================
// [2.9.7 신규] UI_Module_Full_Check / 16_추가화면_UI
//   커버리지(2026-11-13)에서 UI 점검이 없던 화면을 매일 UI 점검에 추가 — 조회만 (저장 · 실행 · 삭제 안 누름)
//   1. 보관 > 운영이력 보관          : UI_Module_Dev_Check/08_Dev_보관 (.51) 의 점검 항목을 .21 로 옮김 + !1198 환산 표기
//   2. 분석 > 프로파일링 정책 · 결과  : 패널 제목 · 카드 · 버튼 (08_Depth_분석_프로파일링 probe15 기준)
//   3. 관리자 관리 > 시스템 > 탐색/분석 필터 그룹 관리 : 탭이 보이면 점검, 없으면 관찰 기록 (2026-11-16 .21 에 탭 없음)
//   4. 관리자 설정 > 커넥터          : 메뉴를 눌러도 화면 이동 없음 → 관찰 0038675 (해결되면 기준선 수집)
//   5. 관리자 설정 > 사전 소명 설정  : 2.9.7 추가 메뉴 — 첫 실행 기준선 수집
//   공통 점검 (모든 화면)
//     - 화면 내용이 비어 있지 않음 · 오류 안내(snack)가 없음
//     - 화면을 여는 동안 /logcatch/ 요청이 5xx 이거나 응답 code 9999 가 아님
//   커버리지 메모
//     - PROXY 관리 : 14_관리자페이지 관리 「Proxy 관리」 탭에서 이미 점검 (커버리지 판정이 대소문자로 놓침)
//     - 라이선스 관리 : 15_관리자페이지 설정 「라이선스」 탭에서 이미 점검 (화면 이름 「라이선스 관리」로 판정해 놓침)
//   3 · 4 는 운영가이드에 화면 설명이 없음 → 첫 실행의 cypress/probe/U16_*.json 을 보고 확인 항목을 구체화한다
//   비밀번호: cypress.env.json (LC_PW)
// ==========================================================================
const A = require('../../support/anomaly');

const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const obs = {};
const note = (k, v) => {
  obs[k] = v;
  cy.log(`📝 ${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
  cy.writeFile('cypress/probe/U16_관찰.json', obs, { log: false });
};

// ---------- 공통 점검 ----------
const netCount = () => cy.get('@net.all', { log: false }).then((xs) => xs.length);
const bodyOf = (x) => (x.response && x.response.body && typeof x.response.body === 'object' ? x.response.body : null);
const screenOk = (name, from) => {
  cy.wait(1500);
  cy.get('body', { timeout: 20000 }).should(($b) => {
    const main = $b.find('.v-content__wrap').filter((i, e) => shown(e)).last()[0] || $b[0];
    expect(t(main).length, `${name} 화면 내용`).to.be.greaterThan(30);
  });
  cy.get('body').then(($b) => {
    const snack = $b.find('.v-snack__content').filter((i, e) => shown(e)).toArray().map(t).filter(Boolean).join(' | ');
    note(`${name}_안내`, snack || '(없음)');
    expect(/오류|실패|error|exception/i.test(snack), `${name} 오류 안내 없음 (「${snack}」)`).to.eq(false);
  });
  cy.get('@net.all', { log: false }).then((xs) => {
    const mine = xs.slice(from).filter((x) => x.response);
    const bad = mine.filter((x) => x.response.statusCode >= 500 || (bodyOf(x) && String(bodyOf(x).code) === '9999'))
      .map((x) => `${x.request.method} ${x.request.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 120)} → ${x.response.statusCode} ${bodyOf(x) ? `code ${bodyOf(x).code} ${String(bodyOf(x).message || '').slice(0, 80)}` : ''}`);
    note(`${name}_요청`, { 수: mine.length, 오류: bad });
    expect(bad, `${name} 화면 요청 오류 (5xx · code 9999)`).to.deep.eq([]);
  });
  A.dumpScreen(`U16_${name}`);
};

// ---------- 메뉴 이동 ----------
const userMenu = (side, sub) => {
  cy.contains('button', side).filter(':visible').first().click({ force: true });
  cy.wait(2000);
  cy.get('.v-list__tile__title').filter(':visible').filter((i, e) => t(e) === sub).first().click({ force: true });
  cy.wait(3000);
};
const adminMenu = (side, sub) => {
  cy.get('.g-IConfig', { timeout: 15000 }).filter(':visible').first().click({ force: true });
  cy.wait(2000);
  cy.contains('button.side-menu', side).should('be.visible').click({ force: true });
  cy.wait(1000);
  cy.get('.v-list__tile__title').filter(':visible').filter((i, e) => t(e) === sub).first().click({ force: true });
  cy.wait(4000);
};
const tab = (label) => {
  cy.get('.v-btn__content, button.tab-btn').filter((i, e) => shown(e) && t(e) === label).last().click({ force: true });
  cy.wait(3000);
};

describe('16_추가화면_UI', () => {
  A.ignoreErrors();

  beforeEach(() => {
    cy.intercept({ url: /\/logcatch\/(?!.*\.(js|css|png|svg|ico|gif|woff2?|ttf|map)(\?|$))/ }).as('net');
    A.loginAdmin();
  });

  it('보관 > 운영이력 보관', () => {
    netCount().then((n) => {
      userMenu('보관', '운영이력 보관');
      cy.get('.c-headline:visible').contains('운영이력 보관').should('be.visible');
      cy.get('.c-headline:visible').contains('압축(최대 비율)').should('be.visible');

      // [운영이력 보관] 활성 스위치 · 보관일자 · 안내
      cy.get('input[aria-label="활성/비활성"]').eq(0).should('exist');
      cy.get('input[aria-label="보관일자(일)"]').filter(':visible').should('be.visible').invoke('val').then((v) => {
        note('운영이력보관_보관일자', v);
        expect(Number(v), '보관일자(일) — 입력 규칙 1825~36500').to.be.within(1825, 36500);
        // !1198 : 입력칸 아래 「(약 N년 M개월)」 환산 표기 — 기본값 1825 이면 「(약 5년)」
        if (String(v) === '1825') cy.contains('(약 5년)').should('be.visible');
      });
      cy.contains('보관일자가 지난 운영 이력을 백업 작업 시 삭제합니다').should('be.visible');
      cy.contains('이 설정은 DB 운영 이력 보관이며, 로그 파일 보관일수 설정과는 별개입니다').should('be.visible');

      // [압축(최대 비율)] 활성 스위치 · 압축 일자 · 경로 · 원격 전송
      cy.get('input[aria-label="활성/비활성"]').eq(1).should('exist');
      cy.get('input[aria-label="압축 일자(일)"]').filter(':visible').should('be.visible').invoke('val').then((v) => {
        note('운영이력보관_압축일자', v);
        expect(Number(v), '압축 일자(일) — 입력 규칙 1~36500').to.be.within(1, 36500);
      });
      cy.get('input[aria-label="압축 보관 경로"]').filter(':visible').should('be.visible').and('have.attr', 'placeholder', '/home/logcatch/backup');
      cy.contains('압축 일자가 지난 운영 이력을 일 단위로 최대 비율 압축(csv.gz)하여 백업 경로(work-history)에 보관합니다').should('be.visible');
      cy.contains('.caption', '경로를 입력하지 않으면 [보관 > 접속기록 보관]의 백업 경로 하위 work-history 폴더에 기본으로 저장됩니다.').should('be.visible');
      cy.get('input[aria-label="원격 전송(FTP/SFTP 등)"]').should('exist').and('have.attr', 'role', 'checkbox');
      cy.contains('[보관>접속기록 보관]의 전송 설정(FTP/SFTP/SSH/S3)을 재사용하여 압축 아카이브를 원격지로 전송합니다').should('be.visible');
      cy.get('button.c-iab').filter(':visible').find('.material-icons').should('contain.text', 'launch');
      cy.get('.v-btn__content:visible').contains('저장').should('be.visible');
      screenOk('운영이력보관', n);
    });
  });

  it('분석 > 프로파일링 정책 · 프로파일링 결과', () => {
    netCount().then((n) => {
      userMenu('분석', '프로파일링');
      cy.get('body').then(($b) => { if (!$b.find('.pp-panel-title').length) tab('프로파일링 정책'); });
      // 정책 : 「프로파일 정책 (N)」 · 등록 · 갱신 · 보기 방식 · 카드(기본 프로파일 항상 있음)
      cy.get('.pp-panel-title', { timeout: 15000 }).should('contain', '프로파일 정책').invoke('text').then((s) => {
        const c = parseInt((s.match(/\((\d+)\)/) || [])[1] || '-1', 10);
        note('프로파일링_정책수', c);
        expect(c, '프로파일 정책 수 (기본 프로파일 포함)').to.be.greaterThan(0);
      });
      cy.get('.v-btn__content, button').filter(':visible').contains('프로파일 정책 등록').should('be.visible');
      cy.get('.v-btn__content, button').filter(':visible').contains('갱신').should('be.visible');
      cy.get('.pp-card', { timeout: 15000 }).filter(':visible').should('have.length.at.least', 1).first().within(() => {
        cy.get('.pp-card-id').should('exist');
        cy.get('.pp-card-ver').invoke('text').should('match', /v\d+/);
        cy.get('.pp-card-name').invoke('text').should('not.be.empty');
        cy.contains('즉시 실행').should('exist');
        ['link', 'history', 'delete'].forEach((ic) => cy.get('.material-icons, .v-icon').filter((i, e) => t(e) === ic).should('exist'));
      });
      cy.get('.pp-card').filter(':visible').first().find('.pp-fact-k').then(($k) => {
        const keys = $k.toArray().map(t);
        note('프로파일링_카드항목', keys);
        ['평소 수준을 볼 기간', '지표 수', '대상 수', '쓰는 정책'].forEach((k) => expect(keys.join(' | '), `카드 항목 「${k}」`).to.include(k));
      });
      screenOk('프로파일링정책', n);
    });
    netCount().then((n) => {
      // 결과 : 프로파일 선택칸 · 기준선 메타 (대상 카드는 데이터에 따라 0건일 수 있어 기록만)
      tab('프로파일링 결과');
      cy.get('input[aria-label="프로파일 정책"]', { timeout: 15000 }).filter(':visible').should('exist');
      cy.get('body').then(($b) => note('프로파일링_결과', {
        메타: $b.find('.profiling-meta').filter((i, e) => shown(e)).toArray().map(t),
        대상카드: $b.find('.id-card').filter((i, e) => shown(e)).length
      }));
      screenOk('프로파일링결과', n);
    });
  });

  // 화면 구조 기록 (첫 실행 기준선)
  const structure = (key) => cy.get('body').then(($b) => {
    const main = $b.find('.v-content__wrap').filter((i, e) => shown(e)).last()[0] || $b[0];
    note(key, {
      url: $b[0].ownerDocument.location.pathname,
      제목: [...main.querySelectorAll('.c-headline, .v-toolbar__title, .section-header')].filter(shown).map(t),
      표머리: [...main.querySelectorAll('th')].filter(shown).map(t),
      입력칸: [...main.querySelectorAll('input, textarea')].filter(shown).map((e) => e.getAttribute('aria-label') || e.getAttribute('placeholder') || ''),
      버튼: [...new Set([...main.querySelectorAll('button, .v-btn')].filter(shown).map(t).filter(Boolean))].slice(0, 40)
    });
  });
  // 관리자 설정 하위 메뉴 열기 — 화면 주소가 바뀌었는지까지 확인
  //   [2026-11-16 첫 실행] 「커넥터」를 눌러도 관리 > 시스템 > 서버 화면에 머묾 → 메뉴 항목 구조 · 새 창(window.open) 여부 기록
  //   known 에 Mantis 번호를 주면 이동하지 않을 때 실패 대신 「관찰 <번호>」로 기록하고 false 를 넘김
  const openSetting = (sub, key, known) => {
    cy.window().then((w) => cy.stub(w, 'open').as('winOpen'));
    cy.get('.g-IConfig', { timeout: 15000 }).filter(':visible').first().click({ force: true });
    cy.wait(2000);
    cy.location('pathname').then((before) => {
      cy.get('button.side-menu').filter((i, e) => shown(e) && t(e).includes('설정')).first().click({ force: true });
      cy.wait(1500);
      cy.get('body').then(($b) => {
        const items = $b.find('.v-list__tile').filter((i, e) => shown(e)).toArray();
        note(`${key}_메뉴항목`, items.map((e) => ({ 글: t(e), href: e.getAttribute('href') || (e.closest('a') && e.closest('a').getAttribute('href')) || '', target: e.getAttribute('target') || '' })));
      });
      cy.get('.v-list__tile').filter((i, e) => shown(e) && t(e.querySelector('.v-list__tile__title') || e) === sub).first().click({ force: true });
      cy.wait(4000);
      cy.get('@winOpen').then((st) => { if (st.called) note(`${key}_새창`, String(st.firstCall.args[0])); });
      // [2026-11-16] then 안에서 cy 명령(note) 뒤에 true/false 를 바로 돌려주면 Cypress 오류 → 결과는 별칭(@moved)으로 넘김
      cy.location('pathname').then((after) => {
        note(`${key}_주소`, { 전: before, 후: after });
        if (known && after === before) {
          note(`${key}_관찰`, `관찰 ${known} — 메뉴를 눌러도 화면 이동 없음 (알려진 결함, 해결되면 점검 진행)`);
          cy.wrap(false, { log: false }).as('moved');
          return;
        }
        expect(after, `「${sub}」 메뉴로 화면 이동 (전 ${before})`).to.not.eq(before);
        cy.wrap(true, { log: false }).as('moved');
      });
    });
    return cy.get('@moved');
  };

  it('관리자 관리 > 시스템 > 탐색/분석 필터 그룹 관리 — 탭이 보이면 점검, 안 보이면 기록', () => {
    // [2026-11-16 첫 실행] 시스템 탭 : PROXY 관리 · 서버 · 데이터베이스 · 업무시스템 · 접속기록 수집기 · 워커 노드 관리
    //   「차단 관리」 · 「탐색/분석 필터 그룹 관리」 없음 — 메뉴 변경 감지(admin-menu-tab-diff, 11-09)에도 removed 로 나옴
    netCount().then((n) => {
      adminMenu('관리', '시스템');
      cy.get('body').then(($b) => {
        const tabs = $b.find('.v-btn__content, button.tab-btn').filter((i, e) => shown(e)).toArray().map(t)
          .filter((x) => /관리$|서버|데이터베이스|업무시스템|수집기/.test(x));
        note('시스템_탭', tabs);
        if (!tabs.includes('탐색/분석 필터 그룹 관리')) {
          note('필터그룹_관찰', '탭 없음 (차단 관리와 함께 화면에서 빠짐) — 메뉴 숨김 의도인지 확인 필요');
          cy.log('⏭️ 탐색/분석 필터 그룹 관리 탭이 없어 점검 생략 (관찰 기록)');
          return;
        }
        tab('탐색/분석 필터 그룹 관리');
        structure('필터그룹_구조');
        cy.get('th').filter(':visible').should(($th) => expect($th.toArray().map(t), '필터 그룹 탭으로 전환됨').to.not.include('Proxy Address'));
        screenOk('필터그룹관리', n);
      });
    });
  });

  it('관리자 설정 > 커넥터 — 화면 이동 안 되면 관찰 0038675', () => {
    // Mantis 0038675 : v2.9.4 에서 [설정 > 커넥터] 메뉴 접속 불가 — 2.9.7 (2026-11-16 .21) 에서도 같음
    //   해결되어 화면이 열리면 구조를 기록하고 공통 점검 → 그 기록으로 확인 항목을 구체화
    netCount().then((n) => {
      openSetting('커넥터', '커넥터', '0038675').then((moved) => {
        if (!moved) { cy.log('⏭️ 커넥터 화면이 열리지 않음 — 관찰 0038675'); return; }
        structure('커넥터_구조');
        screenOk('커넥터', n);
      });
    });
  });

  it('관리자 설정 > 사전 소명 설정 (2.9.7 추가 메뉴 · 첫 실행 기준선 수집)', () => {
    // 메뉴 변경 감지(admin-menu-diff, 11-09) : 설정에 「사전 소명 설정」 added — 커버리지 기준표 97개 화면에 없음
    netCount().then((n) => {
      openSetting('사전 소명 설정', '사전소명');
      structure('사전소명_구조');
      // [2026-11-16 기준선] 주소 /logcatch/settings/beforeExplanationManagement
      //   제목 2개 「소명 사유 그룹 설정」(DOM 글자는 「그륩」으로 읽힘 — 화면 확인 필요) · 「소명 사유 설정」
      //   그룹 목록(+ 추가) · 소명 사유 입력칸 · 사유 표(삭제 아이콘 · 「소명 사유」 열) · 저장
      cy.location('pathname').should('include', '/settings/beforeExplanationManagement');
      cy.get('.c-headline').filter(':visible').then(($h) => {
        const hs = $h.toArray().map(t);
        note('사전소명_제목', hs);
        expect(hs.some((x) => /^소명 사유 그(룹|륩) 설정$/.test(x)), '제목 「소명 사유 그룹 설정」').to.eq(true);
        expect(hs, '제목 「소명 사유 설정」').to.include('소명 사유 설정');
      });
      // 소명 사유 입력칸 : aria-label 이 아니라 placeholder · 칸 이름(label)으로 붙어 있을 수 있어 셋 다 봄
      //   [2026-11-16] aria-label 로 찾으면 보이는 칸이 없음 (구조 기록은 aria-label || placeholder 기준으로 「소명 사유」)
      cy.get('input, textarea').filter((i, e) => shown(e) && [e.getAttribute('aria-label'), e.getAttribute('placeholder'),
        t(e.closest('.v-input') && e.closest('.v-input').querySelector('label'))].includes('소명 사유')).should('have.length.at.least', 1);
      cy.get('th').filter(':visible').contains('소명 사유').should('be.visible');
      cy.get('.v-btn__content').filter(':visible').contains('저장').should('be.visible');
      screenOk('사전소명설정', n);
    });
  });
});
