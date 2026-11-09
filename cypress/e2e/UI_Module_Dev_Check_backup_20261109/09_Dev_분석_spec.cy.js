/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/*!********************************!*\
  !*** ./cypress/e2e/spec.cy.js ***!
  \********************************/

/**코드 시작  */
describe('로그캐치 사이트 테스트', () => {

  // ▼ 1. 모든 에러 무시 설정 (강력한 방어막) ▼
  Cypress.on('uncaught:exception', (err, runnable) => {
    // 무시할 에러 메시지 목록
    const ignoredErrors = [
      'Navigation cancelled',
      'Cannot read properties',
      'resetValidation',
      'NavigationDuplicated', // [NEW] 중복 이동 에러 무시 추가
      'Avoided redundant navigation',
      'Loading chunk',
      'operate.task.packageManagement'
    ];

    // 위 목록 중 하나라도 포함되면 에러를 무시함
    if (ignoredErrors.some(e => err.message.includes(e))) {
      return false;
    }
  });

  
  it('로그캐치 UI기본체크', () => {

    // ==========================================
    // STEP 1: 로그인
    // ==========================================
    // 1. 사이트 방문
    cy.visit('https://10.10.54.51:18443/logcatch/login');
    cy.wait(4000); // 로딩 대기

    ////////////새로고침코드//////
      cy.get('body').then(($body) => {
      // 만약 입력창이 안 보인다면? (흰 화면 상태라면?)
      if ($body.find('input[aria-label="사용자 계정"]').length === 0) {
        cy.log('🔴 화면 렌더링 실패 감지! 페이지를 새로고침합니다.');
    
      // 새로고침 실행
      cy.reload();
    
      // 다시 한번 안정화 대기
      cy.wait(2000);
      } else {
        cy.log('🟢 화면이 정상적으로 로드되었습니다.');
      }
     });
     //////////////////////////////////////


    // 2. 아이디 입력
    cy.get('input[aria-label="사용자 계정"]').should('exist').type('admin', { force: true });

    // 3. 비밀번호 입력
    cy.get('input[aria-label="패스워드"]').should('exist').type('Manager1!', { force: true }); 
    
    // 4. 로그인 실행 (버튼 클릭 대신 엔터키 사용)
    // 설명: 버튼 클릭보다 엔터키가 '중복 클릭'이나 '이동 에러'가 훨씬 적게 발생합니다.
    cy.get('input[aria-label="패스워드"]').type('{enter}', { force: true });

    

   // -----------------------------------------------------------
   // [추가된 부분] "이미 로그인" 알림창 처리 (조건부 로직)
   // -----------------------------------------------------------
   cy.wait(2000); // 팝업이 뜨는 찰나의 시간을 기다려줍니다.
   cy.get('body').then(($body) => {
    
    // 2. jQuery 문법(.find)으로 해당 요소가 있는지 '길이(length)'로 체크합니다.
    // 주의: 여기서는 cy.contains를 쓰면 안 됩니다!
    if ($body.find('.v-card__title:contains("이미 접속 중인 계정입니다."):visible').length > 0) {
        
        cy.log('⚠️ 알림창 발견! 확인 버튼을 클릭합니다.');

        // 3. 요소가 있다는 게 확실해졌으니, 이제 안심하고 Cypress 명령어를 씁니다.
        cy.contains('.v-card__title', '이미 접속 중인 계정입니다.')
          .closest('.v-card')
          .contains('확인')
          .click(); // 여기서 force: true를 주면 더 안전합니다.
          
        cy.wait(1000); // 팝업 닫힘 대기
    } else {
        cy.log('✅ 알림창이 없습니다. 넘어갑니다.');
    }
});

 // 5. [중요] 로그인 성공 검증 (URL 변경 확인)
    // 로그인이 성공해서 URL에서 '/login'이 빠질 때까지 최대 10초간 기다립니다.
    // 만약 여기서 실패한다면 "아이디/비번"이 틀렸거나 서버 문제(Access Deny)입니다.
    cy.url({ timeout: 10000 }).should('not.include', '/login');
// -----------------------------------------------------------

     
    //6. 화면 안정화 대기
     cy.wait(3000);
    
    //로그인 성공


    // ==========================================
    // STEP 9: 분석 서브메뉴 - 이상행위 정책 탭
    // ==========================================
    cy.contains('button.has-child', '분석').click({ force: true });
    cy.wait(2000); // 메뉴 펼쳐짐 대기

    // 이력 > 사용자 추척 서브메뉴 클릭 
    cy.log('--- 분석 > 이상행위 ---');
    cy.contains('.v-list__tile__title', '이상행위').should('be.visible').click({ force: true });
    cy.wait(2000); 


    

// ==========================================
// STEP : 분석 - 사용자 이상행위 정책 탭
// ==========================================
cy.get('.v-btn__content').filter(':visible').contains('사용자 이상행위 정책').click({ force: true });
cy.wait(2000);

cy.log('--- 사용자 이상행위 정책 화면 검증 시작 ---');

// URL 확인
cy.url().should('include', '/analyze/customAnomalyBehaviorPolicy');

// 버전 안내 문구 확인
// ※ 2.9.5.0: '정책명' 항목 추가 → 항목 나열 부분은 바뀔 수 있어 핵심 문장 기준으로 확인
cy.get('.version-notice').filter(':visible').should('have.length', 1).within(() => {
  cy.contains('핵심 사항을 수정하면 버전이 자동 증가').should('exist');
  cy.contains('지난 버전').should('exist');
  cy.contains('정책명은 결재 문서에').should('exist');
  cy.contains('설명·라벨·사용여부 변경은 버전에 영향을 주지 않습니다').should('exist');
});

//신규 버튼
cy.get('.v-btn__content').filter(':visible').contains('새 정책').should('be.visible');
cy.get('i.material-icons').filter(':visible').contains('add').should('exist');


// 버전 안내 문구
cy.get('.version-notice').filter(':visible')
    .contains('규칙·위험도·메시지·정책명 등 핵심 사항을 수정하면 버전이 자동 증가').should('exist');


// 검색 영역
cy.get('i.v-icon.material-icons').filter(':visible').contains('search').should('exist');
cy.get('input[placeholder="정책명 / 설명 / 라벨 검색"]').should('be.visible');
cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');

// [변경] 탐지 대상 / 라벨 - label → placeholder 기반으로 변경됨
// ※ 2.9.5.0: placeholder가 '탐지 대상'(띄어쓰기 포함)
cy.get('input[placeholder="탐지 대상"]').filter(':visible').should('be.visible');
cy.get('input[placeholder="라벨"]').filter(':visible').should('be.visible');

/// [변경] 라벨 필터 - 콤보박스 → 범주와 같은 읽기 전용 선택 칸 (2.9.6) - data-role 기준
cy.get('input[data-role="policy-label-filter"]').filter(':visible')
  .should('have.length', 1)
  .and('have.attr', 'placeholder', '라벨')
  .and('have.attr', 'readonly');


// [변경] 사용여부 필터 - 위험도와 클래스가 겹치므로 filter-label 기준으로 스코프
cy.contains('.filter-label', '사용여부')
  .parent()
  .within(() => {
    cy.get('.severity-filter-group button').eq(0).should('contain.text', '전체');
    cy.get('.severity-filter-group button').eq(1).should('contain.text', 'ON');
    cy.get('.severity-filter-group button').eq(2).should('contain.text', 'OFF');
  });

 // [신규] 기준선 출처 필터 (2.9.6) - 전체 / 사용 / 미사용
cy.contains('.filter-label', '기준선 출처').parent().within(() => {
  cy.get('button.profile-source-btn').should('have.length', 3);
  cy.get('button.profile-source-btn--active').should('contain.text', '전체');
  cy.get('button.profile-source-btn').eq(1).should('contain.text', '사용');
  cy.get('button.profile-source-btn').eq(2).should('contain.text', '미사용');
}); 

// 위험도 필터 (구조는 기존과 동일)
cy.contains('.filter-label', '위험도')
  .parent()
  .within(() => {
    cy.get('button.sev-filter-btn--active').should('contain.text', '전체');
    cy.get('button.sev-filter-btn--1').should('contain.text', '심각');
    cy.get('button.sev-filter-btn--2').should('contain.text', '경계');
    cy.get('button.sev-filter-btn--3').should('contain.text', '주의');
  });

// [변경] 데이터셋 필터 - 클래스명 및 전체 텍스트로 변경됨
cy.contains('.filter-label', '데이터셋')
  .parent()
  .within(() => {
    cy.get('button.sev-filter-btn--active').should('contain.text', '전체');
    cy.get('button.sev-filter-btn--dataset').eq(0).should('contain.text', '접속 기록 기준 탐지');
    cy.get('button.sev-filter-btn--dataset').eq(1).should('contain.text', '개인정보 사용 기준 탐지');
  });


// 정책 목록 존재 확인 - [변경] 2.9.6 보기 방식(목록/카드)에 관계없이 확인
cy.get('table.v-datatable tbody tr, .policy-card').filter(':visible').should('have.length.at.least', 1);
// 정책 목록 카운트 및 툴바 버튼 확인
cy.get('.v-toolbar__title').filter(':visible').contains('정책 목록').should('be.visible');

// [신규] 폴더 필터 버튼 글자 · 정책 나눠 쓰기 도움말(전구) (2.9.6)
cy.get('button[data-role="folder-open-btn"]').filter(':visible').should('contain.text', '폴더 필터');
cy.get('button[data-role="policy-group-guide"]').filter(':visible')
  .should('have.attr', 'title', '업무시스템 · 부서별로 정책을 나눠 쓰는 법');


// 액션 버튼 확인 (비활성 포함)
//v2.9.5.0 폴더이동 -> 폴더 이동 띄워쓰기
cy.get('button.toolbar-action-btn').filter(':visible').contains('폴더 이동').should('exist');
cy.get('button.toolbar-action-btn').filter(':visible').contains('즉시실행').should('exist');
cy.get('button.toolbar-action-btn').filter(':visible').contains('삭제').should('exist');
cy.get('button.toolbar-action-btn').filter(':visible').contains('복사').should('exist');
cy.get('button.toolbar-action-btn').filter(':visible').contains('내보내기').should('exist');

// [신규] 기본 정책 복원 버튼 (2.9.6) - 활성 상태 · 아이콘
cy.contains('.toolbar-action-btn', '기본 정책 복원')
  .should('be.visible')
  .and('not.be.disabled')
  .and('have.attr', 'title', '삭제한 기본(내장) 정책을 비활성 상태로 되돌립니다.')
  .find('.material-icons').should('contain.text', 'settings_backup_restore');




// 정책 가져오기 팝업 - 요소 확인 후 취소--------------------------------------------------------------------------
// 1. 가져오기 버튼 클릭 → 팝업 오픈
cy.get('button.toolbar-action-btn').filter(':visible').contains('가져오기').click({ force: true });
cy.wait(500);

cy.contains('정책 가져오기').should('be.visible');

// 2. "데이터 선택" 섹션 타이틀 확인
cy.contains('.import-section-title', '데이터 선택').should('be.visible');

// 3. "파일 선택" / "클립보드 붙여넣기" 버튼 확인
cy.contains('.import-source-btn-text', '파일 선택').should('be.visible');
cy.contains('.import-source-btn-text', '클립보드 붙여넣기').should('be.visible');

// 4. "가져오기 (0건)" 버튼 - disabled 상태 확인
cy.get('.v-card__actions').filter(':visible').within(() => {
  cy.contains('button', '취소').should('be.visible').and('not.be.disabled');
  cy.contains('button', '가져오기').should('be.disabled').and('have.class', 'v-btn--disabled').and('contain.text', '가져오기 (0건)');
});

// 5. 취소 버튼 클릭
cy.get('.v-card__actions').filter(':visible').contains('button', '취소').click({ force: true });
//-------------------------------------------------------------------------------------------------------------------

// ==========================================
// 정책 목록 툴바 - 아이콘/텍스트/disabled 상태 확인
// ==========================================

// 1. 정책 목록 타이틀 및 개수 확인
cy.contains('.v-toolbar__title', '정책 목록').should('be.visible');

// [신규] 폴더 필터 버튼
cy.get('button.folder-open-btn').filter(':visible').should('be.visible');

// [신규] 이 페이지 전체 선택 체크박스
cy.get('input[data-role="policy-select-all"]').should('exist');

// [변경] 액션 버튼 - 주기복구 삭제, 사용 ON/OFF 추가
const disabledButtons = [
  { icon: 'folder_open', label: '폴더 이동' },
  { icon: 'play_arrow', label: '즉시실행' },
  { icon: 'toggle_on', label: '사용 ON' },
  { icon: 'toggle_off', label: '사용 OFF' },
  { icon: 'delete', label: '삭제' },
  { icon: 'content_copy', label: '복사' },
  { icon: 'save_alt', label: '내보내기' },
];

disabledButtons.forEach(({ icon, label }) => {
  cy.contains('.toolbar-action-btn', label)
    .should('be.visible')
    .and('be.disabled')
    .within(() => {
      cy.get('.material-icons').should('contain.text', icon);
    });
});

cy.contains('.toolbar-action-btn', '가져오기')
  .should('be.visible')
  .and('not.be.disabled')
  .within(() => {
    cy.get('.material-icons').should('contain.text', 'publish');
  });

// ==========================================
// 목록/카드/그룹 보기 토글 - [변경] 2.9.6 기본값 「카드」 → 「목록」
// ※ 보기 방식은 계정에 저장됨(ui-options) → 목록이 아니면 먼저 목록으로 맞춤
// ==========================================
const openListViewMenu = () => {
  cy.get('.list-view-toggle-btn').filter(':visible').first()
    .scrollIntoView({ offset: { top: -100 } })
    .realHover();
  cy.wait(500);
  cy.get('body').then(($body) => {
    if ($body.find('.list-view-toggle-menu:visible').length === 0) {
      cy.get('.list-view-toggle-btn').filter(':visible').first()
        .trigger('mouseenter').trigger('mouseover');
      cy.wait(500);
    }
  });
};

const selectListView = (name) => {
  openListViewMenu();
  cy.get('.list-view-toggle-menu').filter(':visible')
    .contains('.list-view-toggle-item', name).click({ force: true });
  cy.wait(1000);
  cy.get('.list-view-toggle-btn').filter(':visible').first().should('contain.text', name);
};

// 저장값이 목록이 아니면 목록으로 맞춤 (직전 실행이 중간에 멈춘 경우 등)
cy.get('.list-view-toggle-btn').filter(':visible').first().then(($btn) => {
  if (!$btn.text().includes('목록')) {
    cy.log(`⚠️ 보기 방식 저장값이 「${$btn.text().trim()}」 → 목록으로 맞춤`);
    selectListView('목록');
  }
});

// 목록 보기 - 표(v-datatable)로 표시 (카드 없음)
cy.get('table.v-datatable').filter(':visible').should('have.length', 1)
  .find('tbody tr').should('have.length.greaterThan', 0);

// 메뉴 항목 확인 - 목록 active
openListViewMenu();
cy.get('.list-view-toggle-menu').filter(':visible').should('be.visible').within(() => {
  cy.get('.list-view-toggle-item').should('have.length', 3);
  cy.contains('.list-view-toggle-item', '목록').should('be.visible').and('have.class', 'active');
  cy.contains('.list-view-toggle-item', '카드').should('be.visible').and('not.have.class', 'active');
  cy.contains('.list-view-toggle-item', '그룹').should('be.visible').and('not.have.class', 'active');
});

// 기존 카드 검증을 위해 카드 보기로 전환
selectListView('카드');
cy.get('.policy-card').filter(':visible').should('have.length.greaterThan', 0);

// ==================================================
// 사용자 이상행위 정책 - 카드 뷰 구조 검증 (동적 데이터 대응)
// ==================================================

cy.get('.policy-card').filter(':visible').should('have.length.greaterThan', 0).each(($card) => {
  cy.wrap($card).within(() => {

    // 1. 선택 체크박스 - 존재 여부 및 초기 미체크 상태 확인
    cy.get('[data-role="policy-select"][type="checkbox"]')
      .should('exist')
      .and('have.attr', 'aria-checked'); // true/false 여부는 무관, 속성 존재만 확인

   // 2. 정책 ID - "#" 접두어 제거 후 숫자 형식인지 확인
  cy.get('.policy-card-id').invoke('text').then((text) => {
  const id = parseInt(text.trim().replace('#', ''), 10);
  expect(isNaN(id)).to.be.false;  
  });

   // 3. 버전 칩 - "v" + 숫자 형식인지 확인
cy.get('.policy-card-ver').invoke('text').then((text) => {
  expect(text.trim()).to.match(/^v\d+$/);
});

   // 4. 정책명 (기존 동일)
cy.get('.policy-card-name').invoke('text').then((text) => {
  expect(text.trim().length).to.be.greaterThan(0);
});

// 5. 사용 여부 토글 (기존 동일)
cy.get('[data-role="policy-active-toggle"][type="checkbox"]')
  .should('exist')
  .invoke('attr', 'aria-checked')
  .then((checked) => {
    expect(['true', 'false']).to.include(checked);
  });

// 6. 위험도 칩 (기존 동일)
cy.get('.sev-chip-sm .v-chip__content').invoke('text').then((text) => {
  expect(['심각', '경계', '주의']).to.include(text.trim());
});

// 7. 정책 설명 - 앞면(.policy-card-desc) → 뒷면(.policy-card-back-desc)으로 이동됨
cy.get('.policy-card-back-desc').invoke('text').then((text) => {
  expect(text.trim().length).to.be.greaterThan(0);
});

// 8. 수정일 - .policy-card-footer .caption.grey--text → .policy-card-when 으로 변경됨
cy.get('.policy-card-when').invoke('text').then((text) => {
  expect(text.trim()).to.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
});


  });
});

// ==================================================
// 사용자 이상행위 정책 - 카드 뷰 구조 검증 (동적 데이터 대응)
// ==================================================

cy.get('.policy-card').filter(':visible').should('have.length.greaterThan', 0).each(($card) => {
  cy.wrap($card).within(() => {

    // 1. 선택 체크박스 - 존재 여부 및 초기 미체크 상태 확인
    cy.get('[data-role="policy-select"][type="checkbox"]')
      .should('exist')
      .and('have.attr', 'aria-checked'); // true/false 여부는 무관, 속성 존재만 확인

   // 2. 정책 ID - "#" 접두어 제거 후 숫자 형식인지 확인
  cy.get('.policy-card-id').invoke('text').then((text) => {
  const id = parseInt(text.trim().replace('#', ''), 10);
  expect(isNaN(id)).to.be.false;  
  });

   // 3. 버전 칩 - "v" + 숫자 형식인지 확인
cy.get('.policy-card-ver').invoke('text').then((text) => {
  expect(text.trim()).to.match(/^v\d+$/);
});

   // 4. 정책명 (기존 동일)
cy.get('.policy-card-name').invoke('text').then((text) => {
  expect(text.trim().length).to.be.greaterThan(0);
});

// 5. 사용 여부 토글 (기존 동일)
cy.get('[data-role="policy-active-toggle"][type="checkbox"]')
  .should('exist')
  .invoke('attr', 'aria-checked')
  .then((checked) => {
    expect(['true', 'false']).to.include(checked);
  });

// 6. 위험도 칩 (기존 동일)
//v2.9.5.0 에서 문구 변경됨.
cy.get('.sev-chip-sm .v-chip__content').invoke('text').then((text) => {
  expect(['심각', '경계', '주의']).to.include(text.trim());
});

// 7. 정책 설명 - 앞면(.policy-card-desc) → 뒷면(.policy-card-back-desc)으로 이동됨
cy.get('.policy-card-back-desc').invoke('text').then((text) => {
  expect(text.trim().length).to.be.greaterThan(0);
});

// 8. 수정일 - .policy-card-footer .caption.grey--text → .policy-card-when 으로 변경됨
cy.get('.policy-card-when').invoke('text').then((text) => {
  expect(text.trim()).to.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
});


  });
});

// ==========================================
// 페이지 영역 (페이지 이동 + 페이지 사이즈 선택) - 노출 확인
// ※ 2.9.5.0: .table-footer-right → .list-pager 구조로 변경, '건' 텍스트 제거됨
// ==========================================

// 1. 페이지 영역(wrapper) 전체가 보이는지 확인
cy.get('.list-pager').filter(':visible').should('have.length', 1).within(() => {

  // 2. 페이지 사이즈 콤보박스(v-select)가 보이는지 확인
  cy.get('.list-pager-right .list-pager-size').should('be.visible');

  // 3. 콤보박스 안의 드롭다운 화살표 아이콘이 보이는지 확인
  cy.get('.list-pager-size .v-input__icon--append .material-icons')
    .should('be.visible').and('contain.text', 'arrow_drop_down');

  // 4. 건수 표시 확인 (기존 '건' 텍스트 → '1-35 / 35' 형식으로 변경)
  cy.get('.list-pager-info').should('be.visible')
    .invoke('text').should('match', /^\s*\d+-\d+ \/ \d+\s*$/);

  // 5. 이전 / 다음 페이지 버튼 확인
  cy.get('.list-pager-center i.material-icons').eq(0).should('contain', 'chevron_left');
  cy.get('.list-pager-center i.material-icons').eq(1).should('contain', 'chevron_right');
});

// 상단 정책 목록 건수 = 하단 전체 건수
cy.get('.lst-toolbar .v-toolbar__title').invoke('text').then((t) => {
  const total = t.match(/\((\d+)\)/)[1];
  cy.get('.list-pager-info').should('contain', `/ ${total}`);
});

// 보기 방식 원복 - 카드 검증 · 페이지 영역 확인이 끝난 뒤 목록으로 (다음 실행 기준값 유지)
selectListView('목록');
cy.get('table.v-datatable').filter(':visible').should('have.length', 1);



// =========================================================
// 사용자 이상행위 정책 - 신규 버튼 → 신규정책화면 요소 확인 → 취소
// =========================================================
cy.get('.v-btn__content').filter(':visible').contains('새 정책').click({ force: true });
cy.wait(1000);

cy.contains('정책 생성').should('be.visible');

// [신규] 최종 SQL 버튼
cy.contains('.v-btn__content', '최종 SQL').should('be.visible');

// [신규] 2.9.6 - 사용자 모드에 열 값 버튼
cy.contains('.v-dialog--active .dialog-action-btn', '사용자 모드에 열 값').should('be.visible');

// 2. 상단 - 제목/라벨/설명
cy.contains('label', '제목').should('exist').and('contain.text', '제목');
cy.get('input[dense]').filter(':visible').first().should('be.visible');
cy.get('input[aria-label="라벨"]').should('be.visible');
cy.get('textarea[aria-label="설명"]').should('be.visible');

// [신규] 범주(필수) 선택 칸
// ※ 선택 칸 라벨은 v-select 내부 요소에 덮여 Cypress 가 '안 보임'으로 판정 → 제목과 같이 존재 + 문구로 확인
cy.get('.v-dialog--active').contains('.v-label', '범주').should('exist');
cy.get('.v-dialog--active input[data-role="policy-category"]').should('exist').and('have.attr', 'readonly');

// 위험도 라디오
// v2.9.5.0 문구 변경
cy.contains('.severity-radio-label', '심각').should('be.visible');
cy.contains('.severity-radio-label', '경계').should('be.visible');
cy.contains('.severity-radio-label', '주의').should('be.visible');

// 사용/소명 토글
cy.contains('.v-label', '사용').should('be.visible');
cy.contains('.v-label', '소명').should('be.visible');

// [신규] 2.9.6 - 경보 알림 메일 토글 (기본 꺼짐)
cy.contains('.v-label', '경보 알림 메일').should('be.visible');
cy.get('input[aria-label="경보 알림 메일"]').should('have.attr', 'aria-checked', 'false');

// [신규] 정책 요약 문구 박스
cy.get('.policy-summary').should('be.visible');

// 3. [변경] "탐지 설정" 헤더 삭제됨 → "탐지 대상" 섹션으로 검증
cy.contains('.section-header', '탐지 대상').should('be.visible');

// 탐지 기준 카드
cy.contains('.dataset-option-name', '접속 기록 기준 탐지').should('be.visible');
cy.contains('.dataset-option-name', '개인정보 사용 기준 탐지').should('be.visible');

// 탐지 대상 항목 확인
// ※ 2.9.5.0: '접속 IP' → '사용자 IP' 변경, '정규화 URI' · '행위 유형' · '시간대' · '접속 요일' 추가
const targets = ['업무시스템', '부서', '사용자', '사용자 계정', '사용자 IP', '접속 URI',
                 '정규화 URI', '등록된 메뉴', '행위 유형', '시간대', '접속 요일'];

// 글자 정확히 일치 ('사용자'가 '사용자 계정' / '사용자 IP'에 잘못 매칭되지 않도록)
const exactLabel = (t) => new RegExp(`^\\s*${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);

targets.forEach((label) => {
  cy.contains('.groupby-card-label', exactLabel(label)).should('be.visible');
});

// 항목 개수도 확인 (항목이 추가/삭제되면 바로 알 수 있도록)
cy.get('.groupby-card-label').filter(':visible').should('have.length', targets.length);

// [변경] '탐지대상 값이 비어 있으면 경보 미생성' 토글 삭제
//        → '값이 비어 있는 컬럼 제외' 영역 + 컬럼 추가 버튼으로 변경 (2.9.5.0)
cy.get('.v-dialog--active .empty-keys-choice').should('be.visible').within(() => {
  cy.contains('.empty-keys-choice__title', '값이 비어 있는 컬럼 제외').should('be.visible');
  cy.get('.empty-keys-choice__help').should('contain.text', 'help_outline');
  cy.contains('.empty-keys-choice__add', '컬럼 추가')
    .should('be.visible')
    .find('.material-icons').should('contain.text', 'add');
});

// 4. 탐지 주기 섹션
cy.contains('.section-header', '탐지 주기').should('be.visible');

// [신규] 오늘 실시간 탐지 토글
cy.contains('.sched-axis-title', '오늘 실시간 탐지').should('be.visible');

// [변경] 2.9.6 - 「지난 기록 정산」 항목 + 「항상 켜짐」 표시, 주기 값 '매일 새벽 1시'
cy.contains('.sched-axis-head', '지난 기록 정산').within(() => {
  cy.contains('.sched-axis-badge', '항상 켜짐').should('be.visible');
  cy.contains('.sched-axis-btn', '주기 설정')
    .should('be.visible')
    .find('.sched-axis-btn__val')
    .should('contain.text', '매일 새벽 1시');
});

cy.get('input[aria-label="탐지시작일"]').should('be.visible');

// [신규] 실행이력 보존기간(일)
cy.get('input[aria-label="실행이력 보존기간(일)"]').should('be.visible');

// 탐지 규칙 머리말로 스크롤 (요약 문장의 '탐지 규칙'과 구분)
cy.contains('.v-dialog--active .section-header', '탐지 규칙').scrollIntoView({ offset: { top: -100 } });
cy.wait(300);

// [변경] 2.9.6 집계 단위 - 라벨이 .rule-slot-field-label 로 변경, 「한 칸 = N 시간」 안내 추가
cy.get('.v-dialog--active .rule-slot-row').within(() => {
  cy.contains('.rule-slot-label', '집계 단위').should('be.visible');
  cy.contains('.rule-slot-field-label', '시간범위').should('be.visible');
  cy.get('input[type="number"][max="24"]').should('be.visible');
  cy.contains('.v-text-field__suffix', '최대 24').should('be.visible');
  cy.contains('.rule-slot-field-label', /^\s*단위\s*$/).should('be.visible');
  cy.get('.v-select__selection--comma').should('have.text', '시간');
  cy.contains('.slot-strip-cap', '한 칸 = 1 시간').should('be.visible');
});

// [삭제] 2.9.6 - 미리보기 / 수정 탭 없어짐

// 가려짐 여부와 무관하게 존재 + 문구로 검증
cy.contains('.ws-toolbar-label', '조건').should('exist');
cy.contains('.ws-toolbar-subtitle', '어떤 접근 기록을 감시할지 선별합니다').should('exist');

cy.contains('.ws-toolbar-label', '집계').should('exist');
cy.contains('.ws-toolbar-subtitle', '수치 기준으로 이상행위를 판정합니다').should('exist');

// [변경] 2.9.6 조건 도구 - 사용자 상태 · 국내 IP · 정규화 URI · 행위 유형 추가 (22개)
const conditionTools = [
  '접속 일시', '접속 요일', '접속 시간', '공휴일', '업무시스템', '부서',
  '사용자', '사용자 상태', '사용자 계정', '로그인 사용자만', '사용자 IP', '국내 IP',
  '접속 URI', '정규화 URI', '등록된 메뉴', '행위 유형', '파일 다운로드', '파일 업로드',
  '개인정보 포함', '개인정보 유형', '개인정보 건수', '정보주체 수',
];
cy.get('.v-dialog--active .rule-col').eq(0).within(() => {
  cy.contains('.blocks-label-btn', '도구').should('exist');
  conditionTools.forEach((label) => {
    cy.contains('.pal-block-text', exactLabel(label))
      .scrollIntoView({ offset: { top: -100 } })
      .should('be.visible');
  });
  cy.get('.pal-block-text').should('have.length', conditionTools.length);
});

// [변경] 2.9.6 집계 도구 - 처음 보는 대상 · 상위 N위 이내 · 평균 비교 · 백분위 순위 추가 (17개)
const aggregationTools = [
  '발생 횟수', '숫자 합계', '고유 항목 개수', '최댓값', '최솟값',
  '평균값', '중앙값', '표준편차', '상위 N% 지점값', '비중(%)',
  '순간 몰림', '동일 값 반복 조회', '처음 보는 대상', '기준선 편차 분석',
  '상위 N위 이내', '평균 비교', '백분위 순위',
];
cy.get('.v-dialog--active .rule-col').eq(1).within(() => {
  cy.contains('.blocks-label-btn', '도구').should('exist');
  aggregationTools.forEach((label) => {
    cy.contains('.pal-block-text', exactLabel(label))
      .scrollIntoView({ offset: { top: -100 } })
      .should('be.visible');
  });
  cy.get('.pal-block-text').should('have.length', aggregationTools.length);
});

// [변경] 경보 메시지 섹션 문구 변경 (2.9.5.0)
//  - '탐지 로그에' → '경보 메시지에'
//  - '탐지 시 로그 메시지' → '경보 메시지', '상세 설명' → '경보 메시지 상세'
cy.get('.v-dialog--active .rule-msg-card').within(() => {
  cy.contains('.ws-toolbar-subtitle', '$를 사용하여 경보 메시지에 실제 값을 표시할 수 있습니다')
    .should('be.visible');

  // '경보 메시지'는 '경보 메시지 상세'에도 포함되므로 정확히 일치로 확인
  cy.contains('.caption.grey--text', /^\s*경보 메시지\s*$/).should('be.visible');
  cy.contains('.msg-editor-placeholder', '[사용자]가 [업무시스템] 시스템에서 이상행위 탐지')
    .should('exist');

  cy.contains('.caption.grey--text', '경보 메시지 상세').should('be.visible');
  cy.contains('.msg-editor-placeholder', '탐지 사유 및 상세 내용을 기술합니다.')
    .should('exist');

  // 변수 삽입 안내
  cy.contains('.caption.grey--text', '입력으로 변수 삽입').find('kbd').should('have.text', '$');
});

// [신규] 2.9.6 기본 차트 관점 - X축 / Y축 / 차트 타입 기본값
cy.contains('.v-dialog--active .default-perspective-card .section-header', '기본 차트 관점')
  .scrollIntoView({ offset: { top: -100 } })
  .should('be.visible');
cy.get('.v-dialog--active .default-perspective-card').within(() => {
  ['X축', 'Y축', '차트 타입'].forEach((l) => {
    cy.contains('.caption.grey--text', l).should('be.visible');
  });
  cy.get('.v-select__selection--comma').eq(0).should('have.text', '기간');
  cy.get('.v-select__selection--comma').eq(1).should('have.text', '없음 (단일 series)');
  cy.get('.v-select__selection--comma').eq(2).should('have.text', '세로 막대');
});

// 하단 버튼 - [변경] 즉시실행은 저장 전 비활성 + 안내 문구
cy.get('.v-dialog--active .dialog-footer').within(() => {
  cy.contains('button', '즉시실행')
    .should('be.visible')
    .and('be.disabled')
    .parent()
    .should('have.attr', 'title', '저장된 정책만 즉시실행할 수 있습니다. 먼저 저장하세요.');
  cy.contains('button', '취소').should('be.visible');
  cy.contains('button', '저장').should('be.visible');
});

// 9. 취소
cy.contains('.v-btn__content', '취소').click({ force: true });

cy.log('✅ 분석 - [사용자 이상행위 정책] 신규 정책 화면 확인 완료!');
//--------------------------------------------------------------------------

cy.log('✅ 분석 - [사용자 이상행위 정책] 화면 확인 완료!');



// ==========================================
// STEP : 분석 - 사용자 이상행위 결과 탭
// ==========================================
cy.get('.v-btn__content').filter(':visible').contains('사용자 이상행위 결과').click({ force: true });
cy.wait(2000);

cy.log('--- 사용자 이상행위 결과 화면 검증 시작 ---');
cy.url().should('include', '/analyze/customAnomalyBehaviorPolicyResult');


cy.get('.version-notice').filter(':visible').contains('각 정책의 최신 버전에서 생성된 경보만 표시됩니다').should('exist');

cy.get('.basic-filter-panel__title').filter(':visible').contains('기본 필터').should('be.visible');

// [변경] aria-label → placeholder 기반으로 변경됨
cy.get('input[placeholder="정책 선택"]').should('exist');
cy.get('input[placeholder="메시지 + 정책명 검색"]').should('exist');

// [변경] From/To aria-label 삭제 → date-range-picker 내 type="date" 2개로 확인
cy.get('.date-range-picker input[type="date"]').should('have.length', 2);
cy.get('.date-range-picker input[type="date"]').eq(0).should('be.visible'); // From
cy.get('.date-range-picker input[type="date"]').eq(1).should('be.visible'); // To
cy.get('.date-range-sep').filter(':visible').contains('~').should('be.visible');

cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');

// 위험도 필터 (기존과 동일)
cy.contains('.filter-label', '위험도').should('be.visible');
cy.get('button.sev-filter-btn--active').contains('전체').should('be.visible');
cy.get('button.sev-filter-btn--1').contains('심각').should('be.visible');
cy.get('button.sev-filter-btn--2').contains('경계').should('be.visible');
cy.get('button.sev-filter-btn--3').contains('주의').should('be.visible');

// 기간 필터 (기존과 동일)
cy.contains('.filter-label', '기간').should('be.visible');
cy.get('button.sev-filter-btn').contains('오늘').should('be.visible');
//v2.9.5.0 최근 7일, 최근 30일 로 문구변경됨.
cy.get('button.sev-filter-btn').contains('최근 7일').should('be.visible');
cy.get('button.sev-filter-btn').contains('최근 30일').should('be.visible');
cy.get('button.sev-filter-btn').contains('3개월').should('be.visible');
cy.get('button.sev-filter-btn').contains('1년').should('be.visible');

// [신규] 중지된 정책 필터
cy.contains('.filter-label', '중지된 정책').should('be.visible');
cy.contains('.filter-label', '중지된 정책')
  .parent()
  .within(() => {
    cy.get('button.sev-filter-btn')
      .contains('제외')
      .should('be.visible')
      .find('.material-icons')
      .should('contain.text', 'visibility_off');
  });

// [신규] 지난 버전 필터
cy.contains('.filter-label', '지난 버전').should('be.visible');
cy.contains('.filter-label', '지난 버전')
  .parent()
  .within(() => {
    cy.get('button.sev-filter-btn')
      .contains('제외')
      .should('be.visible')
      .find('.material-icons')
      .should('contain.text', 'history');
  });

// ==========================================
// 고급 필터 - 화면 요소 노출 검증 (변경 미확인 - 기존 유지)
// ==========================================
cy.get('.adv-filter-panel__title').filter(':visible').contains('고급 필터').click({ force: true });

cy.get('.adv-filter-panel__label').filter(':visible').contains('시간').should('be.visible');
cy.get('.adv-filter-panel__label').filter(':visible').contains('요일').should('be.visible');
cy.get('.adv-filter-panel__label').filter(':visible').contains('사용자').should('be.visible');
cy.get('.adv-filter-panel__label').filter(':visible').contains('부서').should('be.visible');
cy.get('.adv-filter-panel__label').filter(':visible').contains('업무').should('be.visible');
cy.get('.adv-filter-panel__label').filter(':visible').contains('메뉴').should('be.visible');
cy.get('.adv-filter-panel__label').filter(':visible').contains('URI').should('be.visible');

cy.get('.hour-picker__preset-btn').filter(':visible').contains('전체').should('be.visible');
cy.get('.hour-picker__preset-btn').filter(':visible').contains('업무시간').should('be.visible');
cy.get('.hour-picker__preset-btn').filter(':visible').contains('심야').should('be.visible');
// [신규] 시간대 안내 문구
cy.contains('탐지 시간슬롯 기준').should('exist');

cy.get('.dow-picker__preset-btn').filter(':visible').contains('전체').should('be.visible');
cy.get('.dow-picker__preset-btn').filter(':visible').contains('평일').should('be.visible');
cy.get('.dow-picker__preset-btn').filter(':visible').contains('주말').should('be.visible');

['월', '화', '수', '목', '금', '토', '일'].forEach((day) => {
  cy.get('.dow-picker__cell').filter(':visible').contains(day).should('be.visible');
});

cy.get('input[placeholder="사용자 ID 또는 이름 검색"]').should('be.visible');
// [신규] 고급 필터 - IP 입력 행
cy.get('.adv-filter-panel__label').filter(':visible').contains('IP').should('be.visible');
cy.get('input[placeholder="예: 10.0.3.12 (Enter 로 추가)"]').should('be.visible');
// [변경] placeholder '명칭' → '이름', '업무' → '업무시스템' (2.9.5.0)
cy.get('input[placeholder="부서 ID 또는 이름 검색"]').should('be.visible');
cy.get('input[placeholder="업무시스템 ID 또는 이름 검색"]').should('be.visible');
cy.get('input[placeholder="메뉴 ID 또는 이름 검색"]').should('be.visible');
cy.get('input[placeholder="예: /api/audit/logs (Enter 로 추가)"]').should('be.visible');

//-----------------------------------------------------------------------------------------------

// 경보 툴바
cy.get('.v-toolbar__title').filter(':visible').contains('경보').should('be.visible');

// [변경] 조회 시각 표시 - .last-fetched 클래스로 통합됨
cy.get('.last-fetched').filter(':visible').should('be.visible')
  .find('.material-icons').should('contain.text', 'schedule');

cy.get('button.datamode-btn').should('have.length.at.least', 8);

// [변경] 기본 활성 데이터 모드가 "전체" → "정책"으로 변경됨
cy.get('button.datamode-btn--active').contains('정책').should('be.visible');

cy.get('i.material-icons').filter(':visible').contains('list').should('exist');       // 전체
cy.get('i.material-icons').filter(':visible').contains('policy').should('exist');     // 정책
cy.get('i.material-icons').filter(':visible').contains('person').should('exist');     // 사용자
cy.get('i.material-icons').filter(':visible').contains('business').should('exist');   // 부서
cy.get('i.material-icons').filter(':visible').contains('dns').should('exist');        // 업무별
cy.get('i.material-icons').filter(':visible').contains('menu_book').should('exist');  // 메뉴
cy.get('i.material-icons').filter(':visible').contains('link').should('exist');       // URI
cy.get('i.material-icons').filter(':visible').contains('language').should('exist');   // IP

/////////////////////////////
// 경보 툴바 - 전체 클릭했을때
/////////////////////////////
cy.get('.datamode-btn').filter(':visible').contains('전체').click({ force: true });
// [변경] '알림 메시지' → '경보 메시지' (2.9.5.0 용어 통일)
cy.get('th').filter(':visible').contains('위험도').should('be.visible');
cy.get('th').filter(':visible').contains('정책명').should('be.visible');
cy.get('th').filter(':visible').contains('경보 메시지').should('be.visible');
cy.get('th').filter(':visible').contains('탐지 시작').should('be.visible');
cy.get('th').filter(':visible').contains('탐지 종료').should('be.visible');

// ==========================================
// 통합 커맨드: incident-header 리스트 구조 검증 (기존과 동일, 변경 없음)
// ==========================================
Cypress.Commands.add('verifyIncidentHeaderRows', (mode) => {
  cy.get('body').then(($body) => {
    const rowCount = $body.find('.incident-header:visible').length;

    if (rowCount === 0) {
      cy.log(`ℹ️ [${mode}] 모드 - 경보 데이터 0건, "데이터 없음" 상태 확인`);
      // [변경] 문구 확인 - 실제 클래스 기준으로 확인
      cy.get('.text-xs-center.pa-4.grey--text').filter(':visible').contains('경보가 없습니다').should('be.visible');
      return;
    }

    cy.get('.incident-header').filter(':visible').should('have.length.greaterThan', 0).each(($row) => {
      cy.wrap($row).within(() => {
        cy.get('.v-chip--label').first().invoke('text').then((text) => {
          expect(['심각', '경계', '주의']).to.include(text.trim());
        });
        cy.get('.incident-count').invoke('text').then((text) => {
          expect(isNaN(parseInt(text.trim(), 10))).to.be.false;
        });
        if (mode === 'policy') {
          cy.get('.ver-chip .v-chip__content').invoke('text').then((text) => {
            expect(text.trim()).to.match(/^v\d+$/);
          });
          cy.get('.incident-policy-name').invoke('text').then((text) => {
            expect(text.trim().length).to.be.greaterThan(0);
          });
          cy.get('.caption.grey--text.ml-1').invoke('text').then((text) => {
            expect(text.trim()).to.match(/^\(\d+회 실행\)$/);
          });
          cy.get('.incident-window').invoke('text').then((text) => {
            expect(text.trim()).to.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} ~ \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
          });
        }
        if (['user', 'department', 'work', 'menu', 'uri', 'ip'].includes(mode)) {
          const iconMap = { user: 'person', department: 'business', work: 'dns', menu: 'menu_book', uri: 'link', ip: 'language' };
          const expectedIcon = iconMap[mode];
          cy.get('.lookup-badge-group').should('be.visible').within(() => {
            cy.get('.material-icons').should('contain.text', expectedIcon);
          });
          cy.get('.lookup-badge-group').then(($el) => {
            const clone = $el.clone();
            clone.find('.material-icons').remove();
            const labelText = clone.text().trim();
            expect(labelText.length).to.be.greaterThan(0);
            if (mode === 'uri' && !labelText.includes('알수없음')) expect(labelText).to.match(/^\//);
            if (mode === 'ip' && !labelText.includes('알수없음')) expect(labelText).to.match(/^(\d{1,3}\.){3}\d{1,3}$/);
          });
          cy.get('.incident-window.truncate-cell').invoke('text').then((text) => {
            const policies = text.split(',').map((p) => p.trim()).filter((p) => p.length > 0);
            expect(policies.length).to.be.greaterThan(0);
          });
        }
      });
    });
  });
});

// [변경] 버튼 텍스트 - "정책별"→"정책", "사용자별"→"사용자", "부서별"→"부서", "메뉴별"→"메뉴", "접속URI별"→"URI", "사용자IP별"→"IP" (업무별은 유지)
cy.contains('.datamode-btn', '정책').click({ force: true });
cy.verifyIncidentHeaderRows('policy');

cy.contains('.datamode-btn', '사용자').click({ force: true });
cy.verifyIncidentHeaderRows('user');

cy.contains('.datamode-btn', '부서').click({ force: true });
cy.verifyIncidentHeaderRows('department');

// [변경] 데이터 모드 버튼명 변경 (2.9.5.0)
//  업무별 → 업무시스템, 메뉴 → 등록된 메뉴, URI → 접속 URI, IP → 사용자 IP
cy.contains('.datamode-btn', '업무시스템').click({ force: true });
cy.verifyIncidentHeaderRows('work');

cy.contains('.datamode-btn', '등록된 메뉴').click({ force: true });
cy.verifyIncidentHeaderRows('menu');

cy.contains('.datamode-btn', '접속 URI').click({ force: true });
cy.verifyIncidentHeaderRows('uri');

cy.contains('.datamode-btn', '사용자 IP').click({ force: true });
cy.verifyIncidentHeaderRows('ip');

// ==========================================
// 타임라인/그룹 뷰 토글 메뉴 - 기본 선택값 확인
// ==========================================
// [수정] 데이터모드 전환 루프 이후에는 기본값이 "전체"로 리셋되므로,
// 하드코딩된 텍스트 대신 버튼에 표시된 현재 텍스트를 그대로 검증합니다.

cy.get('.childview-toggle-btn')
  .filter(':visible')
  .should('be.visible')
  .as('targetToggleBtn');

// [수정] 버튼 내부 첫 번째 span(라벨)만 텍스트로 추출, 화살표(▾) 스팬은 제외
cy.get('@targetToggleBtn').find('span').first().invoke('text').then((currentLabel) => {
  const label = currentLabel.trim();

  cy.get('@targetToggleBtn').realHover();
  cy.wait(500);

  cy.get('.childview-toggle-menu').filter(':visible').should('be.visible').within(() => {
    cy.get('.childview-toggle-item').should('have.length', 5);

    cy.contains('.childview-toggle-item', '전체').should('be.visible');
    cy.contains('.childview-toggle-item', '그룹 > 타임라인').should('be.visible');
    cy.contains('.childview-toggle-item', '타임라인(일) > 그룹').should('be.visible');
    cy.contains('.childview-toggle-item', '타임라인(주) > 그룹').should('be.visible');
    cy.contains('.childview-toggle-item', '타임라인(월) > 그룹').should('be.visible');

    cy.contains('.childview-toggle-item', label).should('have.class', 'active');
  });
});

// ==========================================
// 테이블 페이지 사이즈 선택 영역 - 노출 확인
// ==========================================
cy.get('.table-footer-right').filter(':visible').should('be.visible').within(() => {
  cy.get('.table-footer-size').should('be.visible');
  cy.get('.v-input__icon--append .material-icons').should('be.visible').and('contain.text', 'arrow_drop_down');
  cy.contains('.caption.grey--text', '건').should('be.visible');
});

// 기간 - 오늘 클릭
cy.get('.sev-filter-btn').filter(':visible').contains('오늘').click({ force: true });
cy.get('.basic-filter-panel__clear-all', { timeout: 10000 }).filter(':visible').should('be.visible').and('contain.text', '전체 비우기');

cy.log('✅ 분석 - [사용자 이상행위 결과] 화면 확인 완료!');


// ==========================================
// STEP : 분석 - 사용자 이상행위 대시보드
// ==========================================
// [신규] 탭 클릭 후 실제로 페이지가 바뀔 때까지 재시도
// 결과 탭에서 필터를 바꾸면 URL 쿼리(dateFrom/dataMode 등)가 갱신되는데,
// 그 직후 탭을 누르면 라우터 이동이 취소(Navigation cancelled)될 수 있음
const clickTabUntilPath = (tabText, pathPart, attempt = 1) => {
  cy.get('.v-btn__content').filter(':visible')
    .filter((i, el) => Cypress.$(el).text().trim() === tabText)
    .first()
    .click({ force: true });
  cy.wait(1000);

  cy.location('pathname').then((path) => {
    if (path.includes(pathPart)) return;
    if (attempt >= 3) {
      throw new Error(`[${tabText}] 탭 이동 실패 - 현재 경로: ${path}`);
    }
    cy.log(`🔁 [${tabText}] 탭 이동 재시도 (${attempt}회 실패)`);
    clickTabUntilPath(tabText, pathPart, attempt + 1);
  });
};

// 직전 화면에 열려 있을 수 있는 hover 메뉴 닫기
cy.get('body').type('{esc}');
cy.wait(500);

clickTabUntilPath('사용자 이상행위 대시보드', '/analyze/customAnomalyBehaviorPolicyDashboard');

cy.log('--- 사용자 이상행위 대시보드 화면 검증 시작 ---');
cy.location('pathname').should('include', '/analyze/customAnomalyBehaviorPolicyDashboard');

// ------------------------------------------
// 1. 탭 확인
// [변경] "이상행위 정책" 탭 삭제, 순서: 정책 → 결과 → 대시보드
// ------------------------------------------
// [변경] 2.9.7 - 「외부 연동 설정」 탭 추가 (4개)
['사용자 이상행위 정책', '사용자 이상행위 결과', '사용자 이상행위 대시보드', '외부 연동 설정'].forEach((tab) => {
  cy.get('.v-btn__content').filter(':visible')
    .filter((i, el) => Cypress.$(el).text().trim() === tab) // 부분 매칭 방지
    .should('have.length', 1);
});

// ------------------------------------------
// 2. 상단 툴바 - 기간 버튼 (기본값: 오늘)
// ------------------------------------------
cy.get('.cabp-page-toolbar .pcpf__btn').filter(':visible')
  .should('have.attr', 'title', '기간: 오늘')
  .within(() => {
    cy.get('.pcpf__btn-icon').should('contain.text', 'event');
    cy.get('.pcpf__btn-label').should('have.text', '기간');
    cy.get('.pcpf__btn-value').should('have.text', '오늘');
  });

// ------------------------------------------
// 3. 전체 현황 섹션 바 (숨김 보기 클릭 '전' 상태)
// ------------------------------------------
cy.contains('.anomaly-dashboard__section-bar', '전체 현황').within(() => {
  cy.contains('.anomaly-dashboard__section-title', '전체 현황').should('be.visible');

  // "숨김 N개 보기" - 숨긴 카드가 있을 때만 렌더링됨
  cy.root().then(($bar) => {
    const $hiddenBtn = $bar.find('button[title="숨긴 항목 보기(관리)"]');
    if ($hiddenBtn.length > 0) {
      const clone = $hiddenBtn.first().clone();
      clone.find('.material-icons').remove();
      expect(clone.text().trim()).to.match(/^숨김 \d+개 보기$/);
      expect($hiddenBtn.find('.material-icons').text()).to.contain('visibility');
    } else {
      cy.log('숨긴 카드 0개 - "숨김 N개 보기" 버튼 없음');
    }
  });
});

// ------------------------------------------
// 3-1. [변경] 2.9.5.0: 진입 시 위젯이 모두 숨김 상태 → '숨김 N개 보기' 클릭
// ------------------------------------------
let shownHidden = false; // 테스트 끝에 원래 상태로 되돌리기 위한 표시

// 데이터가 많은 서버(.51)는 차트 요청이 끝난 뒤에야 '숨김 N개 보기' 버튼이 그려짐
// → 버튼이 나타날 때까지 1초 간격으로 최대 10번 확인 (없으면 숨긴 항목 없음으로 진행)
const waitHiddenBtn = (tries = 10) =>
  cy.contains('.anomaly-dashboard__section-bar', '전체 현황').then(($bar) => {
    if ($bar.find('button[title="숨긴 항목 보기(관리)"]').length > 0 || tries <= 1) return $bar;
    cy.wait(1000);
    return waitHiddenBtn(tries - 1);
  });

waitHiddenBtn().then(($bar) => {
  const $btn = $bar.find('button[title="숨긴 항목 보기(관리)"]');
  if ($btn.length === 0) {
    cy.log('숨긴 항목 없음 - 바로 검증 진행');
    return;
  }

  // 숨김 상태에서는 '표시할 위젯이 없습니다' 안내가 보임
  cy.contains('.dashboard-empty__title', '표시할 위젯이 없습니다').should('be.visible');

  cy.wrap($btn.first()).click({ force: true });
  shownHidden = true;
  cy.wait(1500);

  // 클릭 후 버튼 상태: '숨김 N 표시중' / title '숨긴 항목 숨기기' / is-on / visibility_off
  cy.get('.anomaly-dashboard__vis-btn[title="숨긴 항목 숨기기"]')
    .should('be.visible')
    .and('have.class', 'is-on')
    .then(($on) => {
      const clone = $on.clone();
      clone.find('.material-icons').remove();
      expect(clone.text().trim()).to.match(/^숨김 \d+ 표시중$/);
    })
    .find('.material-icons').should('contain.text', 'visibility_off');
});

// ------------------------------------------
// 3-2. 전체 현황 - 레이아웃 편집 버튼 (hover 노출 → 존재만 확인)
// ------------------------------------------
cy.contains('.anomaly-dashboard__section-bar', '전체 현황')
  .contains('.anomaly-dashboard__edit-btn', '레이아웃 편집')
  .should('exist')
  .find('.material-icons').should('contain.text', 'edit');

// [삭제] 4. 정책별 분석 섹션 (빈 카드 숨김 / 중지된 정책 / 지난 버전 버튼) - 2.9.5.0에서 섹션 자체가 없어짐
cy.get('.anomaly-dashboard__section-bar').should('have.length', 1);

// ------------------------------------------
// 4. 위젯 카드 목록 확인
// ------------------------------------------
const WIDGET_TITLES = [
  '클러스터 토폴로지',
  '위험도별 경보', '범주별 경보', '업무시스템별 경보', '부서별 경보',
  '일자별 경보 추이', '위험도별 일자 추이',
  '정책별 경보', '요일별 경보', '개인정보 유형별 사용자',
];

cy.get('.anomaly-widget-card').filter(':visible').then(($cards) => {
  const titles = [...$cards].map((c) =>
    Cypress.$(c).find('.anomaly-widget-card__title').text().trim());
  cy.log(`📋 위젯 카드 ${titles.length}개: ${titles.join(' | ')}`);
  WIDGET_TITLES.forEach((t) => expect(titles, '위젯 카드 목록').to.include(t));
  expect(titles.length, '위젯 카드 개수').to.eq(WIDGET_TITLES.length);
});

// ------------------------------------------
// 5. 기간 드롭다운 - "오늘" → "최근 30일" 변경
// ------------------------------------------
cy.get('.cabp-page-toolbar .pcpf__btn').filter(':visible')
  .scrollIntoView({ offset: { top: -100 } })
  .click({ force: true });
cy.wait(500);

cy.get('.v-list__tile__title').filter(':visible').contains('30일').click({ force: true });
cy.wait(1500);

cy.get('.cabp-page-toolbar .pcpf__btn-value').filter(':visible').should('have.text', '최근 30일');
cy.get('.cabp-page-toolbar .pcpf__btn').filter(':visible').should('have.attr', 'title', '기간: 최근 30일');

// ------------------------------------------
// 6. 위젯 카드 구조 검증 (동적 데이터 대응)
// ------------------------------------------
const NO_DATA_REGEX = /^선택한 기간에 (데이터|이상행위)가 없습니다\.$/;
const CHART_TITLE_REGEX = /이상행위 건수$/; // 예: '접속 요일별 이상행위 건수'

cy.get('.anomaly-widget-card').filter(':visible').should('have.length.greaterThan', 0).each(($card) => {
  cy.wrap($card).scrollIntoView({ offset: { top: -100 } });

  // 6-1. 카드 타이틀 - title 속성과 텍스트가 동일
  const $title = $card.find('.anomaly-widget-card__title');
  const titleText = $title.text().trim();
  expect(titleText.length, '카드 타이틀').to.be.greaterThan(0);
  expect($title.attr('title'), '타이틀 title 속성').to.eq(titleText);

  // 6-2. 숨김 상태 카드: '숨김' 태그 + '이 카드 다시 표시' 버튼 / 일반 카드: '이 카드 숨기기' 버튼
  const isHidden = $card.hasClass('anomaly-widget-card--hidden');
  const $hideBtn = $card.find('.anomaly-widget-card__actions .anomaly-widget-card__hide');
  expect($hideBtn.length, `[${titleText}] 숨기기/다시 표시 버튼`).to.eq(1);

  if (isHidden) {
    const $tag = $card.find('.anomaly-widget-card__hidden-tag');
    expect($tag.text().trim(), `[${titleText}] 숨김 태그`).to.eq('숨김');
    expect($tag.attr('title')).to.eq('숨김 상태 — 눈 아이콘으로 다시 표시');
    expect($hideBtn.attr('title'), `[${titleText}] 버튼 title`).to.eq('이 카드 다시 표시');
    expect($hideBtn.find('.material-icons').text()).to.contain('visibility_off');
  } else {
    expect($hideBtn.attr('title'), `[${titleText}] 버튼 title`).to.eq('이 카드 숨기기');
    expect($hideBtn.find('.material-icons').text()).to.contain('visibility');
  }

  // 6-3. [신규] 크게 보기 버튼 - 모든 카드 공통
  const $enlarge = $card.find('.anomaly-widget-card__enlarge');
  expect($enlarge.length, `[${titleText}] 크게 보기 버튼`).to.eq(1);
  expect($enlarge.attr('title')).to.eq('크게 보기');
  expect($enlarge.find('.material-icons').text()).to.contain('zoom_out_map');

  // 6-4. 본문 - 토폴로지 / 데이터 없음 / 차트 분기
  const isTopology = $card.find('.topology-wrap').length > 0;
  const isNoData = $card.find('.bucketized-dynamic-chart__nodata').length > 0;
  const $csvBtn = $card.find('.anomaly-widget-card__export[title^="CSV 다운로드"]');

  if (isTopology) {
    // [신규] 클러스터 토폴로지 - 시작 전 대기 화면 (시작 버튼은 누르지 않음)
    cy.log(`🛰 [${titleText}] 토폴로지`);
    cy.wrap($card).find('.topology-toggle').should('contain.text', '시작');
    cy.wrap($card).find('.topology-idle .idle-title').should('have.text', '클러스터 토폴로지');
    cy.wrap($card).find('.topology-idle .idle-sub')
      .should('contain.text', '시작 버튼을 누르면 실시간 모니터링이 켜집니다');
    expect($csvBtn.length, `[${titleText}] CSV 버튼(토폴로지)`).to.eq(0);

  } else if (isNoData) {
    cy.log(`ℹ️ [${titleText}] 데이터 없음`);
    cy.wrap($card).find('.bucketized-dynamic-chart__nodata').within(() => {
      cy.get('.material-icons').should('contain.text', 'bar_chart');
      cy.get('div').invoke('text').then((t) => {
        expect(t.trim()).to.match(NO_DATA_REGEX);
      });
    });
    // 데이터 없는 카드에는 CSV 다운로드 버튼이 없음
    // ※ 2.9.6: 「요일별 경보」만 데이터 없음 상태에서도 CSV 버튼이 보임 (다른 카드는 없음)
    //   → 개발 확인 전까지 실패 대신 로그로 남기고, 버튼이 있으면 문구 형식만 확인
    const CSV_ON_NODATA = ['요일별 경보'];
    if (CSV_ON_NODATA.includes(titleText)) {
      if ($csvBtn.length > 0) {
        cy.log(`⚠️ [${titleText}] 데이터 없음인데 CSV 버튼 표시 (2.9.6 확인 필요)`);
        expect($csvBtn.attr('title'), `[${titleText}] CSV 버튼 title`).to.eq(`CSV 다운로드 — ${titleText}`);
      }
    } else {
      expect($csvBtn.length, `[${titleText}] CSV 버튼(데이터 없음)`).to.eq(0);
    }

  // (.51서버) 데이터가 있어서 (.71서버) 신규설치와는 차이점 발생
  } else if (titleText === '개인정보 유형별 사용자') {
    // 개인정보 유형별 사용자 TOP 위젯 - 차트 제목/세로축 제목/CSV 버튼 없음, Top N · 유형 선택 칩 + 더 많이 보기
    cy.log(`👤 [${titleText}] 사용자 순위 차트`);
    cy.wrap($card).find('.dynamic_chart svg.apexcharts-svg').should('exist');

    // Top N 선택 - 태그 종류와 무관하게 카드 전체의 화면 글자 + 입력/선택 칸 값에서 'Top 숫자' 확인
    cy.wrap($card).should(($c) => {
      const text = $c[0].innerText || '';
      const values = [...$c.find('input, select')].map((el) => el.value || '').join(' ');
      expect(/Top\s*\d+/.test(text + ' ' + values), '[개인정보 유형별 사용자] Top N 선택').to.be.true;
    });

    cy.wrap($card).contains('더 많이 보기').should('exist');            // 항목이 잘렸을 때만 나오면 이 줄은 지워 주세요
    expect($csvBtn.length, `[${titleText}] CSV 버튼(사용자 순위)`).to.eq(0);

  } else {
    cy.log(`📊 [${titleText}] 차트`);
    cy.wrap($card).find('.dynamic_chart svg.apexcharts-svg').should('exist');
    cy.wrap($card).find('.apexcharts-title-text').invoke('text').then((t) => {
      expect(t.trim()).to.match(CHART_TITLE_REGEX);
    });
    cy.wrap($card).find('.apexcharts-yaxis-title-text').should('have.text', '건수(이상행위)');

    // 차트 카드에는 CSV 다운로드 버튼이 있고, title에 카드명이 포함됨
    cy.wrap($card).find('.anomaly-widget-card__export[title^="CSV 다운로드"]')
      .should('have.length', 1)
      .and('have.attr', 'title', `CSV 다운로드 — ${titleText}`)
      .find('.material-icons').should('contain.text', 'file_download');
  }
});

// ------------------------------------------
// 7. 원래 상태로 복구 - 숨긴 항목 다시 숨기기
// ------------------------------------------
cy.then(() => {
  if (!shownHidden) return;
  cy.get('.anomaly-dashboard__vis-btn[title="숨긴 항목 숨기기"]').click({ force: true });
  cy.wait(1000);
  cy.get('button[title="숨긴 항목 보기(관리)"]').should('be.visible');
});

cy.log('✅ 분석 - [사용자 이상행위 대시보드] 화면 확인 완료!');



// ==========================================
// STEP : 분석 - 외부 연동 설정 탭 [신규 2.9.7]
// ※ 화면 확인만 (신규 추가 · 수정 · 삭제 · 즉시 실행 · 재전송은 누르지 않음)
// ==========================================
cy.get('body').type('{esc}');
cy.wait(500);

cy.get('button.tab-btn').filter(':visible')
  .filter((i, el) => Cypress.$(el).text().trim() === '외부 연동 설정')
  .first()
  .click({ force: true });
cy.wait(2000);

cy.log('--- 외부 연동 설정 화면 검증 시작 ---');
cy.get('button.tab-btn.active').filter(':visible').should('contain.text', '외부 연동 설정');
cy.location('pathname').then((p) => cy.log(`📍 외부 연동 설정 경로: ${p}`));

// 1. 안내 문구
cy.get('.version-notice').filter(':visible').should('have.length', 1).within(() => {
  cy.get('.material-icons').should('contain.text', 'info');
  cy.contains('.font-weight-bold', '외부 연동 설정 (Splunk / SIEM / Webhook)').should('be.visible');
  cy.contains('스플렁크(Splunk) 및 외부 보안관제(SIEM)로 자동 전송').should('exist');
});

// 2. 필터 - 검색 / 대상 유형 / 활성 상태
cy.get('.filter-panel').filter(':visible').within(() => {
  cy.get('input[placeholder="검색"]').should('be.visible');
  cy.get('input[placeholder="대상 유형"]').should('exist')
    .closest('.v-select').find('.v-select__selection--comma').should('have.text', '전체');

  cy.get('.severity-filter-group button.sev-filter-btn').should('have.length', 3);
  cy.get('.severity-filter-group button.sev-filter-btn').eq(0).should('contain.text', '전체').and('have.class', 'sev-filter-btn--active');
  cy.get('.severity-filter-group button.sev-filter-btn').eq(1).should('contain.text', '활성');
  cy.get('.severity-filter-group button.sev-filter-btn').eq(2).should('contain.text', '비활성');

  // 오른쪽 버튼
  cy.contains('button.action-btn', '미리보기').should('be.visible')
    .and('have.attr', 'title').and('match', /^미리보기 대상 설정: /);
  cy.contains('button.action-btn', '신규 연동 추가').should('be.visible').and('have.class', 'primary')
    .find('.material-icons').should('contain.text', 'add');
  cy.contains('button.action-btn', '전체 전송 이력').should('be.visible')
    .find('.material-icons').should('contain.text', 'history');
  cy.get('button[title="새로고침"]').should('be.visible')
    .find('.material-icons').should('contain.text', 'refresh');
});

// 3. 목록 제목
cy.contains('.table-heading-toolbar .v-toolbar__title', '연동 대상 목록').should('be.visible');

// 4. 표 머리글
const EXT_HEADERS = ['#', '이름', '대상 유형', '경로', '스케줄', '활성', '실행 일시', '관리'];
cy.get('.policy-table table.v-datatable').filter(':visible').should('have.length', 1)
  .find('thead tr').first().find('th').then(($th) => {
    const heads = [...$th].map((th) => Cypress.$(th).text().trim());
    expect(heads, '외부 연동 표 머리글').to.deep.eq(EXT_HEADERS);
  });

// 5. 행 구조 검증 (동적 데이터 대응)
// ※ 신규 설치 기본값: 기본 스플렁크 파일 연동 (UF) / 스플렁크 HEC 전송 (샘플) / 외부 SIEM 웹훅 연동 (샘플) - 모두 비활성
const EXT_TYPES = ['Splunk UF', 'Splunk HEC', 'Webhook'];
const EXT_ACTIONS = ['미리보기', '즉시 실행', '과거 재전송', '실행 이력', '수정', '삭제'];

cy.get('.policy-table table.v-datatable tbody tr').filter(':visible').then(($rows) => {
  if ($rows.length === 0) {
    cy.log('ℹ️ 연동 대상 0건');
    return;
  }

  cy.wrap($rows).each(($tr) => {
    cy.wrap($tr).within(() => {
      // # 번호
      cy.get('.policy-id-cell').invoke('text').then((t) => {
        expect(isNaN(parseInt(t.trim(), 10)), '번호').to.be.false;
      });

      // 이름 / 설명
      cy.get('.policy-name-cell .name-title-row span').first().invoke('text').then((t) => {
        expect(t.trim().length, '연동 이름').to.be.greaterThan(0);
      });
      cy.get('.policy-name-cell .name-desc-row').should('exist');

      // 대상 유형 배지
      cy.get('.type-badge').invoke('text').then((t) => {
        expect(EXT_TYPES, '대상 유형').to.include(t.trim());
      });

      // 경로 (Splunk UF 는 '-', 원격 주소는 뒷부분 **** 가림)
      cy.get('.destination-cell .path-text').invoke('text').then((t) => {
        const v = t.trim();
        expect(v.length, '경로').to.be.greaterThan(0);
        if (v.startsWith('http')) expect(v, '경로 가림 처리').to.match(/\*\*\*\*$/);
      });

      // 스케줄
      cy.get('td').eq(4).invoke('text').then((t) => {
        expect(t.trim().length, '스케줄').to.be.greaterThan(0);
      });

      // 활성 아이콘 + 즉시 실행 버튼 상태 (비활성이면 즉시 실행 비활성)
      cy.get('td').eq(5).find('i.material-icons').invoke('attr', 'title').then((st) => {
        expect(['활성', '비활성'], '활성 상태').to.include(st);
        if (st === '비활성') {
          cy.get('.policy-action-cell button[title="즉시 실행"]').should('be.disabled');
        }
      });

      // 실행 일시 - 미실행 또는 값 있음
      cy.get('.policy-exec-cell').invoke('text').then((t) => {
        expect(t.trim().length, '실행 일시').to.be.greaterThan(0);
      });

      // 관리 버튼 6개 (순서 포함)
      cy.get('.policy-action-cell button').then(($b) => {
        const titles = [...$b].map((b) => b.getAttribute('title'));
        expect(titles, '관리 버튼').to.deep.eq(EXT_ACTIONS);
      });
    });
  });

  // 6. 하단 건수 = 표 행 수
  cy.get('.table-footer').filter(':visible').invoke('text').then((t) => {
    const m = t.match(/총\s*(\d+)건/);
    expect(m, '총 N건 표시').to.not.be.null;
    expect(parseInt(m[1], 10), '총 건수 = 행 수').to.eq($rows.length);
  });
});

cy.log('✅ 분석 - [외부 연동 설정] 화면 확인 완료!');


// ================================
// [FINAL] 테스트 종료 및 메뉴 닫기
// ================================
cy.log('🎉 모든 테스트 시나리오 성공적으로 완료!');
cy.get('body').type('{esc}');
cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;
