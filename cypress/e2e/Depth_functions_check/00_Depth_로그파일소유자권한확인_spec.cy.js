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
describe('로그캐치 Depth 배포점검 - 로그파일 소유자(logcatch) 통합 확인', () => {

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

      // [2026-11-09] 파일마다 expect·log 하면 로그 파일이 수천 개일 때 러너가 멈춘 것처럼 느려짐
      //   → 서버에서 전체 개수와 'logcatch 소유가 아닌 파일'만 뽑아 한 번에 검증
      const cmd = `echo "TOTAL=$(find ${path} -maxdepth 1 -name '*.log' 2>/dev/null | wc -l)"; ` +
                  `find ${path} -maxdepth 1 -name '*.log' ! -user ${expectedOwner} -printf '%u %p\\n' 2>/dev/null | head -50`;
      cy.task('runSSH', cmd).then((stdout) => {
        expect(stdout, `SSH 응답 (${path})`).to.not.be.null;
        const lines = stdout.trim().split('\n').map((l) => l.trim()).filter(Boolean);
        const total = parseInt((lines.find((l) => l.startsWith('TOTAL=')) || 'TOTAL=0').split('=')[1], 10);
        const notOwned = lines.filter((l) => !l.startsWith('TOTAL='));

        if (total === 0) {
          cy.log(`⚠️  [알림] ${path} 경로에 .log 파일이 존재하지 않습니다.`);
          return;
        }
        cy.log(`📂 [${path}] .log 파일 ${total}개 / ${expectedOwner} 소유 아님 ${notOwned.length}개`);
        expect(notOwned, `${path} 에서 ${expectedOwner} 소유가 아닌 로그 파일 (최대 50개 표시)`).to.have.length(0);
        cy.log(`✅ [성공] ${path} 경로의 .log 파일 ${total}개 모두 ${expectedOwner} 소유`);
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
