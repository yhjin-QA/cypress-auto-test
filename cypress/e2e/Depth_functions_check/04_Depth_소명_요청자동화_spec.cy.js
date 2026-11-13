// ==========================================================================
// [2.9.7 신규] 04_Depth_소명_요청자동화
//   소명 > 신청 > 소명 요청 자동화 (관리자 전용 — 최고관리자 · 결재 운영 관리자(권한 그룹 Managers))
//   1. 현재 설정값 읽기 (화면 = 설정 API)
//   2. 입력값 규칙 : 범위 밖(0 · 366)은 저장 안 되고 허용 범위 안내 / 소수(2.8)는 정수(2)로 잘려 저장되고 안내
//   3. 값 바꿔 저장 → 다시 들어와도 유지 · 최종 수정 시각 갱신 → 원래 값으로 되돌림
//   4. 지금 실행 → 「발송 완료: N건」 · Mailpit 새 소명 메일 수 = N (엑셀 첨부 설정이면 첨부 있음)
//   5. 권한 없는 사용자(user014) : 탭이 없고, 주소로 들어가도 설정 화면이 열리지 않음 (권한 API canEdit=false)
//   반복 실행 설계
//     - 시작할 때 설정값을 읽어 두고, 끝날 때(실패해도 after) 그 값으로 되돌림
//     - 「자동 소명 요청 사용」 스위치는 건드리지 않음 (.21 은 사용 ON · 매일 10시 자동 발송 중 — 되돌리기 전에 실패하면 자동 발송이 멈춤)
//     - Mailpit(.26) 은 공용 메일함 → 지우지 않고 실행 전 메일 ID 와 비교
//   2.9.7 확인 사항 (probe16·17, 2026-11-12 / 운영가이드 13.7)
//     - 주소 /logcatch/approval/submit/explanation-automation · 설정 카드 .ers-card · 행 .ers-row(.ers-label-main) · 숫자 input.ers-num · 시각 select.ers-hour
//     - API GET /api/v1/approval/explanation-request/schedule → { enabled, thresholdDays, resendIntervalDays, sendHour, attachExcel, updatedAt }
//     - API GET /api/v1/approval/explanation-request/access → { canEdit } (관리자 true · user014/user001 false)
//     - 안내(알림 창) : 범위 밖 「미소명 임계 기간은 1~365일 사이여야 합니다.」 · 「재발송 주기는 1~365일 사이여야 합니다.」
//                      소수 「설정을 저장했습니다. 소수점 이하는 저장되지 않아 정수로 변환되었습니다. · 미소명 임계 기간: 2.8일 → 2일」
//     - 지금 실행 확인창 「현재 설정 기준으로 지금 즉시 소명 요청을 발송하시겠습니까?」 취소/확인
//     - 메일 「[LOGCATCH] 이상행위 소명을 요청드립니다.」 → user014@logcatch.com · 엑셀 첨부 1개 (2026-11-12 발송 1건)
//     - user014 : 탭 없음 · 주소로 들어가면 사이트맵으로 이동
//   비밀번호: cypress.env.json (LC_PW, LC_USER014_PW)
// ==========================================================================
const A = require('../../support/anomaly');
const URL_AUTO = '/logcatch/approval/submit/explanation-automation';
const MAILPIT = 'http://10.10.54.26:8025/api/v1/messages?limit=200';
const L = { enabled: '자동 소명 요청 사용', threshold: '미소명 임계 기간', resend: '재발송 주기', hour: '발송 시각', excel: '이상행위 이력 엑셀 첨부' };

