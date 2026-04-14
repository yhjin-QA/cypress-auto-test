const { defineConfig } = require("cypress");
const fs = require('fs');   // 파일 시스템 모듈
const path = require('path');
const { NodeSSH } = require("node-ssh"); // 👇 [신규 추가] SSH 라이브러리 불러오기

// Lighthouse 플러그인 불러오기
const { lighthouse, prepareAudit } = require("@cypress-audit/lighthouse");

// 파일명을 저장해둘 전역 변수
let currentReportName = "default";

module.exports = defineConfig({
  //projectId: "7yuixr",
  projectId: "Cypress-auto",

  // 리포터를 Cypress 전용 플러그인으로 변경해야 스크린샷 내장이 가능합니다!
  reporter: 'cypress-mochawesome-reporter',
    
  reporterOptions: {
    // 저장 경로 (YAML 파일의 artifact 경로와 일치해야 함)
    reportDir: 'cypress/reports/json_logs',

    // 병렬 처리 시 파일명 충돌을 방지하기 위해 랜덤 문자열 추가
    reportFilename: `report_${Math.floor(Math.random() * 1000000)}`,
      
    // 파일 덮어쓰기 방지
    overwrite: false,
      
    // HTML은 끄고 JSON만 저장 (나중에 marge로 합칠 것이므로)
    html: false,  
    json: true,
      
    // 이 플러그인을 활성화했으므로 이 옵션들이 드디어 작동합니다!
    embeddedScreenshots: true,
    inlineAssets: true, 
    saveAllAttempts: false,   
  },

  e2e: {
    // 외부 사이트(WAS) 로딩 및 보안 이슈 해결을 위한 핵심 설정
    chromeWebSecurity: false, // 크로스 도메인 보안 정책 해제 (화면 깨짐 방지 도움)
    experimentalModifyObstructiveThirdPartyCode: true, // 외부 사이트의 방해 코드 수정 허용
    pageLoadTimeout: 60000, // 페이지 로딩 대기 시간을 60초로 상향 (WAS 응답 지연 대비)
    defaultCommandTimeout: 10000, // 기본 명령어 대기 시간 10초로 상향

    excludeSpecPattern: [    
       "**/Check/**",
       //"**/Basic_functions_check/**",
    ],

    retries: {
      runMode: 2,
      openMode: 0
    }, 

    viewportWidth: 1600,
    viewportHeight: 900,

    numTestsKeptInMemory: 0, 
    videoCompression: false,
    
    setupNodeEvents(on, config) {
      // 브라우저 실행 전 Lighthouse 감사 준비
      on("before:browser:launch", (browser = {}, launchOptions) => {
        prepareAudit(launchOptions);
      });

      // 스크린샷을 JSON에 넣으려면 플러그인 리스너가 반드시 필요합니다!
      require('cypress-mochawesome-reporter/plugin')(on);

      on('task', {
        // ==========================================
        // Lighthouse 결과를 HTML 파일로 저장하는 로직
        // ==========================================
        setReportName: (name) => {
          currentReportName = name;
          return null; 
        },

        lighthouse: lighthouse((lighthouseReport) => {
          const reportDir = path.join(__dirname, 'cypress', 'reports', 'lighthouse');
          if (!fs.existsSync(reportDir)) {
              fs.mkdirSync(reportDir, { recursive: true });
            }
                  
            const now = new Date();
            const formattedDate = now.getFullYear() + 
                                  String(now.getMonth() + 1).padStart(2, '0') + 
                                  String(now.getDate()).padStart(2, '0') + '_' + 
                                  String(now.getHours()).padStart(2, '0') + 
                                  String(now.getMinutes()).padStart(2, '0') + 
                                  String(now.getSeconds()).padStart(2, '0');
                  
           const fileName = `lighthouse-report-${currentReportName}-${formattedDate}.html`;
           const filePath = path.join(reportDir, fileName);
          
          fs.writeFileSync(filePath, lighthouseReport.report);
          console.log(`\n✅ Lighthouse 성능 리포트 저장 완료: ${filePath}\n`);
          
          return null; 
        }),
        // ==========================================

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
        }, // 👈 기존 마지막 태스크에 쉼표(,) 유지

        // ==========================================
        // 👇 [신규 추가] SSH 원격 접속을 위한 태스크 (서버 검증용)
        // ==========================================
        // async runSSH(command) {
        //   const ssh = new NodeSSH();
        //   try {
        //     // 🚨 실제 로그캐치 서버 정보로 변경해 주세요!
        //     await ssh.connect({
        //       host: "10.10.54.21", // 대상 서버 IP
        //       username: "root",    // 서버 접속 계정
        //       password: "chakra", // 서버 접속 비밀번호
        //       // port: 22 
        //     });

       async runSSH(params) {
        
  let host, username, password, command;

  // 1. 인자가 '문자열'인 경우 (기본 서버 54.21로 접속)
  if (typeof params === 'string') {
    host = "10.10.54.21";
    username = "root";
    password = "chakra";
    command = params;
  } 
  // 2. 인자가 '객체'인 경우 ({host, username, password, command})
  else {
    host = params.host || "10.10.54.21";
    username = params.username || "root";
    password = params.password || "chakra";
    command = params.command;
  }

  const ssh = new NodeSSH();
  try {
    await ssh.connect({
      host: host,
      username: username,
      password: password,
      // port: 22
    });

            console.log(`\n📡 SSH 명령 실행 중: ${command}\n`);
            
            // 서버 터미널에 명령어를 입력하고 결과를 받아옵니다.
            const result = await ssh.execCommand(command);
            ssh.dispose(); // 실행 완료 후 접속 안전하게 종료

            if (result.stderr) {
              console.error("SSH 에러 출력:", result.stderr);
            }
            
            // 터미널 결과 텍스트를 반환
            return result.stdout; 

          } catch (error) {
            console.error("SSH 접속 실패:", error);
            return null; // 실패 시 Cypress가 멈추지 않도록 null 반환
          }
        }
        // ==========================================

      }); // task 블록 종료

      return config;
    },
  },
});