const { defineConfig } = require("cypress");
const fs = require('fs');   // 파일 시스템 모듈
const path = require('path');
const { NodeSSH } = require("node-ssh"); // 👇 [신규 추가] SSH 라이브러리 불러오기

//   Oracle DB 모듈 불러오기
const oracledb = require('oracledb');
//   postgress DB 모듈 불러오기
const { Client } = require('pg');

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
    // 🌟 검증 대상 서버 (실행 시 --env TARGET_HOST=10.10.54.81 형태로 변경)
    //    v2.9: 10.10.54.21 / v2.8: 10.10.54.81 / v2.7: 10.10.54.91
    env: {
      TARGET_HOST: '10.10.54.21',
    },

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

      // 🌟 대상 서버 (SSH / PostgreSQL / baseUrl 공통 적용)
      const TARGET_HOST = config.env.TARGET_HOST || '10.10.54.21';
      console.log(`\n🎯 검증 대상 서버: ${TARGET_HOST}\n`);

      // 브라우저 실행 전 Lighthouse 감사 준비
      on("before:browser:launch", (browser = {}, launchOptions) => {
        prepareAudit(launchOptions);
        return launchOptions; // 🌟 이 줄만 추가
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
        // 🌟 새로 추가: 파일의 상태(용량 포함)를 가져오는 태스크
        // ==========================================
        getFileStats(filePath) {
          const resolvedPath = path.resolve(filePath);
          if (fs.existsSync(resolvedPath)) {
            const stats = fs.statSync(resolvedPath);
            return {
              size: stats.size, // 파일 용량 (bytes)
              isFile: stats.isFile() // 파일 여부(디렉토리 등과 구분)
            };
          }
          return null; // 파일이 없으면 null 반환
        },


        // ==========================================
        // 👇 [신규 추가] SSH 원격 접속을 위한 태스크 (서버 검증용)
        // ==========================================
       async runSSH(params) {
        
  let host, username, password, command;

  // 1. 인자가 '문자열'인 경우 (TARGET_HOST 서버로 접속)
  if (typeof params === 'string') {
    host = TARGET_HOST;
    username = "root";
    // ✅ GitHub 환경변수가 있으면 쓰고, 없으면 로컬용 사용
    password = process.env.SSH_PASSWORD || "chakra";
    command = params;
  } 
  // 2. 인자가 '객체'인 경우 ({host, username, password, command})
  else {
    host = params.host || TARGET_HOST;
    username = params.username || "root";
    // ✅ 파라미터로 받은 게 없으면 환경변수 확인 후 최후에 로컬용 사용
    password = params.password || process.env.SSH_PASSWORD || "chakra";
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

            console.log(`\n📡 SSH 명령 실행 중 (${host}): ${command}\n`);
            
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
        },
        // ==========================================

                // ==========================================
                // 👇 [신규 추가] Oracle DB 직접 접속 및 쿼리 실행 태스크
                // ==========================================
                async queryDB(query) {
                  let connection;
                  try {
                    // 🚨 [핵심 추가] 구버전 오라클(11g) 접속을 위한 Thick 모드 초기화
                    // 한 번만 초기화되도록 조건문 처리
                    if (!oracledb.oracleClientInitialized) {
                      // 윈도우 경로인 경우 역슬래시(\)를 두 번씩(\\) 쓰거나 슬래시(/)로 써야 합니다.
                      // 아래 경로는 방금 Instant Client 압축을 푼 '실제 폴더 경로'로 바꿔주세요!
                      oracledb.initOracleClient({ libDir: 'C:\\oracle\\instantclient' }); 
                    }
                    // 전달해주신 정보로 DB 접속 설정
                    connection = await oracledb.getConnection({
                      user: "WVADMIN",
                      // ✅ GitHub 환경변수가 있으면 쓰고, 없으면 로컬용 사용
                      password: process.env.DB_PASSWORD || "qwert123",
                      connectString: "(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=172.16.200.16)(PORT=1522))(CONNECT_DATA=(SID=xe)))"
                    });
        
                    console.log(`\n🛢️ Oracle DB 쿼리 실행 중: ${query}\n`);
                    
                    // 쿼리 실행 (outFormat 설정으로 결과를 깔끔한 JSON 객체 배열로 받습니다)
                    const result = await connection.execute(query, [], { 
                      outFormat: oracledb.OUT_FORMAT_OBJECT,
                      autoCommit: true  // ⭐ 이 줄이 반드시 있어야 DBeaver에서도 데이터가 보입니다!  
                    });
                    
                    // 둘 다 없으면 null이라도 반환하여 Cypress 에러를 방지합니다.
                    return result.rows || { affected: result.rowsAffected } || null;
        
                  } catch (err) {
                    console.error("\n❌ Oracle DB 접속 또는 쿼리 실패:\n", err);
                    return null;
                  } finally {
                    if (connection) {
                      try {
                        await connection.close(); // 작업 완료 후 무조건 접속 종료
                      } catch (err) {
                        console.error("DB 접속 종료 에러:", err);
                      }
                    }
                  }
                },
                // ==========================================

                // ==========================================
                // 👇 [신규 추가] PostgreSQL 직접 접속 및 쿼리 실행 태스크
                // ==========================================
                async queryPostgresDB(query) {
                  const client = new Client({
                    host: TARGET_HOST,      // 🌟 대상 서버 (v2.9/.21, v2.8/.81, v2.7/.91 공통 계정)
                    port: 15432,            // Postgres 포트
                    database: "logcatch",     // 대상 데이터베이스 이름
                    user: "logcatch",       // 접속 계정명
                    // ✅ GitHub 환경변수 처리 (로컬에서는 우측 비밀번호 사용)
                    password: process.env.PG_PASSWORD || "Manager1!", 
                  });
                  try {
                    await client.connect();
                    console.log(`\n🐘 PostgreSQL 쿼리 실행 중 (${TARGET_HOST}): ${query}\n`);
                    // 쿼리 실행
                    const res = await client.query(query);
                    // 결과 반환 (오라클과 동일하게 [{컬럼: 값}, ...] 형태로 자동 반환됨)
                    return res.rows; 
                  } catch (err) {
                    console.error("\n❌ PostgreSQL 접속 또는 쿼리 실패:\n", err);
                    return null;
                  } finally {
                    try {
                      await client.end(); // 작업 완료 후 무조건 접속 종료
                    } catch (err) {
                      console.error("PostgreSQL 접속 종료 에러:", err);
                    }
                  }
                },
                // ==========================================

                // ==========================================
                // [2026-11-16] MariaDB(.26 logcatch_demo) 쿼리 — 인사연동 자동화 원본 (Oracle 172.16.200.16 대신)
                //   12 · 14 Depth 가 auto_인사연동_Maria 정책의 원본 logcatch_demo.employees 에 테스트 사원을 넣고 지울 때 사용
                //   계정은 cypress.env.json 의 MARIA26_USER · MARIA26_PW (없으면 실패 메시지를 돌려줌 — 비밀번호는 로그에 남기지 않음)
                //   mysql2 패키지 필요 : npm i -D mysql2
                //   반환 : SELECT → 행 배열 / 그 밖 → { affected } / 오류 → { error }
                // ==========================================
                async queryMariaDB(query) {
                  let mysql;
                  try { mysql = require('mysql2/promise'); } catch (e) { return { error: 'mysql2 패키지가 없습니다 — npm i -D mysql2' }; }
                  if (!config.env.MARIA26_USER || !config.env.MARIA26_PW) return { error: 'cypress.env.json 에 MARIA26_USER · MARIA26_PW 가 없습니다' };
                  let conn;
                  try {
                    conn = await mysql.createConnection({
                      host: config.env.MARIA26_HOST || '10.10.54.26', port: 3306, database: 'logcatch_demo',
                      user: config.env.MARIA26_USER, password: config.env.MARIA26_PW, connectTimeout: 10000
                    });
                    console.log(`\n🐬 MariaDB(.26) 쿼리 실행 중: ${query}\n`);
                    const [rows] = await conn.query(query);
                    return Array.isArray(rows) ? rows : { affected: rows.affectedRows };
                  } catch (err) {
                    console.error('\n❌ MariaDB 접속 또는 쿼리 실패:\n', err.message);
                    return { error: err.message };
                  } finally {
                    if (conn) { try { await conn.end(); } catch (e) { /* ignore */ } }
                  }
                },

                // ==========================================
                // [2026-11-12] CRM(.27 리눅스_VIP고객) 접속 기록 발생 — 로그인 → 조회를 Node 에서 수행
                //   cy.request 는 네트워크 오류(ETIMEDOUT 등)를 한 번 만나면 바로 실패해서 (2026-11-12 CI 반려 실패)
                //   여기서 요청마다 20초 제한 · 실패 시 gapMs 간격으로 attempts 회까지 다시 시도하고, 결과를 그대로 돌려줌 (예외 안 냄)
                //   비밀번호는 config.env.CRM27_PW (cypress.env.json) 에서 직접 읽음 → 브라우저·명령 로그를 거치지 않음
                //   반환 : { ok, attempts, login(상태 코드), inquiry(상태 코드), cookie(세션 쿠키 받았는지), error }
                // ==========================================
                crmTraffic({ userId, attempts = 3, gapMs = 10000 }) {
                  const http = require('http');
                  const querystring = require('querystring');
                  const CRM_HOST = '10.10.54.27';
                  const send = (opts, body) => new Promise((resolve, reject) => {
                    const r = http.request({ host: CRM_HOST, port: 80, timeout: 20000, ...opts }, (res) => {
                      res.resume();
                      res.on('end', () => resolve({ status: res.statusCode, cookies: (res.headers['set-cookie'] || []).map((c) => c.split(';')[0]) }));
                    });
                    r.on('timeout', () => r.destroy(new Error('응답 없음 (20초)')));
                    r.on('error', reject);
                    if (body) r.write(body);
                    r.end();
                  });
                  const once = async () => {
                    const body = querystring.stringify({ empId: userId, empPw: config.env.CRM27_PW || '' });
                    const login = await send({ method: 'POST', path: '/crm/login.jsp',
                      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) } }, body);
                    const cookie = login.cookies.join('; ');
                    const inquiry = await send({ method: 'GET', path: `/crm/soc_matrix.jsp?action=massive_inquiry&_ts=${Date.now()}`,
                      headers: cookie ? { Cookie: cookie } : {} });
                    return { login: login.status, inquiry: inquiry.status, cookie: !!cookie };
                  };
                  return (async () => {
                    let lastError = '';
                    let last = { login: null, inquiry: null, cookie: false };
                    for (let i = 1; i <= attempts; i += 1) {
                      try {
                        last = await once();
                        if ([200, 302].includes(last.login) && last.inquiry === 200) return { ok: true, attempts: i, ...last, error: null };
                        lastError = `응답 코드 — 로그인 ${last.login} / 조회 ${last.inquiry}`;
                      } catch (e) {
                        lastError = `${e.code || ''} ${e.message}`.trim();
                      }
                      console.log(`⚠️ CRM(.27) ${userId} 접속 기록 ${i}/${attempts}회 실패 : ${lastError}`);
                      if (i < attempts) await new Promise((done) => setTimeout(done, gapMs));
                    }
                    return { ok: false, attempts, ...last, error: lastError };
                  })();
                },
                // ==========================================
                // [2026-11-25] Mailpit(.26:8025) 조회 — 순간 접속 끊김(ETIMEDOUT 등)에 대비해 최대 tries 번 다시 시도
                //   (11-24 GitHub 실행 : 04_소명_수동요청에서 cy.request 가 ETIMEDOUT 으로 바로 실패 — 같은 실행의 뒤 spec 은 정상 접속)
                //   인자 : { path('/messages?limit=200' 처럼 /api/v1 뒤 경로), tries=4, timeout=15000(ms), gap=5000(ms) }
                //   반환 : { ok, status, body(JSON), error, 시도 }
                // ==========================================
                mailpitGet({ path, tries = 4, timeout = 15000, gap = 5000 }) {
                  const http = require('http');
                  const once = () => new Promise((resolve) => {
                    const r = http.get({ host: '10.10.54.26', port: 8025, path: `/api/v1${path}`, timeout }, (res) => {
                      const chunks = [];
                      res.on('data', (d) => chunks.push(d));
                      res.on('end', () => {
                        const text = Buffer.concat(chunks).toString('utf8');
                        let body = null;
                        try { body = JSON.parse(text); } catch (e) { body = null; }
                        resolve({ ok: res.statusCode === 200 && body !== null, status: res.statusCode, body, error: body === null ? 'JSON 아님' : null });
                      });
                    });
                    r.on('timeout', () => r.destroy(new Error(`응답 없음 (${timeout}ms)`)));
                    r.on('error', (e) => resolve({ ok: false, status: null, body: null, error: `${e.code || ''} ${e.message}`.trim() }));
                  });
                  return (async () => {
                    let last = null;
                    for (let i = 1; i <= tries; i += 1) {
                      last = await once();
                      last.시도 = i;
                      if (last.ok) return last;
                      if (i < tries) await new Promise((r) => setTimeout(r, gap));
                    }
                    return last;
                  })();
                },
                // ==========================================
                // [2026-11-17] CRM(.27) 페이지 요청 — 로그인(선택) 후 path 를 GET/POST 하고 상태 · 본문 일부를 돌려줌
                //   검출 데이터 생성(dlp_tester.jsp) 확인 · 자동화용. 비밀번호는 config.env.CRM27_PW 에서 직접 읽음 (로그 · 반환값에 넣지 않음)
                //   인자 : { userId(없으면 로그인 안 함), path, method='GET', form(객체, POST 본문), maxBody=200000, headers(추가 요청 헤더 — 2026-11-19 복합 메뉴 키 확인용) }
                //   반환 : { ok, login, status, length, body, error }
                // ==========================================
                crmFetch({ userId, path, method = 'GET', form = null, maxBody = 200000, headers: extra = {} }) {
                  const http = require('http');
                  const querystring = require('querystring');
                  const send = (opts, body) => new Promise((resolve, reject) => {
                    const r = http.request({ host: '10.10.54.27', port: 80, timeout: 30000, ...opts }, (res) => {
                      const chunks = [];
                      res.on('data', (c) => chunks.push(c));
                      res.on('end', () => resolve({ status: res.statusCode, cookies: (res.headers['set-cookie'] || []).map((c) => c.split(';')[0]), body: Buffer.concat(chunks).toString('utf8') }));
                    });
                    r.on('timeout', () => r.destroy(new Error('응답 없음 (30초)')));
                    r.on('error', reject);
                    if (body) r.write(body);
                    r.end();
                  });
                  return (async () => {
                    try {
                      let cookie = '';
                      let login = null;
                      if (userId) {
                        const lb = querystring.stringify({ empId: userId, empPw: config.env.CRM27_PW || '' });
                        const l = await send({ method: 'POST', path: '/crm/login.jsp', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(lb) } }, lb);
                        login = l.status;
                        cookie = l.cookies.join('; ');
                      }
                      const fb = form ? querystring.stringify(form) : null;
                      const headers = { ...extra, ...(cookie ? { Cookie: cookie } : {}), ...(fb ? { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(fb) } : {}) };
                      const r = await send({ method, path, headers }, fb);
                      return { ok: r.status === 200, login, status: r.status, length: r.body.length, body: r.body.slice(0, maxBody), error: null };
                    } catch (e) {
                      return { ok: false, login: null, status: null, length: 0, body: '', error: `${e.code || ''} ${e.message}`.trim() };
                    }
                  })();
                }
                // ==========================================

      }); // task 블록 종료

      // 🌟 TARGET_HOST에 맞춰 baseUrl 설정
      config.baseUrl = `https://${TARGET_HOST}:18443`;

      return config;
    },
  },
});