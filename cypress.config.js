const { defineConfig } = require("cypress");
const fs = require('fs');   // 파일 시스템 모듈
const path = require('path');

module.exports = defineConfig({
  //projectId: "7yuixr",
  projectId: "Cypress-auto",

  // 👇 [추가 1] 리포터 설정 (차트, 스크린샷 포함, HTML 하나로 합치기)
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    charts: true,              // 차트 보여주기
    reportPageTitle: '로그캐치 UI 테스트 결과', // 리포트 제목
    embeddedScreenshots: true, // 스크린샷을 HTML 안에 포함 (파일 하나로 만듦)
    inlineAssets: true,        // CSS/JS를 HTML 안에 포함
    saveAllAttempts: false,    // 재시도한 건 빼고 최종 결과만 저장
  },

  e2e: {
    excludeSpecPattern: [    
       "**/Check/**",
       //"**/Basic_functions_check/**",
    ],

    // ▼▼▼ [수정] 재시도 설정 ▼▼▼
    retries: {
      runMode: 2,
      openMode: 0
    }, 

    chromeWebSecurity: false,
    viewportWidth: 1600,
    viewportHeight: 900,

    // 👇 [핵심] 메모리에 스냅샷을 0개(또는 1개)만 유지하도록 설정
    // 이렇게 하면 테스트가 진행되면서 메모리를 바로바로 비워줍니다.
    numTestsKeptInMemory: 0, 
    // 비디오 녹화가 켜져 있다면, 압축 옵션을 끄면 CPU 부하가 줍니다. (선택사항)
    videoCompression: false,
    
    setupNodeEvents(on, config) {
      // 👇 [추가 2] 리포터 플러그인 연결 (task 설정보다 위에 적어주세요)
      require('cypress-mochawesome-reporter/plugin')(on);

      // 👇 [핵심 추가] 일감이 0개일 때 에러 방지용 '빈 리포트 파일' 생성
      on('before:run', async (details) => {
        // 리포트 JSON이 저장될 폴더 경로 (cypress-mochawesome-reporter 기본 경로)
        const reportDir = path.join(config.projectRoot, 'cypress', 'reports', 'html', '.jsons');
        
        // 폴더가 없으면 만듭니다.
        if (!fs.existsSync(reportDir)) {
          fs.mkdirSync(reportDir, { recursive: true });
        }

        // 'dummy.json'이라는 빈 결과 파일을 미리 하나 만들어 둡니다.
        // 나중에 테스트가 하나도 안 돌아도, 이 파일이 있어서 에러가 안 납니다.
        const dummyFile = path.join(reportDir, 'dummy.json');
        const dummyContent = {
          stats: { tests: 0, passes: 0, failures: 0, duration: 0, start: new Date(), end: new Date() },
          results: [],
          meta: {}
        };
        
        fs.writeFileSync(dummyFile, JSON.stringify(dummyContent));
        console.log('✅ [Info] 빈 리포트 병합 에러 방지용 dummy.json 생성 완료');
      });
      // 👆 [여기까지 추가]

      on('task', {
        // 1. (기존) 파일 목록 읽기
        readDirectory(folderPath) {
          const dir = path.resolve(folderPath);
          // 폴더가 없으면 빈 배열 반환
          if (!fs.existsSync(dir)) return [];
          // 폴더 안에 있는 파일 목록을 반환
          return fs.readdirSync(dir);
        },

        // ⬇️ 2. (신규 추가) 폴더 비우기 기능 ⬇️
        clearDownloads(folderPath) {
          const dir = path.resolve(folderPath);
          
          if (fs.existsSync(dir)) {
            // 폴더 자체를 삭제합니다 (recursive: 내용물 포함, force: 강제)
            fs.rmSync(dir, { recursive: true, force: true });
          }
          
          return null; // Cypress task는 반드시 값을 반환해야 함 (null OK)
        },
        // ⬆️ 여기까지 ⬆️
      });

      // 리포터 플러그인이 config를 수정할 수 있으므로 반환해주는 것이 좋습니다.
      return config;
    },
  },
});