const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
let ORIG = null;      // 시작할 때 읽은 설정 (after 에서 되돌릴 기준)
let schedule = null;  // 마지막으로 받은 설정 API 응답
const p2 = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const mailText = (r) => String((r.body && (r.body.Text || r.body.HTML)) || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
// 자동 소명 요청 메일 본문 · 첨부 검사 (지금 실행 메일 · 오늘 예약 발송 메일 공통)
//   「아래 내용을 확인 후 로그캐치에 접속하여 소명해 주시기 바랍니다.」 · [ 업무 시스템 ] · [ 부서 ] · [ 사용자 ] · [ 발생 기간 ] · [ 정책 위반 사항 ]
//   [ 심각 ] / [ 경계 ] / [ 주의 ] N건 · 「[자동 안내] <임계 기간>일이 경과한 미소명 이상행위가 있어 소명을 요청드립니다.」 · 첨부 이상행위_이력.xlsx
const checkAutoMail = (r, to, tag) => {
  const body = mailText(r);
  const files = ((r.body && r.body.Attachments) || []).map((a) => ({ name: a.FileName, type: a.ContentType, size: a.Size }));
  const sev = ['심각', '경계', '주의'].map((k) => parseInt((body.match(new RegExp(`\\[\\s*${k}\\s*\\]\\s*[:：∶]?\\s*(\\d+)\\s*건`)) || [])[1] || '-1', 10));
  cy.writeFile(`cypress/probe/D04A_4_메일본문_${tag}_${to || 'unknown'}.json`, { to, files, sev, body: body.slice(0, 2000) });
  const user = (to || '').split('@')[0];
  expect(body, '안내 문구').to.include('소명해 주시기 바랍니다');
  ['업무 시스템', '부서', '사용자', '발생 기간', '정책 위반 사항'].forEach((k) => expect(body, `[ ${k} ] 항목`).to.match(new RegExp(`\\[\\s*${k}\\s*\\]`)));
  if (user) expect(body, '[ 사용자 ] 에 받는 사람 계정').to.include(`(${user})`);
  sev.forEach((v, i) => expect(v, `[ ${['심각', '경계', '주의'][i]} ] 건수`).to.be.at.least(0));
  expect(sev.reduce((a, b) => a + b, 0), '위험도별 건수 합').to.be.greaterThan(0);
  expect(body, '자동 안내 문구의 임계 기간').to.include(`${ORIG.thresholdDays}일이 경과한 미소명 이상행위`);
  if (ORIG.attachExcel) expect(files.map((x) => x.name), '첨부 파일').to.include('이상행위_이력.xlsx');
};

// ---- 화면
// [2026-11-12] 화면은 서버 값을 받기 전에 기본값(7일 · 7일 · 9시 · 꺼짐)을 먼저 그림
//   → 설정 API 응답을 받고, 화면 값이 그 응답과 같아질 때까지 기다린 뒤 읽음
const go = () => {
  cy.then(() => { schedule = null; });
  cy.visit(URL_AUTO);
  cy.get('.ers-card', { timeout: 15000 }).should('contain', '자동 발송 설정');
  cy.wrap(null, { timeout: 15000 }).should(() => expect(schedule, '설정 API 응답').to.not.be.null);
  cy.get('.v-content__wrap', { timeout: 15000 }).should(($w) => {
    const rowOf = (label) => $w.find('.ers-row').toArray().find((e) => t(e.querySelector('.ers-label-main')) === label);
    const v = (label) => rowOf(label).querySelector('input.ers-num, select.ers-num').value;
    const sw = (label) => rowOf(label).querySelector('input[role="checkbox"]').getAttribute('aria-checked') === 'true';
    expect(v(L.threshold), '화면 임계 기간 = 서버').to.eq(String(schedule.thresholdDays));
    expect(v(L.resend), '화면 재발송 주기 = 서버').to.eq(String(schedule.resendIntervalDays));
    expect(v(L.hour), '화면 발송 시각 = 서버').to.eq(String(schedule.sendHour));
    expect(sw(L.enabled), '화면 사용 여부 = 서버').to.eq(!!schedule.enabled);
    expect(sw(L.excel), '화면 엑셀 첨부 = 서버').to.eq(!!schedule.attachExcel);
  });
};
const row = (label) => cy.get('.ers-row').filter((i, e) => t(e.querySelector('.ers-label-main')) === label).first();
const readUI = () => cy.get('.v-content__wrap').then(($w) => {
  const rowOf = (label) => $w.find('.ers-row').toArray().find((e) => t(e.querySelector('.ers-label-main')) === label);
  const sw = (label) => rowOf(label).querySelector('input[role="checkbox"]').getAttribute('aria-checked') === 'true';
  const n = (label) => rowOf(label).querySelector('input.ers-num, select.ers-num').value;
  const upd = (t($w[0]).match(/최종 수정\s*:?\s*(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/) || [])[1] || null;
  return { enabled: sw(L.enabled), thresholdDays: n(L.threshold), resendIntervalDays: n(L.resend), sendHour: n(L.hour), attachExcel: sw(L.excel), updatedAt: upd };
});
const setNum = (label, v) => row(label).find('input.ers-num').clear({ force: true }).type(String(v), { force: true }).blur({ force: true });
const setHour = (h) => row(L.hour).find('select.ers-hour').select(String(h), { force: true });
const setSwitch = (label, on) => row(label).find('input[role="checkbox"]').invoke('attr', 'aria-checked').then((c) => {
  if ((c === 'true') === on) return;
  row(label).find('.v-input--switch__thumb').realClick({ scrollBehavior: 'center' });
  cy.wait(800);
  row(label).find('input[role="checkbox"]').should('have.attr', 'aria-checked', on ? 'true' : 'false');
});
// 저장 → 화면에 뜬 안내 글자 모음 (스낵바 · 알림 · 확인창 · 카드 안 안내)
const MSG_SEL = '.v-snack__content, .v-alert, .v-dialog--active, [role="alert"], [role="status"], [class*="ers-"][class*="msg"], [class*="ers-"][class*="err"], [class*="ers-"][class*="notice"], [class*="ers-"][class*="hint"], [class*="ers-"][class*="result"]';
const messages = () => cy.get('body').then(($b) => $b.find(MSG_SEL).filter((i, e) => shown(e)).toArray().map(t).filter(Boolean).join(' | '));
const save = (name) => {
  cy.get('button, .v-btn').filter((i, e) => shown(e) && /저장$/.test(t(e))).first().click({ force: true });
  cy.wait(2000);
  A.dumpScreen(name);
  return messages().then((m) => {
    cy.log(`💬 ${m || '(안내 없음)'}`);
    cy.writeFile(`cypress/probe/${name}_안내.json`, { message: m });
    // 안내 확인창이 떠 있으면 닫음
    cy.get('body').then(($b) => {
      const $ok = $b.find('.v-dialog--active .v-btn, .v-dialog--active button').filter((i, e) => shown(e) && /^(확인|닫기)$/.test(t(e)));
      if ($ok.length) cy.wrap($ok.last()).click({ force: true });
    });
    return cy.wrap(m);
  });
};
// 원래 값으로 (사용 스위치는 그대로)
const applyOrig = (o) => {
  setNum(L.threshold, o.thresholdDays);
  setNum(L.resend, o.resendIntervalDays);
  setHour(o.sendHour);
  setSwitch(L.excel, o.attachExcel);
};
const same = (a, b) => ['enabled', 'thresholdDays', 'resendIntervalDays', 'sendHour', 'attachExcel'].every((k) => String(a[k]) === String(b[k]));

describe('04_Depth_소명_요청자동화', () => {
  A.ignoreErrors();

  beforeEach(() => {
    cy.intercept({ url: /\/api\/v1\/approval\/explanation-request\/schedule/ }, (req) => {
      req.continue((res) => { if (req.method === 'GET' && res.body && res.body.etcData) schedule = res.body.etcData; });
    });
  });

  after(() => {
    if (!ORIG) return;
    cy.log('🧹 소명 요청 자동화 설정 원래대로');
    A.loginAdmin();
    go();
    readUI().then((now) => {
      if (same(now, ORIG)) { cy.log('설정이 이미 원래 값'); return; }
      applyOrig(ORIG);
      save('D04A_9_되돌림');
      go();
      readUI().then((back) => expect(same(back, ORIG), `설정 원래대로 (${JSON.stringify(back)})`).to.be.true);
    });
  });

  it('관리자 설정 · 입력값 규칙 · 지금 실행(메일) · 권한 없는 사용자', { retries: 0 }, () => {
    // ---------- 1. 현재 설정값 (화면 = API) ----------
    A.loginAdmin();
    go();
    A.dumpScreen('D04A_1_설정');
    readUI().then((ui) => {
      cy.then(() => {
        cy.writeFile('cypress/probe/D04A_1_원래설정.json', { ui, api: schedule });
        expect(ui.enabled, '화면 사용 여부 = API').to.eq(!!schedule.enabled);
        expect(Number(ui.thresholdDays), '화면 임계 기간 = API').to.eq(schedule.thresholdDays);
        expect(Number(ui.resendIntervalDays), '화면 재발송 주기 = API').to.eq(schedule.resendIntervalDays);
        expect(Number(ui.sendHour), '화면 발송 시각 = API').to.eq(schedule.sendHour);
        expect(ui.attachExcel, '화면 엑셀 첨부 = API').to.eq(!!schedule.attachExcel);
        expect(ui.updatedAt, '화면 최종 수정 = API').to.eq(schedule.updatedAt);
        ORIG = ui;
        cy.log(`원래 설정 : 사용 ${ui.enabled} · 임계 ${ui.thresholdDays}일 · 재발송 ${ui.resendIntervalDays}일 · ${ui.sendHour}시 · 엑셀 ${ui.attachExcel}`);
      });
    });

    // ---------- 2. 입력값 규칙 ----------
    // 2-1 범위 밖 (0 · 366) → 저장 안 됨 + 허용 범위 안내
    [[L.threshold, 0, 'thresholdDays'], [L.resend, 366, 'resendIntervalDays']].forEach(([label, bad, key], i) => {
      go();
      setNum(label, bad);
      save(`D04A_2_${i + 1}_범위밖_${bad}`).then((m) => expect(m, `${label} ${bad} 저장 시 허용 범위 안내`).to.match(/1\s*[~∼-]\s*365|365/));
      go();
      readUI().then((now) => expect(now[key], `${label} ${bad} 은 저장되지 않음`).to.eq(ORIG[key]));
    });
    // 2-2 소수 2.8 → 2 로 잘려 저장 + 잘렸다는 안내
    go();
    setNum(L.threshold, '2.8');
    save('D04A_2_3_소수').then((m) => expect(m, '소수 입력 시 정수로 잘렸다는 안내').to.match(/잘|정수/));
    go();
    readUI().then((now) => expect(now.thresholdDays, '2.8 → 저장된 값').to.eq('2'));

    // ---------- 3. 값 바꿔 저장 → 유지 · 최종 수정 갱신 → 되돌림 ----------
    cy.then(() => {
      const o = ORIG;
      const want = { thresholdDays: o.thresholdDays === '3' ? '4' : '3', resendIntervalDays: o.resendIntervalDays === '3' ? '4' : '3',
        sendHour: String((Number(o.sendHour) + 1) % 24), attachExcel: !o.attachExcel };
      go();
      readUI().as('beforeChange');
      setNum(L.threshold, want.thresholdDays);
      setNum(L.resend, want.resendIntervalDays);
      setHour(want.sendHour);
      setSwitch(L.excel, want.attachExcel);
      save('D04A_3_변경저장');
      go();
      readUI().then((now) => {
        cy.writeFile('cypress/probe/D04A_3_변경후.json', { want, now });
        expect(now.thresholdDays, '임계 기간 유지').to.eq(want.thresholdDays);
        expect(now.resendIntervalDays, '재발송 주기 유지').to.eq(want.resendIntervalDays);
        expect(now.sendHour, '발송 시각 유지').to.eq(want.sendHour);
        expect(now.attachExcel, '엑셀 첨부 유지').to.eq(want.attachExcel);
        expect(now.enabled, '사용 여부는 그대로').to.eq(o.enabled);
        cy.get('@beforeChange').then((b) => expect(now.updatedAt > (b.updatedAt || ''), `최종 수정 갱신 (${b.updatedAt} → ${now.updatedAt})`).to.be.true);
      });
      // 원래 값으로
      applyOrig(o);
      save('D04A_3_되돌림');
      go();
      readUI().then((back) => expect(same(back, o), `원래 설정으로 (${JSON.stringify(back)})`).to.be.true);
    });

    // ---------- 4. 지금 실행 → 발송 완료 N건 = Mailpit 새 소명 메일 수 ----------
    cy.request({ url: MAILPIT, failOnStatusCode: false }).then((res) => cy.wrap(((res.body && res.body.messages) || []).map((m) => m.ID)).as('mailBefore'));
    cy.get('button, .v-btn').filter((i, e) => shown(e) && /지금 실행$/.test(t(e))).first().click({ force: true });
    cy.wait(1500);
    A.dumpScreen('D04A_4_지금실행_확인창');
    // 확인창이 뜨면 진행 버튼(확인 · 예 · 실행 · 발송)
    cy.get('body').then(($b) => {
      const $go = $b.find('.v-dialog--active .v-btn, .v-dialog--active button').filter((i, e) => shown(e) && /^(확인|예|실행|지금 실행|발송)$/.test(t(e)));
      if ($go.length) cy.wrap($go.last()).click({ force: true });
    });
    cy.wait(3000);
    A.dumpScreen('D04A_4_지금실행');
    cy.get('body', { timeout: 30000 }).should(($b) => expect(t($b[0]), '지금 실행 결과').to.match(/발송 완료\s*:?\s*\d+\s*건/));
    cy.get('body').then(($b) => {
      const n = parseInt((t($b[0]).match(/발송 완료\s*:?\s*(\d+)\s*건/) || [])[1], 10);
      cy.log(`📨 지금 실행 : 발송 완료 ${n}건`);
      cy.get('@mailBefore').then((before) => {
        const poll = (left) => cy.request({ url: MAILPIT, failOnStatusCode: false }).then((res) => {
          const fresh = ((res.body && res.body.messages) || []).filter((m) => !before.includes(m.ID) && /소명/.test(m.Subject || ''));
          if (fresh.length < n && left > 0) { cy.wait(5000); poll(left - 1); return; }
          const list = fresh.map((m) => ({ id: m.ID, subject: m.Subject, to: (m.To || []).map((x) => x.Address), attachments: m.Attachments, created: m.Created }));
          cy.writeFile('cypress/probe/D04A_4_새메일.json', { sent: n, mails: list });
          expect(fresh.length, `Mailpit 새 소명 메일 수 = 발송 완료 ${n}건`).to.eq(n);
          if (n > 0 && ORIG.attachExcel) list.forEach((m) => expect(m.attachments, `「${m.subject}」 엑셀 첨부`).to.be.greaterThan(0));
          // 메일 본문 · 첨부 (checkAutoMail)
          list.forEach((m) => {
            cy.request({ url: `http://10.10.54.26:8025/api/v1/message/${m.id}`, failOnStatusCode: false }).then((r) => checkAutoMail(r, m.to[0], '지금실행'));
          });
          // [2026-11-12] 재발송 주기(1일) 안이면 지금 실행은 0건 (매일 sendHour 시 예약 발송 · 수동 소명 요청 뒤에는 늘 0건)
          //   → 0건이면 Mailpit 에서 오늘 온 자동 소명 요청 메일(「N일이 경과한 미소명 이상행위」)을 찾아 같은 본문 검사
          if (n === 0) {
            const today = ymd(new Date());
            const cands = ((res.body && res.body.messages) || []).filter((m) => /소명/.test(m.Subject || '') && m.Created && ymd(new Date(m.Created)) === today).slice(0, 10);
            const pick = (k) => {
              if (k >= cands.length) {
                cy.writeFile('cypress/probe/D04A_4_오늘자동메일.json', { today, 후보: cands.length, 결과: '오늘 자동 발송 메일 없음 — 본문 검사 건너뜀' });
                cy.log('⏭️ 오늘 자동 발송 메일이 없어 본문 검사 건너뜀');
                return;
              }
              const m = cands[k];
              cy.request({ url: `http://10.10.54.26:8025/api/v1/message/${m.ID}`, failOnStatusCode: false }).then((r) => {
                if (!/일이 경과한 미소명 이상행위/.test(mailText(r))) { pick(k + 1); return; }
                const to = ((m.To || [])[0] || {}).Address;
                cy.writeFile('cypress/probe/D04A_4_오늘자동메일.json', { today, id: m.ID, subject: m.Subject, to, created: m.Created });
                cy.log(`📨 지금 실행 0건 → 오늘 자동 발송 메일로 본문 확인 (${to} · ${m.Created})`);
                checkAutoMail(r, to, '오늘자동');
              });
            };
            pick(0);
          }
        });
        poll(6);
      });
    });

    // ---------- 5. 권한 없는 사용자(user014) : 탭 없음 · 주소로도 설정 화면 안 열림 ----------
    let access = null;
    cy.intercept({ url: /\/api\/v1\/approval\/explanation-request\/access/ }, (req) => {
      req.continue((res) => { access = res.body && res.body.etcData; });
    });
    A.login('user014', Cypress.env('LC_USER014_PW'));
    cy.visit('/logcatch/approval/submit/anomaly-alerts');
    cy.wait(4000);
    cy.wrap(null, { timeout: 10000 }).should(() => expect(access && access.canEdit, 'user014 설정 권한(canEdit)').to.eq(false));
    cy.get('body').then(($b) => expect($b.find('.v-btn__content, button').filter((i, e) => shown(e) && t(e) === '소명 요청 자동화').length, 'user014 화면의 「소명 요청 자동화」 탭').to.eq(0));
    cy.visit(URL_AUTO);
    cy.wait(4000);
    A.dumpScreen('D04A_5_user014_주소접근');
    cy.get('body').then(($b) => {
      const opened = $b.find('.ers-card').filter((i, e) => shown(e)).length > 0;
      const $save = $b.find('button, .v-btn').filter((i, e) => shown(e) && /저장$/.test(t(e)));
      if (!opened) { cy.log('✅ 설정 화면이 열리지 않음 (다른 화면으로 이동)'); return; }
      // 화면이 열리는 경우(가이드 : 흐린 화면 + 이유 표시) → 저장을 눌러도 저장되지 않아야 함
      cy.log('ℹ️ 설정 화면이 열림 — 저장이 막히는지 확인');
      if ($save.length) cy.wrap($save.first()).click({ force: true });
      cy.wait(1500);
      A.dumpScreen('D04A_5_user014_저장클릭');
    });
    // 관리자 설정은 그대로
    A.loginAdmin();
    go();
    readUI().then((now) => expect(same(now, ORIG), `user014 접근 후 관리자 설정 그대로 (${JSON.stringify(now)})`).to.be.true);
  });
});
