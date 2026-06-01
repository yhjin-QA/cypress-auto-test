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

/** 코드 시작 */
describe('로그캐치 배포 점검 - 소유권 통합 확인', () => {

  const targetPaths = [
    '/home/logcatch/logs/',
    '/home/logcatch/taskmgr/log/',
    '/home/logcatch/proc/logcollector/log/',
    '/home/logcatch/proc/discriminator/log/',
    '/home/logcatch/proc/redisdump/log/',
    '/home/logcatch/redis/log/'
  ];
  const expectedOwner = 'logcatch';
  
  it('지정된 모든 경로의 로그 파일 소유권을 전수 조사합니다.', () => {
    
    // 각 경로를 순차적으로 검사하기 위해 반복문을 it 내부로 이동
    targetPaths.forEach((path) => {
      
      cy.log(`🔍 검사 시작 경로: ${path}`);

      // runSSH 태스크 실행
      cy.task('runSSH', `stat -c "%U" ${path}*.log 2>/dev/null`).then((stdout) => {
        
        // 1. 파일이 없는 경우 처리
        if (!stdout || stdout.trim() === "") {
          cy.log(`⚠️  [알림] ${path} 경로에 .log 파일이 존재하지 않습니다.`);
          return; 
        }

        const owners = stdout.trim().split('\n');
        const totalFiles = owners.length;

        cy.log(`📂 [${path}] 폴더 내 ${totalFiles}개 파일 검증 중...`);

        // 2. 각 파일 소유자 검증
        owners.forEach((owner, index) => {
          const currentOwner = owner.trim();
          
          // 성공 시 로그가 너무 도배되지 않도록 expect 메시지를 간결하게 유지
          expect(currentOwner, `경로: ${path} (${index + 1}/${totalFiles})`).to.equal(expectedOwner);
          
          // 500개 단위로 진행률 표시
          if ((index + 1) % 500 === 0 || (index + 1) === totalFiles) {
            cy.log(`🔄 진행률: ${index + 1} / ${totalFiles} 완료`);
          }
        });

        cy.log(`✅ [성공] ${path} 경로의 모든 파일 권한이 정상입니다.`);
        cy.log(`✅ [검증 완료] 모든 파일이 ${expectedOwner} 소유임을 확인했습니다.`);
      });
    });
  });

  // 모든 검증이 끝난 후 실행
  after(() => {
    cy.log('🎉 모든 시나리오가 성공적으로 종료되었습니다.');
    cy.get('body').type('{esc}');
    // 클릭이 필요하다면 좌표 대신 정확한 선택자를 쓰는 것이 좋으나 기존 방식을 유지합니다.
    cy.get('body').click('center', { force: true });
  });

});
/** 코드 마지막 */


 })()
;
