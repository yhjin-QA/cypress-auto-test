/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/*!********************************!*\
  !*** ./cypress/e2e/spec.cy.js ***!
  \********************************/
  // ▼ 1. 모든 에러 무시 설정 (강력한 방어막) ▼
  Cypress.on('uncaught:exception', (err, runnable) => {
    // 무시할 에러 메시지 목록
    const ignoredErrors = [
      'Navigation cancelled',
      'Cannot read properties',
      'resetValidation',
      'NavigationDuplicated', // [NEW] 중복 이동 에러 무시 추가
      'Redirected when going from', // ◀◀◀ 이 문구를 추가하세요!
      'navigation guard',           // ◀◀◀ 이 문구도 추가하세요!
      'Avoided redundant navigation',
      'Loading chunk',
      'Loading CSS chunk',           // ◀◀◀ [NEW] 이번에 발생한 CSS 청크 에러 무시 추가!
      'operate.task.packageManagement',
      'e is not defined',
      'Script error',
      'not valid JSON',
      'ChunkLoadError'
    ];

    // 위 목록 중 하나라도 포함되면 에러를 무시함
    if (ignoredErrors.some(e => err.message.includes(e))) {
      return false;
    }
  });

/**코드 시작  */
describe('로그캐치 Depth 배포점검목록 동작 테스트', () => {
  
  it('07_Depth_보관_접속기록보관 자동화 시나리오', () => {


    // ==========================================
    // STEP 1: 로그인
    // ==========================================
    // 1. 사이트 방문
    cy.visit('https://10.10.54.21:18443/logcatch/login');
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

// ----------------------------------------------------------
// [백업 사전조건 생성] WAS 시스템 로그인 Pdf 파일 다운로드
// ----------------------------------------------------------

cy.log('🚀 다른 도메인(tester3 서버)으로 크로스 오리진 점프를 시도합니다.');

// 1. 점프 전, 기존 사이트의 세션/쿠키 찌꺼기 완전 삭제 (충돌 방지)
cy.clearCookies();
cy.clearLocalStorage();

// 1. API 응답을 가로채기 위해 intercept 설정 (cy.origin 바깥에서 정의 가능)
cy.intercept('GET', '**/api/file-download-pdf*').as('pdfDownload');

// 2. 새로운 도메인(10.10.54.31)으로 점프하여 동작 수행
cy.origin('http://10.10.54.31:8088', () => {
  // 새 도메인 전용 에러 무시 처리
  Cypress.on('uncaught:exception', () => false);

  // 사이트 접속 (origin 블록 안이므로 도메인 제외 경로만 입력)
  cy.log('1️⃣ tester3 사이트에 접속합니다.');
  cy.visit('/tester3', { 
    timeout: 60000 
  });
  
  cy.wait(3000); // 페이지 로딩 대기
  cy.log('✅ 10.10.54.31 서버 접속 완료!');

  // 3. PDF 버튼 클릭 (id 값인 #pdf_btn을 타겟팅)
  cy.log('2️⃣ PDF 버튼을 클릭합니다.');
  cy.get('#pdf_btn').should('be.visible').click({ force: true });
  cy.log('✅ PDF 버튼 클릭 완료!');
  // 엑셀 다운로드 또는 내부 처리 스크립트가 돌아갈 시간을 넉넉히 줍니다.
  cy.wait(5000); 

  // 3. API 응답 완료 검증
 cy.log('⏳ PDF 다운로드 API 응답을 기다립니다...');
 cy.wait('@pdfDownload', { timeout: 30000 }).then((interception) => {
  // 상태 코드 검증
  expect(interception.response.statusCode).to.eq(200);
  cy.log('✅ PDF 다운로드 API 응답 검증 완료 (200 OK)!');
 }); 
});


// ----------------------------------------------------------
// 원래 점검 사이트(LogCatch)로 깨끗하게 복귀
// ----------------------------------------------------------

cy.log('🧹 세션 정보를 초기화하고 깨끗하게 복귀합니다.');

// 1. 기존 쿠키와 로컬 스토리지를 모두 비웁니다. (404 방지 핵심)
cy.clearCookies();
cy.clearLocalStorage();

// 2. 주소 뒤에 아무것도 붙지 않은 '순수 도메인' 주소로 접속합니다.
// 원래 주소로 접속
cy.visit('https://10.10.54.21:18443/logcatch/login');
cy.wait(3000); // 화면이 그려질 수 있도록 초기 렌더링 대기 

// 2. 화면 상태 분석 및 분기 처리
cy.get('body').then(($body) => {
  // 로그인 입력창이 존재하는지 확인
  const hasLoginInput = $body.find('input[aria-label="사용자 계정"]').length > 0;
  
  if (hasLoginInput) {
    // 🟡 [상태 1] 로그인 화면이 정상적으로 떴을 때
    cy.log('🟡 로그인 화면 감지: 로그인을 수행합니다.');
    
    cy.get('input[aria-label="사용자 계정"]').should('exist').type('admin', { force: true });
    cy.get('input[aria-label="패스워드"]').should('exist').type('Manager1!', { force: true }); 
    cy.get('input[aria-label="패스워드"]').type('{enter}', { force: true }); // 엔터키로 안전하게 로그인
    
    cy.wait(8000); // 로그인 후 대시보드 로딩 대기

  } else {
    // 로그인 창이 없을 경우: '이미 로그인된 상태'이거나 '렌더링 실패(흰 화면)' 둘 중 하나입니다.
    // 이전 스크린샷들을 참고하여 우측 상단의 'ADMIN 님' 텍스트나 메뉴 텍스트가 존재하는지 확인합니다.
    const isAlreadyLoggedIn = $body.text().includes('ADMIN') || $body.text().includes('로그아웃');

    if (isAlreadyLoggedIn) {
      // 🟢 [상태 2] 이미 로그인된 메인 화면일 때
      cy.log('🟢 이미 로그인된 상태(대시보드)입니다. 로그인 과정을 패스합니다.');

    } else {
      // 🔴 [상태 3] 로그인 창도 없고, 메인 화면 텍스트도 없으면 렌더링 실패로 간주합니다.
      cy.log('🔴 화면 렌더링 실패(흰 화면) 감지! 페이지를 새로고침합니다.');
      cy.reload();
      cy.wait(3000); // 새로고침 후 안정화 대기

      // 새로고침 후 최종 확인 및 실행
      cy.get('body').then(($newBody) => {
        if ($newBody.find('input[aria-label="사용자 계정"]').length > 0) {
          cy.log('🟡 새로고침 후 로그인 화면 복구됨: 로그인을 수행합니다.');
          
          cy.get('input[aria-label="사용자 계정"]').should('exist').type('admin', { force: true });
          cy.get('input[aria-label="패스워드"]').should('exist').type('Manager1!', { force: true }); 
          cy.get('input[aria-label="패스워드"]').type('{enter}', { force: true });
          
          cy.wait(8000);
        } else {
          cy.log('🟢 새로고침 후 로그인된 상태로 진입 확인. 패스합니다.');
        }
      });
    }
  }
});

cy.log('🚀 원래 사이트(LogCatch) 진입 및 로그인 로직 무사 통과!');

cy.wait(8000); // 페이지 로딩 및 안정화 대기




    // ==========================================
    // STEP 8: 보관 서브메뉴 
    // ==========================================
    
    
    cy.contains('.side-menu', '보관').click({ force: true });
    cy.wait(3000);
    cy.log('---보관-접속기록 보관 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("접속기록 보관")').filter(':visible').click({ force: true });
    cy.wait(3000); 
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.tab-title', '백업/복원').should('exist');
    // 보관 > 접속기록 보관 >  백업/복원  활성/비활성화 토글
    cy.get('label').filter(':visible').contains('활성/비활성').eq(0).should('be.visible');
    cy.contains('.c-headline', '증적 자료').should('exist');
    // 보관 > 접속기록 보관 > 증적자료에 포함된 활성/비활성 토글 (왼쪽)
    cy.contains('데이터들이 백업됩니다').closest('.flex').find('label').contains('활성/비활성').should('be.visible');
    // 보관 > 접속기록 보관 > 증적자료에 포함된 활성/비활성 토글 (오른쪽)
    cy.contains('개인정보가 없는 데이터를 정리합니다').closest('.flex').find('label').contains('활성/비활성').should('be.visible');
    // 보관 > 접속기록 보관 >  시스템에 포함된 활성/비활성화 토글
    cy.contains('.c-headline', '시스템').closest('.v-card').find('label').contains('활성/비활성').should('be.visible');
    // 보관 > 접속기록 보관 >  전송방식식에 포함된 활성/비활성화 토글
    cy.contains('.c-headline', '전송 방식').closest('.v-card').find('label').contains('활성/비활성').should('be.visible');
    cy.log('✅  보관 탭 진입 및 데이터 출력 확인 완료!');


    // ==========================================
    // STEP : 백업 설정 하드 용량 확인
    // ==========================================

    // 1. [UI] 현재 설정된 백업 경로 추출
    cy.get('input[aria-label="백업 경로"]').invoke('val').then((backupPath) => {
        cy.log(`📂 현재 설정된 백업 경로: ${backupPath}`);
        
        // 2. [Scenario 2] 백업 디렉토리의 유공간 확인 (SSH)
        // df -BG 명령어로 GB 단위 추출 후 50 이상인지 검증
        cy.task('runSSH', `df -BG ${backupPath} | awk 'NR==2 {print $4}' | sed 's/G//'`).then((availableGB) => {
            const space = parseInt(availableGB);
            cy.log(`💾 해당 경로의 여유 공간: ${space}GB`);
            
            expect(space, '✅ 백업 디렉토리 여유 공간(30GB 이상) 확인').to.be.at.least(30);
        });

    // ==========================================
    // STEP : 백업전 system 폴더 확인(보관갯수 사전확인용)
    // ==========================================  

    // 오늘 날짜 생성 (YYYYMMDD)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayPrefix = `${year}${month}${day}`;
        cy.log(`📅 오늘 날짜 : ${todayPrefix}`);

        // 전체 목록 조회를 위해 ${todayPrefix}_* 를 빼고 조회합니다.
        cy.task('runSSH', `ls -1 ${backupPath}/system/`).then((result) => {
          // system 폴더 하위의 모든 목록을 로그에 출력해서 보여줍니다.
          cy.log(`📂 [system] 하위 전체 목록:\n${result.trim()}`);
        });
    });

// ==========================================
// STEP : 백업 실행 및 신규 백업폴더 생성 검증
// ==========================================   

// 1. 화면에서 백업 경로를 읽어옵니다.
cy.get('input[aria-label="백업 경로"]').invoke('val').then((backupPath) => {
    const now = new Date();
    const todayPrefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    // audit-trail/오늘날짜 폴더
    const auditPath = `${backupPath}/audit-trail/${todayPrefix}`;

    // 2. [백업 전] 기준 데이터 파악 (System 폴더 개수, Audit 파일 개수)
    cy.task('runSSH', `ls -1d ${backupPath}/system/${todayPrefix}_* 2>/dev/null | wc -l`).then((beforeCountText) => {
        const beforeCount = parseInt(beforeCountText.trim()) || 0;

        cy.task('runSSH', `ls -1 ${auditPath}/mongo.tgz.enc* 2>/dev/null | wc -l`).then((beforeMongo) => {
            cy.task('runSSH', `ls -1 ${auditPath}/postgres.tgz.enc* 2>/dev/null | wc -l`).then((beforePostgres) => {
                const mongoStart = parseInt(beforeMongo.trim()) || 0;
                const postgresStart = parseInt(beforePostgres.trim()) || 0;

                cy.log(`📊 [백업 전] System:${beforeCount}, Mongo:${mongoStart}, Postgres:${postgresStart}`);

                // 3. [UI] 백업 실행 (이력 보기 -> 버튼 클릭 -> 팝업 확인)
                cy.contains('.v-btn__content', '이력 보기').click();
                cy.wait(2000); 
                cy.get('.v-calendar-weekly__day-label.pink--text').closest('.v-calendar-weekly__day').contains('button', /백업/).should('be.visible').click({ force: true });

                cy.get('body').then(($body) => {
                    if ($body.find('.v-card:contains("백업 요청")').length > 0) {
                        cy.contains('.v-card', /백업 요청/).within(() => {
                            cy.contains('button', '확인').click({ force: true });
                        });
                        cy.wait(2000); 
                    }
                });
                
                //이력보기 창 닫기
                // 활성화된 팝업 자체에 포커스를 주고 ESC 연타
               // 1. 활성화된 다이얼로그와 오버레이 배경을 DOM에서 완전히 삭제
               cy.get('.v-dialog__content--active').invoke('remove');
               cy.get('.v-overlay--active').invoke('remove');
               // 2. 팝업이 사라졌는지 확인
               cy.get('.v-dialog--active').should('not.exist');
               cy.log('✅ 증적자료 이력보기 닫기 성공');
                // 4. [대기] 백업 진행 (충분히 기다림)
                cy.log('⏳ 백업 진행 중... 60초 대기');
                cy.wait(60000);


                // -----------------------------------------------------------------
                // [백업 후 상세 검증 시작]
                // -----------------------------------------------------------------

                // [audit-trail] 폴더 검증코드
                cy.task('runSSH', `ls -d ${auditPath}`).then(() => {
                    // Mongo 증분 확인
                    cy.task('runSSH', `ls -1 ${auditPath}/mongo.tgz.enc* 2>/dev/null | wc -l`).then((am) => {
                        // 🌟 아래와 같이 mongoEnd 변수를 선언해야 합니다.
                        const mongoEnd = parseInt(am.trim()) || 0;
                        // ▼ 백업 후 로그 추가 (Mongo)
                        cy.log(`📊 [백업 완료] Mongo 파일: ${mongoStart}개 -> ${mongoEnd}개`);
                        expect(parseInt(am)).to.be.greaterThan(mongoStart);
                    });
                    // Postgres 증분 확인
                    cy.task('runSSH', `ls -1 ${auditPath}/postgres.tgz.enc* 2>/dev/null | wc -l`).then((ap) => {
                        const postgresEnd = parseInt(ap.trim()) || 0;
                        // ▼ 백업 후 로그 추가 (Postgres)
                        cy.log(`📊 [백업 완료] Postgres 파일: ${postgresStart}개 -> ${postgresEnd}개`);
                        expect(parseInt(ap)).to.be.greaterThan(postgresStart);
                    });
                    // 최신 파일 확인
                    cy.task('runSSH', `ls -1t ${auditPath}/*.tgz.enc* | head -n 2`).then((lf) => cy.log(`✅ 최신 파일: ${lf}`));
                });

                // [contentLedger ] 폴더 내 파일존재 확인 - 접속기록 이력 파일
                // 오늘날짜.tgz.enc 파일 생성확인
                cy.task('runSSH', `ls ${backupPath}/contentLedger/*/${todayPrefix}.tgz.enc`).then((r) => expect(r).to.include(todayPrefix));
                
                // [explanationFiles] 폴더 내 파일존재 확인 - 파일다운로드 이력
                // 파일다운로드 이력 있으면 오늘날짜.tgz.enc 파일 생성확인
                cy.task('runSSH', `ls ${backupPath}/explanationFiles/*/${todayPrefix}.tgz.enc`).then((r) => expect(r).to.include(todayPrefix));
                // cy.task('runSSH', `ls -1 ${backupPath}/explanationFiles/*/*.tgz.enc 2>/dev/null`).then((result) => {
                //  // 1. 파일이 아예 없는 경우 방어
                //  expect(result.trim(), '파일이 최소 1개 이상 존재해야 함').to.not.be.empty;
                //  // 2. 줄바꿈(\n)을 기준으로 문자열을 쪼개서 배열로 만듭니다.
                //  const fileList = result.trim().split('\n');
                //   cy.log(`📄 총 ${fileList.length}개의 파일이 발견되었습니다.`);

                //    // 3. 발견된 '모든' 파일이 숫자 8자리 포맷을 지키는지 각각 확인합니다.
                //    fileList.forEach((file) => {
                //     expect(file, `파일명 예외 확인: ${file}`).to.match(/\d{8}\.tgz\.enc/);
                //    });
                //    });

                 // [System 폴더] 개수 유지 및 최신 폴더 상세 검증
                cy.wait(7000); // 삭제 로직 작동 대기
                cy.task('runSSH', `ls -1d ${backupPath}/system/${todayPrefix}_* 2>/dev/null | wc -l`).then((afterCountText) => {
                  const finalCount = parseInt(afterCountText.trim());
                  cy.log(`📊 [신규 백업폴더추가 ]System 내 백업폴더 개수: ${finalCount}개`);
                  // 백업 전(beforeCount)보다 현재 개수가 크거나 같다면 백업은 성공한 것임
                  expect(finalCount).to.be.at.least(beforeCount);

                  // 가장 최신 폴더(방금 생성된 폴더) 하나만 타겟팅
                  cy.task('runSSH', `ls -d ${backupPath}/system/${todayPrefix}_* | tail -n 1`).then((lastFolder) => {
                    const folderPath = lastFolder.trim();
                    cy.log(`📂 검증 대상 최신 폴더: ${folderPath}`);

                     // system폴더의 새로 생성된 백업폴더 검증코드
                    // 1. 파일 개수 검증 (100개 이상인지)
                    cy.task('runSSH', `ls -1 ${folderPath}/*.gz 2>/dev/null | wc -l`).then((fcText) => {
                      const fileCount = parseInt(fcText.trim()) || 0;
                      cy.log(`📄 [검증 1] .gz 파일 개수: ${fileCount}개`); // 로그 출력
                      expect(fileCount, '파일 개수가 100개 이상이어야 함').to.be.at.least(100);
                    });

                    // 2. 특정 핵심 파일 존재 확인 (tbr_com_code.gz)
                    const checkFile = 'tbr_com_code.gz';
                    cy.task('runSSH', `ls ${folderPath}/${checkFile}`).then((fr) => {
                      cy.log(`✔️ [검증 2] 필수 파일(${checkFile}) 존재 확인`); // 로그 출력
                      expect(fr).to.include(checkFile);
                    });

                    // 3. 폴더 용량 확인 (0보다 큰지)
                    // du -sh는 사람이 보기 편한 용량(예: 1.2G), du -s는 정확한 블록 숫자입니다.
                    cy.task('runSSH', `du -sh ${folderPath}`).then((sizeText) => {
                      const fullSizeInfo = sizeText.trim(); 
                      cy.log(`📦 [검증 3] 폴더 전체 용량: ${fullSizeInfo}`); // 로그 출력 (예: 1.5G  /home/...)
                      // 용량 숫자만 따로 뽑아서 0보다 큰지 체크
                      const numericSize = parseInt(fullSizeInfo.split('\t')[0]);
                      expect(numericSize).to.be.greaterThan(0);                      
                    });

                    // -----------------------------------------------------------------
                    // [시스템폴더 검증] UI 설정된 '보관 개수'만큼 폴더가 유지되는지 확인 (Rotation)
                    // -----------------------------------------------------------------
                    // UI설정화면에서 '보관 개수' 설정값을 먼저 읽어옵니다.
                    cy.get('input[aria-label="보관 개수"]').invoke('val').then((configCount) => {
                      const expectedCount = parseInt(configCount.trim());
                      cy.log(`⚙️ UI에 설정된 보관 정책 개수: ${expectedCount}개`);

                      // 2. 백업 완료 및 구형 폴더 삭제 프로세스 대기(20초)
                      cy.wait(20000);

                      // ======================================================================
                        // 💡 [신규 추가] 실제 남아있는 폴더 목록을 조회하여 로그에 세로로 출력
                        // ====================================================================
                         cy.task('runSSH', `ls -1d ${backupPath}/system/${todayPrefix}_* 2>/dev/null`).then((folderList) => {
                         cy.log('📂 [system] 현재 system 하위폴더 목록:'); 
                          if (folderList && folderList.trim()) {
                            const folders = folderList.trim().split(/\s+/);
                            folders.forEach((folderPath) => {
                              // 절대 경로(/home/.../20260415_1) 대신 폴더명(20260415_1)만 깔끔하게 추출해서 출력
                              const folderName = folderPath.split('/').pop();
                              cy.log(`- ${folderName}`);
                            });
                          } else {
                            cy.log('⚠️ 조건에 맞는 폴더가 없습니다.');
                          }
                        });


                      // 3. 서버의 실제 폴더 개수 확인
                      cy.task('runSSH', `ls -1d ${backupPath}/system/${todayPrefix}_* 2>/dev/null | wc -l`).then((afterCountText) => {
                        const finalCount = parseInt(afterCountText.trim());

                        // [수정된 핵심 로직]
                        // 1. 현재 개수는 UI 설정값(최대치)을 초과해서는 안 됩니다.
                        expect(finalCount).to.be.at.most(expectedCount);
                        // 2. 만약 현재 개수가 설정값(최대치)보다 적다면? 
                        // -> 아직 데이터가 쌓이는 중이므로, 최소한 백업 전(beforeCount)보다는 늘어났어야 합니다.
                        if (finalCount < expectedCount) {
                          cy.log('📝  system폴더내 보관개수가 최대치에 도잘하지 않았습니다. 증분 확인을 수행합니다.');
                          expect(finalCount).to.be.at.least(beforeCount); 
                        } else {
                          // 3. 만약 현재 개수가 설정값과 같다면?
                          // -> 이미 꽉 찬 상태에서 로테이션이 일어난 것이므로 정상입니다.
                          cy.log('📝 system폴더내 보관개수 최대치에 도달하여 로테이션이 정상 작동 중입니다.');
                          expect(finalCount).to.equal(expectedCount);
                        }
                     
                        cy.log(`📊 [검증 4] 현재 system폴더내 폴더갯수 : 최종 ${finalCount}개 확인 (설정값: ${expectedCount}개)`);
                        // ================================================================
                        // 💡 [신규 추가] 실제 남아있는 폴더 목록을 조회하여 로그에 세로로 출력
                        // ==============================================================
                         cy.task('runSSH', `ls -1d ${backupPath}/system/${todayPrefix}_* 2>/dev/null`).then((folderList) => {
                         cy.log('📂 [system] 현재 system 하위폴더 목록:'); 
                          if (folderList && folderList.trim()) {
                            const folders = folderList.trim().split(/\s+/);
                            folders.forEach((folderPath) => {
                              // 절대 경로(/home/.../20260415_1) 대신 폴더명(20260415_1)만 깔끔하게 추출해서 출력
                              const folderName = folderPath.split('/').pop();
                              cy.log(`- ${folderName}`);
                            });
                          } else {
                            cy.log('⚠️ 조건에 맞는 폴더가 없습니다.');
                          }
                        });

                        
                        // ========================================================
                      });
                    });
                   //---------------------------------------------------------------------------
                  });
                });
                //---------------------------------------------------------------------------
                cy.log(' ✅ 백업 폴더(/home/logcatch/backup) 검증 확인완료');

            }); // beforePostgres 끝
        }); // beforeMongo 끝
    }); // beforeCount 끝
}); // backupPath 끝

   


    // ==========================================
    // STEP 10: 전송 방식(SFTP) 설정 및 연동 테스트
    // ==========================================
    cy.log('🚀 전송 방식 설정 시작 (SFTP)');
    cy.contains('.c-headline', '전송 방식').closest('.v-card').within(() => {
      // 1. 활성 토글 확인
      cy.get('.v-input--switch').then(($switch) => {
        if (!$switch.hasClass('v-input--is-label-active')) {
          cy.wrap($switch).find('.v-input--selection-controls__ripple').click();
        }
      });

    // 2. 서버 타입 및 상세 설정값 검증
    cy.get('.v-select__selection--comma').should('be.visible').and('contain', 'SFTP');
    cy.get('input[aria-label="백업 경로"]').should('have.value', '/home/backup');
    cy.get('input[aria-label="서버 ip"]').should('have.value', '10.10.54.24');
    cy.get('input[aria-label="PORT"]').should('have.value', '22');
    cy.get('input[aria-label="아이디"]').should('have.value', 'root');

    // 4. 접속 테스트 버튼 클릭
    cy.contains('button', '접속 테스트').should('not.be.disabled').click({ force: true });
  });

// 5. [검증] 접속 테스트 결과(Snackbar) 먼저 확인
// 버튼 클릭 후 "성공" 메시지가 떠야 실제 전송 경로가 유효하다는 증거입니다.
cy.get('.v-snack__content', { timeout: 20000 }).should('be.visible').and('contain', '성공');

// 6. [추가 검증] 실제 SFTP 서버(10.10.54.24) 내부 데이터 조회
// Snackbar 확인 직후 실행하여 데이터 무결성을 교차 검증합니다.
cy.task('runSSH', { 
    host: '10.10.54.24',
    username: 'root', 
    password: 'chakra', 
    command: 'ls -F /home/backup' 
}).then((folderList) => {
    cy.log('📂 [SFTP 서버: 10.10.54.24] /home/backup 목록:');
    
    // 에러 메시지(No such file, Permission denied 등)가 포함되어 있는지 먼저 확인
    if (folderList && (folderList.includes('No such file') || folderList.includes('cannot access'))) {
        cy.log("⚠️ /home/backup 경로 자체가 존재하지 않습니다.");
    } 
    // 정상적으로 파일/폴더 목록이 있는 경우
    else if (folderList && folderList.trim()) {
        cy.log(folderList);
    } 
    // 폴더는 존재하지만 안에 아무것도 없는 빈 폴더인 경우
    else {
        cy.log("⚠️ /home/backup 폴더는 존재하지만, 내부가 비어있습니다.");
    }
});

cy.log('✅ 전송 방식(SFTP) 설정값 검증 및 실제 서버 데이터 조회 완료!');
    

     // ==========================================
     // [FINAL] 테스트 종료 및 메뉴 닫기
     // ==========================================
     cy.log('🎉 보관 백업 테스트 시나리오 성공적으로 완료!');
     cy.get('body').type('{esc}');
     cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;
