const { defineConfig } = require("cypress");
const fs = require('fs');   // 파일 시스템 모듈
const path = require('path');

module.exports = defineConfig({
  //projectId: "7yuixr",
  projectId: "Cypress-auto",

    // 👇 [수정 1] 리포터를 기본형 'mochawesome'으로 변경
    // (이래야 병렬 실행 시 json 파일이 누락 없이 착착 쌓입니다)
    reporter: 'mochawesome',
    
    reporterOptions: {
      // 👇 [수정 2] 순수 데이터 생성을 위한 설정만 남김
      
      // 저장 경로 (YAML 파일의 artifact 경로와 일치해야 함)
      reportDir: 'cypress/reports/json_logs',

      // 👇 [핵심 수정] 파일명이 겹치지 않게 랜덤 문자열을 붙입니다.
      // 예: report_3k4j5l.json, report_9a8b7c.json ...
      reportFilename: `report_${Math.floor(Math.random() * 1000000)}`,
      
      // 파일이 덮어씌워지지 않도록 설정
      overwrite: false,
      
      // HTML은 끄고, JSON 데이터만 생성
      html: false,  
      json: true,   
    },

  e2e: {
    excludeSpecPattern: [    
       "**/Check/**",
       //"**/Basic_functions_check/**",
    ],

    retries: {
      runMode: 2,
      openMode: 0
    }, 

    chromeWebSecurity: false,
    viewportWidth: 1600,
    viewportHeight: 900,

    numTestsKeptInMemory: 0, 
    videoCompression: false,
    
    setupNodeEvents(on, config) {
      // 👇 [수정 3] 리포터 플러그인 연결 제거 (mochawesome 쓸 때는 필요 없음)
      // require('cypress-mochawesome-reporter/plugin')(on);

      on('task', {
        // 1. (기존) 파일 목록 읽기
        readDirectory(folderPath) {
          const dir = path.resolve(folderPath);
          if (!fs.existsSync(dir)) return [];
          return fs.readdirSync(dir);
        },

        // 2. (신규 추가) 폴더 비우기 기능
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