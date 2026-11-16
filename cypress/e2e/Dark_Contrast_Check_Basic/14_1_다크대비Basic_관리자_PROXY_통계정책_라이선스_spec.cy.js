// =====================================================================
// 다크 모드 대비 자동 검사 (Basic) — 관리자 PROXY · 통계 정책 · 라이선스
//   기존 Basic_functions_check/14_1_Basic_관리자_PROXY_통계정책_라이선스_spec.cy.js 를 그대로 실행하면서
//   화면·탭·창(Proxy 추가 창, 통계 정책 실행 이력 · 수정 창 포함)이 처음 나타날 때마다 대비·밝은 바탕을 검사해 기록 (기존 spec 은 수정하지 않음)
//   결과 : cypress/reports/contrast/contrast-YYYYMMDD.ndjson
// =====================================================================
import '../../support/contrast-auto';
import '../Basic_functions_check/14_1_Basic_관리자_PROXY_통계정책_라이선스_spec.cy.js';
