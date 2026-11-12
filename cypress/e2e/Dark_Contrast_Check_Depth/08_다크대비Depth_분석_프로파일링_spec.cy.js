// =====================================================================
// 다크 모드 대비 자동 검사 (Depth — 분석_프로파일링)
//   기존 Depth_functions_check/08_Depth_분석_프로파일링_spec.cy.js 를 그대로 실행하면서 대비·밝은 바탕을 검사해 기록
//   결과 : cypress/reports/contrast/contrast-YYYYMMDD.ndjson
// =====================================================================
import '../../support/contrast-auto';
import '../Depth_functions_check/08_Depth_분석_프로파일링_spec.cy.js';
