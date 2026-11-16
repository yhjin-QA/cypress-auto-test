// ==========================================================================
// [2.9.7 신규] 07_1_Depth_보관_운영이력보관_압축 — 실제 압축 1회 후 설정 원복 (.21 전용 · 매일 반복)
//   운영가이드 7.3 운영이력 보관 기준
//     - 압축(최대 비율) 활성 → 압축 일자가 지난 운영 이력(tbh_opr_work)을 일 단위로 <백업 경로>/work-history/tbh_opr_work_<YYYYMMDD>.csv.gz 로 보관
//     - 실제 압축은 [보관 > 접속기록 보관] 백업 작업(eBackup) 때 함께 처리 → 「이력 보기」 > 오늘 「백업」 으로 수동 실행
//     - 압축이 끝나면 화면에 「마지막 압축 일자」 표시
//   [안전] 운영이력 보관(삭제) 스위치는 꺼진 상태에서만 실행 — 켜져 있으면 바로 실패(삭제가 일어날 수 있어서)
//          압축 일자 300일 : 300일보다 오래된 이력만 대상. 첫 실행은 그동안의 날짜 파일이 한꺼번에 생기고, 이후에는 하루 1개 안팎
//          끝나면 압축 스위치 · 압축 일자를 처음 값으로 되돌림 (after 에서도 한 번 더)
//   서버 확인 : SSH (cy.task runSSH, .21)
//   .21 은 중복 로그인을 막으므로 다른 자동화와 동시에 실행하지 않음 · 백업을 실제로 1회 돌림
// ==========================================================================
const A = require('../../support/anomaly');

const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const obs = {};
const note = (k, v) => {
  obs[k] = v;
  cy.log(`📝 ${k}: ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 300)}`);
  cy.writeFile('cypress/probe/D07Z_관찰.json', obs, { log: false });
};

const ZIP_DAYS = 300;
const KEEP = 'input[aria-label="보관일자(일)"]';
const ZIP = 'input[aria-label="압축 일자(일)"]';
const SW = 'input[aria-label="활성/비활성"]';
const SAVE_URL = '**/logcatch/common/com06/work-history-backup';
let S0 = null;

const ymd = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
const ssh = (cmd) => cy.task('runSSH', cmd, { timeout: 60000, log: false }).then((r) => String(r == null ? '' : (typeof r === 'object' ? (r.stdout || '') : r)).trim());

const open = () => {
  cy.visit('/logcatch/backup/workHistory');
  cy.wait(3000);
  cy.get(KEEP, { timeout: 15000 }).filter(':visible').should('be.visible');
  cy.wait(1000);
};
const state = () => cy.get('body').then(($b) => {
  const sw = $b.find(SW).toArray().map((e) => e.getAttribute('aria-checked'));
  const v = (s) => { const e = $b.find(s).filter((i, x) => shown(x))[0]; return e ? String(e.value) : null; };
  const txt = t($b.find('.v-content__wrap').filter((i, e) => shown(e)).last()[0] || $b[0]);
  const last = (txt.match(/마지막 압축 일자[^0-9]{0,20}(\d{4}[-.]?\d{2}[-.]?\d{2})/) || [])[1] || v('input[aria-label="마지막 압축 일자"]') || null;
  return cy.wrap({ 운영이력활성: sw[0], 압축활성: sw[1], 보관일자: v(KEEP), 압축일자: v(ZIP), 경로: v('input[aria-label="압축 보관 경로"]'), 마지막압축일자: last }, { log: false });
});
const setSwitch = (idx, on) => cy.get(SW).eq(idx).then(($i) => {
  if (($i.attr('aria-checked') === 'true') !== on) {
    cy.wrap($i).click({ force: true });
    cy.wait(600);
  }
  cy.get(SW).eq(idx).should('have.attr', 'aria-checked', String(on));
});
const put = (sel, val) => {
  cy.get(sel).filter(':visible').first().clear({ force: true }).type(String(val), { force: true }).blur({ force: true });
  cy.wait(800);
};
const save = (k) => {
  cy.intercept('POST', SAVE_URL).as(`save_${k}`);
  cy.get('.v-btn__content').filter((i, e) => shown(e) && t(e) === '저장').last().click({ force: true });
  return cy.wait(`@save_${k}`, { timeout: 30000 }).then((x) => {
    cy.wait(1200);
    cy.get('body').then(($b) => {
      const snack = $b.find('.v-snack__content').filter((i, e) => shown(e)).toArray().map(t).filter(Boolean);
      const $d = $b.find('.v-dialog--active').filter((i, e) => shown(e)).last();
      if ($d.length) { cy.wrap($d.find('button, .v-btn').filter((i, e) => shown(e) && /^(확인|닫기)$/.test(t(e))).last()).click({ force: true }); cy.wait(800); }
      note(`D07Z_저장_${k}`, { 상태: x.response && x.response.statusCode, 응답: x.response && x.response.body, 보낸값: x.request.body, 안내: snack, 창: $d.length ? t($d[0]).slice(0, 150) : null });
      expect(x.response && x.response.statusCode, `${k} 저장 응답`).to.be.within(200, 299);
      expect(snack.join(' '), `${k} 저장 안내`).not.to.match(/실패|오류/);
    });
    return cy.wrap(x.request.body, { log: false });
  });
};

