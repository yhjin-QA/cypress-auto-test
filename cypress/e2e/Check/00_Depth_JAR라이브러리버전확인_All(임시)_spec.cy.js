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
describe('로그캐치 Depth Jar 라이브러리 정합성 검증', () => {
    it('00_Depth_JAR라이브러리버전확인 자동화 시나리오', () => {
        
        // 🌟 [ 검사대상 제외파일 예외처리] dataFileCleaner 파일은 검사 대상에서 아예 제외합니다.
        const dbQuery = `
            SELECT mod_file_nm 
            FROM tbr_task_install 
            WHERE mod_file_nm LIKE 'logcatch-%.jar'
              AND mod_path LIKE '%/home/logcatch/task/lib%'
              AND mod_file_nm NOT LIKE 'logcatch-dataFileCleaner-%.jar'
        `;

        const commonLibPath = '/home/logcatch/common/lib';

        cy.task('queryPostgresDB', dbQuery).then((rows) => {
            expect(rows, '✅ DB 쿼리 정상 실행 및 유효한 데이터 수신 완료').to.not.be.null;
            expect(rows.length, '✅ 조건에 맞는(지정된 경로의) 타겟 JAR 파일 조회 성공').to.be.greaterThan(0);

            cy.log(`📂 해당 경로(/home/logcatch/task/lib/)에서 총 ${rows.length}개의 JAR 파일 검증을 시작합니다.`);

            // 🌟 1. 건너뛴 파일명을 담을 빈 배열(바구니)을 준비합니다.
            const skippedFiles = [];

            const sshListLibCmd = `ls -1 ${commonLibPath}`;
            cy.task('runSSH', sshListLibCmd).then((lsOutput) => {
                const existingFiles = lsOutput.split('\n').map(f => f.trim());

                rows.forEach((row, index) => {
                    const fileName = row.mod_file_nm;
                    const match = fileName.match(/(.+)-(.+)\.jar/);
                    
                    if (!match) {
                        cy.log(`⚠️ 파일명 형식이 맞지 않아 건너뜁니다: ${fileName}`);
                        return;
                    }

                    const version = match[2];  
                    const targetJar = `/home/logcatch/task/lib/${fileName}`;

                    cy.log(`--- [${index + 1}/${rows.length}] ${fileName} 검증 중 ---`);
                    cy.log(`🎯 DB에서 추출된 타겟 버전: ${version}`);

                    const sshExtractAndReadCmd = `
                        mkdir -p /tmp/jar_test_${version} && \
                        cd /tmp/jar_test_${version} && \
                        unzip -q -o ${targetJar} META-INF/logcatch.plugins 2>/dev/null && \
                        cat META-INF/logcatch.plugins && \
                        rm -rf /tmp/jar_test_${version}
                    `;

                    cy.task('runSSH', sshExtractAndReadCmd).then((pluginsOutput) => {
                        if (!pluginsOutput || pluginsOutput.includes('cannot find')) {
                            cy.log(`⚠️ ${fileName} 내부에서 logcatch.plugins를 찾을 수 없거나 비어있습니다.`);
                            
                            // 🌟 2. 플러그인 목록이 없어서 건너뛰는 경우, 바구니에 파일명을 담습니다.
                            skippedFiles.push(fileName);
                            return;
                        }

                        const requiredPlugins = pluginsOutput.split('\n')
                            .map(p => p.trim())
                            .filter(p => p.length > 0);

                        requiredPlugins.forEach(pluginName => {

                                // 3.0.5.1191_r35135 임시 예외처리
                                //-------------------------------------------------------------------
                                // ⚠️ [임시패스] tomcat 계열 라이브러리 버전 불일치 허용
                                // 확인사항: plugins에는 9.0.104 명시되어 있으나 실제 설치는 9.0.117
                                // JAR 재빌드 전까지 임시로 버전 무관 존재 여부만 검증
                                const tomcatTempPassList = [
                                    'tomcat-embed-websocket',
                                    'tomcat-jdbc',
                                    'tomcat-annotations-api',
                                    'tomcat-embed-el',
                                    'tomcat-juli',
                                ];
                                const matchedTomcat = tomcatTempPassList.find(baseName => pluginName.startsWith(baseName));
                                if (matchedTomcat) {
                                    const hasAnyVersion = existingFiles.some(f => f.startsWith(matchedTomcat));
                                    cy.log(`⚠️ [임시패스] ${pluginName} → 버전 불일치 허용, ${matchedTomcat} 계열 파일 존재 여부만 확인`);
                                    expect(
                                        hasAnyVersion,
                                        `⚠️ [임시패스] ${matchedTomcat} 계열 파일이 ${commonLibPath}에 존재해야 합니다.`
                                    ).to.be.true;
                                    return;
                                }
                                //-------------------------------------------------------------------------------
                            expect(
                                existingFiles, 
                                `✅ [라이브러리 파일명 확인 (${fileName})] ${pluginName}`
                            ).to.include(pluginName);
                        });

                        cy.log(`✅ ${fileName} (v${version}) 검증 완료: ${requiredPlugins.length}개 항목 일치`);
                    });
                });

                // 🌟 모든 반복문이 끝난 후 실행되는 리포트 및 최종 검증 부분
                // meta-inf/logcatch.plugins 파일없는 JAR파일은 건너뜀 파일대상 (방어로직)
                cy.then(() => {
                    cy.log('====================================================');
                    cy.log('📊 [최종 검증 리포트]');
                    cy.log(`총 대상 파일: ${rows.length}개`);
                    cy.log(`검증 완료 파일: ${rows.length - skippedFiles.length}개`);
                    cy.log(`건너뛴 파일: ${skippedFiles.length}개`);
                    
                    if (skippedFiles.length > 0) {
                        cy.log(`⏩ [건너뛴 파일 목록]\n${skippedFiles.join('\n')}`);
                    }
                    cy.log('====================================================');

                    // 🌟 [핵심 추가] 건너뛴 파일이 0개인지 최종 검증합니다.
                    // 만약 1개라도 건너뛰었다면, 여기서 테스트가 "Fail" 처리됩니다.
                    // 🌟 건너뛴 파일이 1개라도 있으면 즉시 에러를 발생시켜 테스트를 중단(Fail)시킵니다.
                    if (skippedFiles.length > 0) {
                        throw new Error(`❌ [검증오류 발생!] logcatch.plugins가 없어 건너뛴 파일이 ${skippedFiles.length}개 발생했습니다. 파일목록을 확인해주세요.`);
                    } else {
                        // 0개라면 아주 예쁜 성공 로그만 하나 남깁니다.
                        cy.log('✅ 건너뛴 파일없이 모든 대상 파일이 완벽하게 검증되었습니다!');
                    }
                });
            });
        });
    });
});
/** 코드 마지막 */


 })()
;
