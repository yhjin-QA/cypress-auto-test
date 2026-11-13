// =====================================================================
// 다크 모드 대비 자동 검사 (Depth — 자산_개인정보탐색)
//   기존 Depth_functions_check/05_Depth_자산_개인정보탐색_spec.cy.js 를 그대로 실행하면서
//   화면·탭·창이 처음 나타날 때마다 대비·밝은 바탕을 검사해 기록 (기존 spec 은 수정하지 않음)
//   ※ 원본과 같이 실제 탐색 1회 실행 · 임시 정책/플랜 생성 후 삭제 (.26 은 읽기만)
//   결과 : cypress/reports/contrast/contrast-YYYYMMDD.ndjson
// =====================================================================
import '../../support/contrast-auto';
import '../Depth_functions_check/05_Depth_자산_개인정보탐색_spec.cy.js';