// 접속기록 보관 : 백업 경로 읽기 · 수동 백업 (07_Depth_보관_접속기록보관_v1 과 같은 방법)
const backupPath = () => {
  cy.visit('/logcatch/backup/accessLogs');
  cy.wait(4000);
  return cy.get('input[aria-label="백업 경로"]', { timeout: 15000 }).invoke('val').then((v) => cy.wrap(String(v || '').replace(/\/+$/, ''), { log: false }));
};
const runBackup = () => {
  cy.visit('/logcatch/backup/accessLogs');
  cy.wait(4000);
  cy.contains('.v-btn__content', '이력 보기').click({ force: true });
  cy.wait(2000);
  cy.get('.v-calendar-weekly__day-label.pink--text').closest('.v-calendar-weekly__day').contains('button', /백업/).should('be.visible').click({ force: true });
  cy.wait(1500);
  cy.get('body').then(($b) => {
    const $c = $b.find('.v-card').filter((i, e) => shown(e) && /백업 요청/.test(t(e))).last();
    note('D07Z_백업요청창', $c.length ? t($c[0]).slice(0, 150) : '(창 없음)');
    if ($c.length) cy.wrap($c.find('button').filter((i, e) => t(e) === '확인').last()).click({ force: true });
  });
  cy.wait(2000);
  cy.get('body').then(($b) => {
    $b.find('.v-dialog__content--active, .v-overlay--active').remove();
  });
};

const restore = () => {
  if (!S0) return;
  open();
  state().then((s) => {
    if (s.압축활성 === S0.압축활성 && s.압축일자 === S0.압축일자 && s.운영이력활성 === S0.운영이력활성) { note('D07Z_원복', '이미 처음 값'); return; }
    setSwitch(1, S0.압축활성 === 'true');
    put(ZIP, S0.압축일자);
    save('원복');
    open();
    state().then((s2) => {
      note('D07Z_원복후', s2);
      ['운영이력활성', '압축활성', '보관일자', '압축일자', '경로'].forEach((k) => expect(s2[k], `원복 ${k}`).to.eq(S0[k]));
    });
  });
};

