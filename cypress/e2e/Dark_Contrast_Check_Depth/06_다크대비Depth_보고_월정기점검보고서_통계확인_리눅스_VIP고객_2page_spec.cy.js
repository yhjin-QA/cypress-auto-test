// =====================================================================
// 다크 모드 대비 자동 검사 (Depth — 보고_월정기점검보고서_통계확인_리눅스_VIP고객_2page)
//   기존 Depth_functions_check/06_Depth_보고_월정기점검보고서_통계확인_리눅스_VIP고객_2page_spec.cy.js 를 그대로 실행하면서
//   화면·탭·창(및 로그 뷰 출력)이 처음 나타날 때마다 대비·밝은 바탕을 검사해 기록 (기존 spec 은 수정하지 않음)
//   결과 : cypress/reports/contrast/contrast-YYYYMMDD.ndjson
// =====================================================================
import '../../support/contrast-auto';
import '../Depth_functions_check/06_Depth_보고_월정기점검보고서_통계확인_리눅스_VIP고객_2page_spec.cy.js';
