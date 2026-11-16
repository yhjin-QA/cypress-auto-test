// ==========================================================================
// [2.9.7 신규] 07_1_Depth_보관_운영이력보관_압축확인 — 조회 전용 (설정 · 백업 시간을 바꾸지 않음)
//   .21 운영이력 보관 설정 : 운영이력 보관(삭제) 꺼짐 · 압축(최대 비율) 켜짐 · 압축 일자 30 (2026-11-16 부터 유지)
//   → 매일 11:00 정기 백업이 「오늘 - (압축 일자 + 1)」 날짜 하루치를 압축 (운영가이드 7.3, 2026-11-16 확인)
//      로그 : work-history archived: YYYYMMDD -> <백업 경로>/work-history/tbh_opr_work_YYYYMMDD.csv.gz
//   확인
//   1. 화면 : 삭제 꺼짐 · 압축 켜짐 · 「마지막 압축 일자 : YYYY-MM-DD」 = 기대 날짜 (11:10 이전 실행이면 하루 전)
//   2. 서버 : tbh_opr_work_<기대 날짜>.csv.gz 있음 · 머리 1줄 + 행 수 = DB 의 그날 운영 이력 건수 (원본 삭제 없음)
//   3. 서버 : 정기 백업 로그에 「work-history archived: <기대 날짜>」
//   압축이 꺼져 있으면(설정을 누가 바꿈) 확인을 건너뛰고 기록만 남김
//   정기 백업은 0039024 (restoreDel FileExistsException) 로 「Backup End」 없이 끝나지만 압축은 그 앞 단계라 영향 없음
// ==========================================================================
const A = require('../../support/anomaly');

const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const obs = {};
const note = (k, v) => {
  obs[k] = v;
  cy.log(`📝 ${k}: ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 300)}`);
  cy.writeFile('cypress/probe/D07C_관찰.json', obs, { log: false });
};
const ssh = (cmd) => cy.task('runSSH', cmd, { timeout: 60000, log: false })
  .then((r) => String(r == null ? '' : (typeof r === 'object' ? (r.stdout || '') : r)).trim());
const psql = (sql) => ssh(`su - logcatch -c '. /etc/profile; $PG_HOME/bin/psql -h /tmp -p 15432 -U logcatch -d logcatch -At -c "${sql}"'`);

// KST 날짜 계산 (서버 · 압축 파일 날짜 기준이 KST)
const KST = 9 * 3600 * 1000;
const kstNow = () => new Date(Date.now() + KST); // UTC 필드로 읽으면 KST 값
const ymd = (d) => `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
const dash = (s) => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
// KST 그날 0시 ~ 다음날 0시의 epoch(초)
const dayEpoch = (s) => {
  const start = (Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)) - KST) / 1000;
  return [start, start + 86400];
};

describe('07_1_Depth_보관_운영이력보관_압축확인', () => {
  A.ignoreErrors();
  beforeEach(() => { A.loginAdmin(); });

  it('운영이력 압축 — 오늘 정기 백업이 압축한 하루치 파일 · 마지막 압축 일자 · DB 건수 일치', { retries: 0 }, () => {
    cy.visit('/logcatch/backup/workHistory');
    cy.wait(3000);
    cy.get('input[aria-label="압축 일자(일)"]', { timeout: 15000 }).filter(':visible').should('be.visible');
    cy.wait(1000);

    cy.get('body').then(($b) => {
      const sw = $b.find('input[aria-label="활성/비활성"]').toArray().map((e) => e.getAttribute('aria-checked'));
      const zip = Number(($b.find('input[aria-label="압축 일자(일)"]').filter((i, e) => shown(e))[0] || {}).value);
      const main = $b.find('.v-content__wrap').filter((i, e) => shown(e)).last()[0] || $b[0];
      const last = (t(main).match(/마지막 압축 일자\s*:?\s*(\d{4}-\d{2}-\d{2})/) || [])[1] || null;
      const now = kstNow();
      const before = now.getUTCHours() < 11 || (now.getUTCHours() === 11 && now.getUTCMinutes() < 10);
      const exp = new Date(now.getTime() - (zip + 1 + (before ? 1 : 0)) * 86400000);
      const s = { 삭제: sw[0], 압축: sw[1], 압축일자: zip, 마지막압축일자: last, 기대날짜: ymd(exp), 실행시각KST: now.toISOString().slice(0, 16), 정기백업전: before };
      note('D07C_화면', s);
      cy.wrap(s, { log: false }).as('s');
    });
    A.dumpScreen('D07C_1_화면');

    cy.get('@s').then((s) => {
      if (s.압축 !== 'true') {
        note('D07C_건너뜀', '압축이 꺼져 있어 확인하지 않음 (.21 설정 확인 필요 — 기준: 압축 켜짐 · 30일)');
        return;
      }
      expect(s.삭제, '운영이력 보관(삭제)은 꺼져 있어야 함 (켜져 있으면 실제 삭제)').to.eq('false');
      expect(s.마지막압축일자, '화면 「마지막 압축 일자」 = 기대 날짜').to.eq(dash(s.기대날짜));

      backupPath().then((bp) => {
        const f = `${bp}/work-history/tbh_opr_work_${s.기대날짜}.csv.gz`;
        const [a, b] = dayEpoch(s.기대날짜);
        ssh(`ls -l --time-style=+%F_%T ${f} 2>&1; echo "LINES=$(zcat ${f} 2>/dev/null | wc -l)"; zcat ${f} 2>/dev/null | head -n 1 | cut -c1-200`).then((o) => {
          const lines = Number((o.match(/LINES=(\d+)/) || [])[1] || 0);
          note('D07C_파일', { 파일: f, 출력: o.split('\n').slice(0, 3) });
          expect(o, `압축 파일 있음 : ${f}`).not.to.match(/No such file|cannot access/);
          expect(o, '압축 파일 머리 (id, work_date, …)').to.include('"id","work_date"');
          psql(`select count(*) from logcatch.tbh_opr_work where work_date >= ${a} and work_date < ${b}`).then((c) => {
            const db = Number(c.split('\n').pop());
            note('D07C_건수', { 파일행: lines - 1, DB: db });
            expect(db, `DB 의 ${dash(s.기대날짜)} 운영 이력 (원본 삭제 없음)`).to.be.greaterThan(0);
            expect(lines - 1, '압축 파일 행 수 = DB 건수').to.eq(db);
          });
        });
        const ym = s.기대날짜 && ymd(kstNow()).slice(0, 6);
        ssh(`grep -l "work-history archived: ${s.기대날짜}" /home/logcatch/proc/backup/${ym}/*/log/BACKUP_*.log 2>/dev/null | tail -n 1`).then((o) => {
          note('D07C_백업로그', o || '(없음)');
          expect(o, `정기 백업 로그에 「work-history archived: ${s.기대날짜}」`).to.match(/BACKUP_\d+\.log$/);
        });
      });
    });
  });
});

function backupPath() {
  cy.visit('/logcatch/backup/accessLogs');
  cy.wait(4000);
  return cy.get('input[aria-label="백업 경로"]', { timeout: 15000 }).invoke('val')
    .then((v) => cy.wrap(String(v || '/home/logcatch/backup').replace(/\/+$/, ''), { log: false }));
}
