const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: "7yuixr",
  e2e: {
      chromeWebSecurity: false,
    viewportWidth: 1600,
    viewportHeight: 900,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
