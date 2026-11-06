// =====================================================================
// 다크 모드 대비 자동 검사 — 관리자페이지 관리
//   기존 UI_Module_GitLab_Check/13_Dev_관리자페이지 관리_spec.cy.js 를 그대로 실행하면서,
//   화면·탭·창이 처음 나타날 때마다 대비를 검사해 기록합니다. (기존 spec 은 수정하지 않음)
//   결과 : cypress/reports/contrast/contrast-YYYYMMDD.ndjson
// =====================================================================
import '../../support/contrast-auto';
import '../UI_Module_GitLab_Check/13_Dev_관리자페이지 관리_spec.cy.js';
