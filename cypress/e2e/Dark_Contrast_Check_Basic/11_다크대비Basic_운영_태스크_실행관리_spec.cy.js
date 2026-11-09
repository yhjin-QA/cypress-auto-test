// =====================================================================
// 다크 모드 대비 자동 검사 (Basic) — 운영_태스크_실행관리
//   기존 Basic_functions_check/11_Basic_운영_태스크_실행관리_spec.cy.js 를 그대로 실행하면서
//   화면·탭·창(및 로그 뷰 출력)이 처음 나타날 때마다 대비·밝은 바탕을 검사해 기록 (기존 spec 은 수정하지 않음)
//   결과 : cypress/reports/contrast/contrast-YYYYMMDD.ndjson
// =====================================================================
import '../../support/contrast-auto';
import '../Basic_functions_check/11_Basic_운영_태스크_실행관리_spec.cy.js';