describe('07_1_Depth_보관_운영이력보관_압축', () => {
  A.ignoreErrors();
  beforeEach(() => { A.loginAdmin(); });
  after(() => { restore(); });

  it(`운영이력 압축 — 압축 일자 ${ZIP_DAYS}일 · 수동 백업 → work-history csv.gz · 마지막 압축 일자 → 원복`, { retries: 0 }, () => {
    // ---- 1. 처음 값 · 안전 확인 ----
    open();
    state().then((s0) => {
      S0 = s0;
      note('D07Z_처음값', s0);
      expect(s0.운영이력활성, '운영이력 보관(삭제) 스위치는 꺼져 있어야 실행 (켜져 있으면 실제 삭제 위험)').to.eq('false');
      expect(Number(s0.보관일자), `보관일자 ≥ 압축 일자 ${ZIP_DAYS}`).to.be.at.least(ZIP_DAYS);
    });

    // ---- 2. 서버 work-history 처음 상태 ----
    backupPath().then((bp) => {
      note('D07Z_백업경로', bp);
      expect(bp, '백업 경로').to.match(/^\//);
      cy.wrap(`${bp}/work-history`, { log: false }).as('wh');
    });
    cy.get('@wh').then((wh) => ssh(`ls -1 ${wh} 2>/dev/null | grep -c 'tbh_opr_work_' ; ls -1 ${wh} 2>/dev/null | grep 'tbh_opr_work_' | sort | tail -n 3`).then((o) => {
      note('D07Z_압축전_파일', o);
      cy.wrap(parseInt(o.split('\n')[0], 10) || 0, { log: false }).as('n0');
    }));

    // ---- 3. 압축 켜기 · 300일 · 저장 ----
    open();
    setSwitch(1, true);
    put(ZIP, ZIP_DAYS);
    save('압축켜기').then((b) => {
      expect(b.compressUseFlag, '보낸 compressUseFlag').to.eq(true);
      expect(b.compressDay, '보낸 compressDay').to.eq(ZIP_DAYS);
      expect(b.useFlag, '운영이력 보관(삭제)은 꺼진 그대로').to.eq(false);
    });

    // ---- 4. 수동 백업 → work-history 파일 생길 때까지 (최대 5분) ----
    const t0 = Date.now();
    runBackup();
    cy.get('@wh').then((wh) => cy.get('@n0').then((n0) => {
      const poll = (i) => ssh(`ls -1 ${wh} 2>/dev/null | grep -c 'tbh_opr_work_'`).then((o) => {
        const n = parseInt(o, 10) || 0;
        if (n > n0 || i >= 30) {
          note('D07Z_대기', { 처음: n0, 지금: n, 초: Math.round((Date.now() - t0) / 1000) });
          return;
        }
        cy.wait(10000);
        poll(i + 1);
      });
      poll(0);
    }));
    A.dumpScreen('D07Z_1_백업후');

    // ---- 5. 파일 · 마지막 압축 일자 확인 ----
    cy.get('@wh').then((wh) => ssh(`ls -1 ${wh} | grep 'tbh_opr_work_' | sort | tail -n 1`).then((lastFile) => {
      const cut = new Date(); cut.setDate(cut.getDate() - ZIP_DAYS);
      const d = (lastFile.match(/tbh_opr_work_(\d{8})\.csv\.gz$/) || [])[1];
      note('D07Z_최신파일', { 파일: lastFile, 날짜: d, 기준일: ymd(cut) });
      expect(lastFile, '압축 파일 이름 tbh_opr_work_<YYYYMMDD>.csv.gz').to.match(/^tbh_opr_work_\d{8}\.csv\.gz$/);
      expect(Number(d), `최신 압축 파일 날짜 ≤ 오늘 - ${ZIP_DAYS}일`).to.be.at.most(Number(ymd(cut)));
      ssh(`ls -l --time-style=+%F_%T ${wh}/${lastFile} ; zcat ${wh}/${lastFile} | head -n 2 ; zcat ${wh}/${lastFile} | wc -l`).then((o) => {
        note('D07Z_최신파일_내용', o.split('\n').map((l) => l.slice(0, 300)));
        const lines = parseInt(o.split('\n').pop(), 10) || 0;
        expect(lines, '압축 파일 안 줄 수 (머리 포함)').to.be.at.least(1);
      });
      open();
      state().then((s) => {
        note('D07Z_압축후_화면', s);
        expect(s.마지막압축일자, '화면 「마지막 압축 일자」 표시').to.be.a('string');
        expect(Number(s.마지막압축일자.replace(/\D/g, '')), '마지막 압축 일자 ≥ 최신 파일 날짜').to.be.at.least(Number(d));
      });
    }));

    // ---- 6. 원복 ----
    restore();
  });
});
