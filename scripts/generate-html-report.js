#!/usr/bin/env node
/**
 * generate-html-report.js
 * mochawesome JSON 파일들을 읽어 자체 완결(self-contained) HTML 리포트를 생성합니다.
 *
 * 사용법:
 *   node scripts/generate-html-report.js [reportDir] [outputFile]
 *
 * 기본값:
 *   reportDir  = cypress/reports/json_logs
 *   outputFile = cypress/reports/test-report.html
 *
 * GitHub Actions notify-result Job 예시:
 *   - name: Generate HTML Report
 *     run: node scripts/generate-html-report.js
 */

const fs   = require('fs');
const path = require('path');

// ── 인자 처리 ─────────────────────────────────────────────────
const reportDir  = process.argv[2] || path.join('cypress', 'reports', 'json_logs');
const outputFile = process.argv[3] || path.join('cypress', 'reports', 'test-report.html');

// ── JSON 파일 수집 ─────────────────────────────────────────────
if (!fs.existsSync(reportDir)) {
  console.error(`❌ 리포트 디렉토리 없음: ${reportDir}`);
  process.exit(1);
}

const jsonFiles = fs.readdirSync(reportDir)
  .filter(f => f.endsWith('.json'))
  .map(f => path.join(reportDir, f));

if (jsonFiles.length === 0) {
  console.error(`❌ JSON 파일 없음: ${reportDir}`);
  process.exit(1);
}

// ── JSON 병합 ──────────────────────────────────────────────────
let totalStats = { suites: 0, tests: 0, passes: 0, failures: 0, pending: 0, duration: 0 };
let allSuites  = [];
let failedTests = [];
let startTime = null;

for (const file of jsonFiles) {
  try {
    const raw  = fs.readFileSync(file, 'utf8');
    const data = JSON.parse(raw);
    const s    = data.stats || {};

    totalStats.suites   += s.suites   || 0;
    totalStats.tests    += s.tests    || 0;
    totalStats.passes   += s.passes   || 0;
    totalStats.failures += s.failures || 0;
    totalStats.pending  += s.pending  || 0;
    totalStats.duration += s.duration || 0;

    if (s.start && (!startTime || new Date(s.start) < new Date(startTime))) {
      startTime = s.start;
    }

    // 실패 테스트 수집
    function collectFailed(suites, filePath) {
      for (const suite of (suites || [])) {
        for (const test of (suite.tests || [])) {
          if (test.fail) {
            failedTests.push({
              file:  filePath,
              suite: suite.title || '',
              title: test.title  || '',
              error: (test.err && test.err.message) ? test.err.message.substring(0, 200) : '',
            });
          }
        }
        collectFailed(suite.suites, filePath);
      }
    }
    collectFailed(data.results, path.basename(file));
    allSuites.push(...(data.results || []));

  } catch (e) {
    console.warn(`⚠️  JSON 파싱 실패: ${file} — ${e.message}`);
  }
}

// ── 계산 ──────────────────────────────────────────────────────
const passRate   = totalStats.tests > 0
  ? ((totalStats.passes / totalStats.tests) * 100).toFixed(1)
  : 0;
const durationSec = (totalStats.duration / 1000).toFixed(1);
const runDate     = startTime
  ? new Date(startTime).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
  : new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

const statusColor = totalStats.failures > 0 ? '#E74C3C' : '#27AE60';
const statusText  = totalStats.failures > 0
  ? `❌ FAILED (${totalStats.failures}건 실패)`
  : '✅ ALL PASSED';

// ── 실패 테스트 HTML ──────────────────────────────────────────
const failedHTML = failedTests.length === 0
  ? '<p style="color:#27AE60;font-weight:bold;">✅ 실패한 테스트 없음</p>'
  : failedTests.map(t => `
    <div class="fail-item">
      <div class="fail-title">❌ ${escHtml(t.suite)} › ${escHtml(t.title)}</div>
      <div class="fail-file">📄 ${escHtml(t.file)}</div>
      ${t.error ? `<div class="fail-error">${escHtml(t.error)}</div>` : ''}
    </div>`).join('');

function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// ── 파이 차트 (SVG) ───────────────────────────────────────────
function makePie(pass, fail, pending) {
  const total = pass + fail + pending;
  if (total === 0) return '<p>데이터 없음</p>';
  const r = 70, cx = 90, cy = 90;
  function slice(start, end, color) {
    const s = (start / total) * 2 * Math.PI - Math.PI / 2;
    const e = (end   / total) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    const large = (end - start) / total > 0.5 ? 1 : 0;
    if (end === start) return '';
    return `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z" fill="${color}"/>`;
  }
  const p1 = slice(0, pass, '#27AE60');
  const p2 = slice(pass, pass + fail, '#E74C3C');
  const p3 = slice(pass + fail, total, '#F39C12');
  return `
    <svg width="180" height="180" viewBox="0 0 180 180">
      ${p1}${p2}${p3}
      <circle cx="${cx}" cy="${cy}" r="35" fill="white"/>
      <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="16" font-weight="bold" fill="#333">${passRate}%</text>
      <text x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="9" fill="#666">통과율</text>
    </svg>`;
}

