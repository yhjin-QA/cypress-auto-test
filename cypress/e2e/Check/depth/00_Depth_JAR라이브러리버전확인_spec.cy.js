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

describe('Jar 라이브러리 정합성 검증 테스트', () => {
    it('DB 버전 확인 후 타겟 logcatch-metadb-버전.Jar 해제 및 라이브러리파일 존재 여부 검증', () => {
        
        // 🌟 1. [수정] WHERE 절의 컬럼명도 'mod_file_nm'으로 변경했습니다.
        const dbQuery = `
            SELECT mod_file_nm 
            FROM tbr_task_install 
            WHERE mod_file_nm LIKE 'logcatch-metadb-%.jar' 
            LIMIT 1;
        `;

        cy.task('queryPostgresDB', dbQuery).then((rows) => {
            
            // 🌟 [안전장치 추가] null 에러를 방지하기 위해 먼저 체크합니다.
            expect(rows, '✅ DB 쿼리 정상 실행 및 유효한 데이터 수신 완료').to.not.be.null;
            expect(rows.length, '✅ tbr_task_install 테이블에서 타겟 파일명(버전) 조회 성공').to.be.greaterThan(0);

            // 🌟 2. [수정] 파일명 추출 시에도 'mod_file_nm'을 사용합니다.
            const fileName = rows[0].mod_file_nm; 
            
            // 정규식으로 버전명만 쏙 뽑아내기
            const versionMatch = fileName.match(/logcatch-metadb-(.+)\.jar/);
            expect(versionMatch, '✅ 타겟 파일명에서 버전 정보(정규식) 추출 완료').to.not.be.null;
            
            const version = versionMatch[1]; // 예: 3.0.5.0
            cy.log(`🎯 DB에서 확인된 logcatch-metadb-버전.jar 타겟 버전: ${version}`);

            // 2. 타겟 대상 지정 및 3. 압축 해제, 4. 파일 읽기 (SSH 콤보)
            const targetJar = `/home/logcatch/task/lib/logcatch-metadb-${version}.jar`;
            
            // 임시 폴더에 압축을 풀고 파일을 읽은 뒤, 찌꺼기가 남지 않게 임시 폴더를 지우는 스마트한 리눅스 명령어 콤보
            const sshExtractAndReadCmd = `
                mkdir -p /tmp/jar_test_${version} && \
                cd /tmp/jar_test_${version} && \
                unzip -q -o ${targetJar} && \
                cat META-INF/logcatch.plugins && \
                rm -rf /tmp/jar_test_${version}
            `;

            cy.log(`🚀 타겟 파일 압축 해제 및 라이브러리 목록 읽기 시작: ${targetJar}`);
            cy.task('runSSH', sshExtractAndReadCmd).then((pluginsOutput) => {
                
                // 읽어온 파일 내용 정리 (엔터 기준으로 배열화 및 공백/빈줄 제거)
                const requiredPlugins = pluginsOutput.split('\n')
                    .map(plugin => plugin.trim())
                    .filter(plugin => plugin.length > 0);

                expect(requiredPlugins.length, '✅ logcatch.plugins 파일 정상 읽기 완료 (항목 존재함)').to.be.greaterThan(0);
                cy.log(`📋 [META-INF/logcatch.plugins] 필요 라이브러리파일 목록: ${requiredPlugins.join(', ')}`);

                // 4. /home/logcatch/common/lib 폴더에 위 플러그인들이 전부 존재하는지 확인
                const commonLibPath = '/home/logcatch/common/lib';
                const sshListLibCmd = `ls -1 ${commonLibPath}`; // -1 옵션: 한 줄에 하나씩 파일명 출력

                cy.task('runSSH', sshListLibCmd).then((lsOutput) => {
                    const existingFiles = lsOutput.split('\n').map(f => f.trim());

                   // 필수 플러그인 목록을 하나씩 돌면서 서버 디렉토리에 있는지 검증
                     requiredPlugins.forEach(pluginName => {
                      // 🌟 텍스트를 실패 메시지가 아닌, 검증 목적(라벨)으로 변경했습니다.
                      expect(
                          existingFiles, 
                          `✅ [라이브러리 파일명 확인] ${pluginName}`
                      ).to.include(pluginName);
                    });

                    cy.log(`✅ 성공! ${requiredPlugins.length}개의 라이브러리파일  common/lib 경로에 모두 동일하게 존재합니다!`);
                });
            });
        });
    });
});

/** 코드 마지막 */


 })()
;
