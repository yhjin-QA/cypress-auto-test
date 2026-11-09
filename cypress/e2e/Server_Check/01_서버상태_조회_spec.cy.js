// =====================================================================
// 서버 상태 조회 (읽기 전용) — 업데이트 전·후 비교용
//   cypress.local.config.js 의 runSSH 태스크로 명령을 실행하고
//   결과를 cypress/results/server-<서버>-<단계>-<시각>.txt 로 저장합니다.
//   ※ 조회 명령만 실행합니다. (설정 변경 · 재기동 · 삭제 없음)
//
//   실행 예) 업데이트 전
//   npx cypress run --config-file cypress.local.config.js ^
//     --spec "cypress/e2e/Server_Check/01_서버상태_조회_spec.cy.js" ^
//     --env TARGET_HOST=10.10.54.51,STAGE=before
//   업데이트 후 : STAGE=after
// =====================================================================
const HOST = Cypress.env('TARGET_HOST') || '10.10.54.51';
const STAGE = Cypress.env('STAGE') || 'check';

const CMDS = [
  ['호스트 / 시각', 'hostname; date "+%F %T"; uptime'],
  ['설치 버전 파일', 'ls -l --time-style=+%F_%T /home/logcatch 2>/dev/null | head -40; for f in $(find /home/logcatch -maxdepth 2 -iname "*version*" -type f 2>/dev/null | head -10); do echo "== $f"; head -5 "$f"; done'],
  ['pscheck', 'bash -lc "pscheck" 2>&1 || su - logcatch -c "pscheck" 2>&1'],
  ['logcatch 프로세스', 'ps -eo pid,user,lstart,cmd | grep -i -E "logcatch|logserver|java" | grep -v grep | cut -c1-220'],
  ['proc 폴더', 'ls -l --time-style=+%F_%T /home/logcatch/proc 2>&1'],
  ['bin 폴더 (수정 시각)', 'ls -l --time-style=+%F_%T /home/logcatch/bin 2>&1'],
  ['로그서버 실행 래퍼 앞부분', 'sed -n 1,80p /home/logcatch/bin/logcatch_logserver 2>&1'],
  ['최근 1일 안에 바뀐 bin·conf 파일', 'find /home/logcatch/bin /home/logcatch/conf -type f -mtime -1 -printf "%TF %TT %p\n" 2>/dev/null | sort | tail -40'],
  ['버전 폴더 · 패치 이력', 'ls -l --time-style=+%F_%T /home/logcatch/bin/version; for f in /home/logcatch/bin/version/*; do echo "== $f"; head -20 "$f"; done; echo "== .patch_history (끝 30줄)"; tail -30 /home/logcatch/conf/.patch_history 2>&1'],
  ['jar · war 버전', 'ls -l --time-style=+%F_%T /home/logcatch/task/lib 2>/dev/null | grep -i -E "logcatch-.*\\.jar"; find /home/logcatch/manager /home/logcatch/taskmgr -maxdepth 4 \\( -name "*.war" -o -name "logcatch*.jar" \\) -printf "%TF %TT %s %p\\n" 2>/dev/null | head -20'],
  ['로그서버 래퍼 · 스크립트 지문(md5)', 'cd /home/logcatch/bin && md5sum logcatch_logserver* logserver.sh* 2>&1'],
  ['프로필(/etc/profile.d/logcatch.sh) 문법 · 끝부분', 'ls -l --time-style=+%F_%T /etc/profile.d/ | grep -i logcatch; wc -l /etc/profile.d/logcatch.sh; echo "== bash -n"; bash -n /etc/profile.d/logcatch.sh 2>&1 && echo SYNTAX_OK; echo "== CR 포함 줄 수"; grep -c $(printf "\\r") /etc/profile.d/logcatch.sh; echo "== if/fi · do/done 개수"; grep -c -E "^[[:space:]]*if[[:space:]]" /etc/profile.d/logcatch.sh; grep -c -E "^[[:space:]]*fi([[:space:]]|;|$)" /etc/profile.d/logcatch.sh; echo "== 끝 60줄"; tail -60 /etc/profile.d/logcatch.sh | cat -A | cut -c1-200'],
  ['디스크', 'df -h | grep -v tmpfs'],
];

describe(`서버 상태 조회 — ${HOST} (${STAGE})`, () => {
  it('조회 명령 실행 후 파일 저장', () => {
    const out = [];
    const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 13); // UTC
    cy.wrap(CMDS).each(([title, cmd]) => {
      cy.task('runSSH', { host: HOST, command: cmd }, { timeout: 60000 }).then((res) => {
        out.push(`########## ${title}\n$ ${cmd}\n${res == null ? '(접속 실패 또는 출력 없음)' : res}\n`);
      });
    }).then(() => {
      const file = `cypress/results/server-${HOST.split('.').pop()}-${STAGE}-${stamp}.txt`;
      cy.writeFile(file, `# ${HOST} / ${STAGE}\n\n${out.join('\n')}`);
      cy.log(`📄 저장: ${file}`);
    });
  });
});