// ── HTML 생성 ──────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>로그캐치 Cypress 테스트 리포트</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; background: #F4F6F9; color: #2C3E50; }
.header { background: linear-gradient(135deg, #1F5C99 0%, #2980B9 100%); color: white; padding: 24px 32px; }
.header h1 { font-size: 22px; margin-bottom: 4px; }
.header .meta { font-size: 13px; opacity: 0.85; }
.status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; margin-top: 10px; background: rgba(255,255,255,0.2); }
.container { max-width: 960px; margin: 24px auto; padding: 0 16px; }
.cards { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
.card { background: white; border-radius: 10px; padding: 16px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.07); }
.card .num { font-size: 28px; font-weight: bold; }
.card .lbl { font-size: 11px; color: #888; margin-top: 4px; }
.card.pass .num  { color: #27AE60; }
.card.fail .num  { color: #E74C3C; }
.card.pend .num  { color: #F39C12; }
.card.total .num { color: #2980B9; }
.card.time .num  { color: #8E44AD; font-size: 20px; }
.section { background: white; border-radius: 10px; padding: 20px 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); }
.section h2 { font-size: 15px; color: #1F5C99; border-bottom: 2px solid #D5E8F0; padding-bottom: 8px; margin-bottom: 16px; }
.chart-row { display: flex; align-items: center; gap: 32px; }
.legend { flex: 1; }
.legend-item { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; }
.legend-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
.fail-item { border-left: 4px solid #E74C3C; padding: 10px 14px; margin-bottom: 10px; background: #FFF5F5; border-radius: 4px; }
.fail-title { font-weight: bold; font-size: 13px; color: #C0392B; margin-bottom: 4px; }
.fail-file  { font-size: 11px; color: #888; margin-bottom: 4px; }
.fail-error { font-size: 11px; color: #555; background: #F9F9F9; padding: 6px; border-radius: 3px; font-family: monospace; white-space: pre-wrap; word-break: break-all; }
.footer { text-align: center; font-size: 11px; color: #AAA; padding: 20px; }
</style>
</head>
<body>
<div class="header">
  <h1>🧪 로그캐치 Cypress 테스트 리포트</h1>
  <div class="meta">실행 시각: ${runDate} &nbsp;|&nbsp; 파일 수: ${jsonFiles.length}개</div>
  <div class="status-badge" style="background:${statusColor};">${statusText}</div>
</div>

<div class="container">
  <!-- 요약 카드 -->
  <div class="cards">
    <div class="card total"><div class="num">${totalStats.tests}</div><div class="lbl">전체 테스트</div></div>
    <div class="card pass"><div class="num">${totalStats.passes}</div><div class="lbl">✅ 통과</div></div>
    <div class="card fail"><div class="num">${totalStats.failures}</div><div class="lbl">❌ 실패</div></div>
    <div class="card pend"><div class="num">${totalStats.pending}</div><div class="lbl">⏳ 보류</div></div>
    <div class="card time"><div class="num">${durationSec}s</div><div class="lbl">⏱ 소요 시간</div></div>
  </div>

  <!-- 차트 -->
  <div class="section">
    <h2>📊 테스트 결과 분포</h2>
    <div class="chart-row">
      ${makePie(totalStats.passes, totalStats.failures, totalStats.pending)}
      <div class="legend">
        <div class="legend-item"><div class="legend-dot" style="background:#27AE60"></div>통과 ${totalStats.passes}건 (${passRate}%)</div>
        <div class="legend-item"><div class="legend-dot" style="background:#E74C3C"></div>실패 ${totalStats.failures}건</div>
        <div class="legend-item"><div class="legend-dot" style="background:#F39C12"></div>보류 ${totalStats.pending}건</div>
        <div class="legend-item"><div class="legend-dot" style="background:#95A5A6"></div>총 ${totalStats.suites}개 스위트</div>
      </div>
    </div>
  </div>

  <!-- 실패 테스트 목록 -->
  <div class="section">
    <h2>❌ 실패 테스트 목록 (${failedTests.length}건)</h2>
    ${failedHTML}
  </div>
</div>

<div class="footer">생성: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} &nbsp;|&nbsp; LogCatch Cypress Auto-PC CI/CD</div>
</body>
</html>`;

// ── 파일 저장 ──────────────────────────────────────────────────
const outDir = path.dirname(outputFile);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outputFile, html, 'utf8');

console.log(`✅ HTML 리포트 생성 완료: ${outputFile}`);
console.log(`   전체: ${totalStats.tests} | 통과: ${totalStats.passes} | 실패: ${totalStats.failures} | 통과율: ${passRate}%`);

// GitHub Actions 출력 변수 설정
if (process.env.GITHUB_OUTPUT) {
  const out = `pass_rate=${passRate}\ntotal=${totalStats.tests}\npasses=${totalStats.passes}\nfailures=${totalStats.failures}\nduration=${durationSec}\n`;
  fs.appendFileSync(process.env.GITHUB_OUTPUT, out);
}
