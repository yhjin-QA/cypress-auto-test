const { defineConfig } = require("cypress");
// 👇 [필수] 이 두 줄이 없으면 에러납니다.
const fs = require('fs');
const path = require('path');

module.exports = defineConfig({
  projectId: "Cypress-auto",

  // 리포터 설정
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
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
      
      // 👇 [수정됨] 훨씬 강력해진 '빈 리포트 생성' 코드
      on('before:run', async (details) => {
        try {
          // config.projectRoot 대신 process.cwd() 사용 (더 안전함)
          const reportDir = path.join(process.cwd(), 'cypress', 'reports', 'html', '.jsons');
          
          // 폴더가 없으면 생성
          if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
          }

          // 빈 결과 파일 생성
          const dummyFile = path.join(reportDir, 'dummy.json');
          const dummyContent = {
            stats: { tests: 0, passes: 0, failures: 0, duration: 0, start: new Date(), end: new Date() },
            results: [],
            meta: {}
          };
          
          fs.writeFileSync(dummyFile, JSON.stringify(dummyContent));
          console.log('✅ [Info] 빈 리포트(dummy.json) 안전하게 생성 완료');
          
        } catch (error) {
          // 에러가 나도 테스트를 멈추지 않고 로그만 찍고 넘어감
          console.error('⚠️ [Warning] 빈 리포트 생성 중 에러 발생 (테스트는 계속 진행됨):', error.message);
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