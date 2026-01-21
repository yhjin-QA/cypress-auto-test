const { defineConfig } = require("cypress");

module.exports = defineConfig({
  //projectId: "7yuixr",
  projectId: "Cypress-auto",
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
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});