const { defineConfig } = require("cypress");
const fs = require('fs');   // 파일 시스템 모듈
const path = require('path');

module.exports = defineConfig({
  //projectId: "7yuixr",
  projectId: "Cypress-auto",

  // 👇 [추가 1] 리포터 설정 (차트, 스크린샷 포함, HTML 하나로 합치기)
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    // 👇 [핵심 수정] Runner가 스스로 HTML을 만들다가 에러나지 않게 끕니다.
    // 어차피 Job 2에서 통합 리포트를 만드니까요!
    html: false,  
    json: true,   // 데이터는 남겨야 하니 true 유지
    
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