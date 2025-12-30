const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: "7yuixr",
  e2e: {

    // ▼▼▼ [수정] 아래 부분을 추가하세요 ▼▼▼
    excludeSpecPattern: [
      "**/UI 체크/**",          // 'UI 체크' 폴더 안의 모든 것 제외
    ], // ▲▲▲ [여기까지] ▲▲▲
    
    chromeWebSecurity: false,
    viewportWidth: 1600,
    viewportHeight: 900,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
