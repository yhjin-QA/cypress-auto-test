const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: "7yuixr",
  e2e: {
    excludeSpecPattern: [
      "**/UI 체크/**",
    ],

    // ▼▼▼ [수정] 재시도 설정 ▼▼▼
    retries: {
      runMode: 2,
      openMode: 0
    }, // 👈 [중요] 여기서 괄호를 닫고 콤마(,)를 찍어야 합니다!

    chromeWebSecurity: false,
    viewportWidth: 1600,
    viewportHeight: 900,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});