const { defineConfig } = require("cypress");
const fs = require('fs');   // 파일 시스템 모듈
const path = require('path');

module.exports = defineConfig({
  //projectId: "7yuixr",
  projectId: "Cypress-auto",
  e2e: {
    excludeSpecPattern: [    
       "**/Check/**",
       "**/Basic_functions_check/**",
    ],

    // ▼▼▼ [수정] 재시도 설정 ▼▼▼
    retries: {
      runMode: 2,
      openMode: 0
    }, 

    chromeWebSecurity: false,
    viewportWidth: 1600,
    viewportHeight: 900,
    setupNodeEvents(on, config) {
      
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

    },
  },
});