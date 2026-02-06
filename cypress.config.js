const { defineConfig } = require("cypress");
// 👇 [필수] 파일 시스템 모듈 (이게 없으면 에러납니다!)
const fs = require('fs');
const path = require('path');

module.exports = defineConfig({
  projectId: "Cypress-auto",

  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    // 👇 [핵심 1] Runner가 스스로 HTML을 만들다가 에러나지 않게 끕니다.
    // (통합 리포트는 Job 2에서 만드니까요!)
    html: false,  
    json: true,   // 데이터는 남겨야 하니 true 유지
    
    charts: true,
    reportPageTitle: '로그캐치 UI 테스트 결과',
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: false,
  },

  e2e: {
    excludeSpecPattern: [
       "**/Check/**",
    ],
    retries: {
      runMode: 2,
      openMode: 0
    }, 
    chromeWebSecurity: false,
    viewportWidth: 1600,
    viewportHeight: 900,
    
    // 메모리 최적화
    numTestsKeptInMemory: 0, 
    videoCompression: false,
    
    setupNodeEvents(on, config) {
      // 1. 리포터 플러그인 연결
      require('cypress-mochawesome-reporter/plugin')(on);

      // 👇 [핵심 2] '빈 리포트 파일' 미리 만들기 (백신 코드)
      // 이 코드가 있어야 Runner가 일감(Specs)이 0개여도 에러가 안 납니다!
      on('before:run', async (details) => {
        try {
          // 절대 경로를 사용하여 안전하게 경로 설정
          const reportDir = path.join(process.cwd(), 'cypress', 'reports', 'html', '.jsons');
          
          // 폴더가 없으면 생성
          if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
          }

          // 'dummy.json' 파일 생성 (내용은 텅 빈 결과)
          // 리포터가 "어? 파일이 있네?" 하고 에러를 내지 않게 만드는 가짜 파일입니다.
          const dummyFile = path.join(reportDir, 'dummy.json');
          const dummyContent = {
            stats: { 
              tests: 0, passes: 0, failures: 0, pending: 0,
              start: new Date().toISOString(), end: new Date().toISOString(), duration: 0 
            },
            results: [],
            meta: { mocha: { version: "7.0.0" }, mochawesome: { version: "7.1.3" } }
          };
          
          fs.writeFileSync(dummyFile, JSON.stringify(dummyContent));
          console.log('✅ [Info] 빈 리포트(dummy.json) 생성 완료 - 에러 방지용');
          
        } catch (error) {
          console.error('⚠️ [Warning] Dummy 파일 생성 실패 (무시함):', error.message);
        }
      });

      on('task', {
        readDirectory(folderPath) {
          const dir = path.resolve(folderPath);
          if (!fs.existsSync(dir)) return [];
          return fs.readdirSync(dir);
        },
        clearDownloads(folderPath) {
          const dir = path.resolve(folderPath);
          if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
          }
          return null;
        },
      });

      return config;
    },
  },
});