// =====================================================================
// 다크 모드 대비 자동 검사 (Depth — 검출_개인정보 유형 정의_식별 정규식 정의)
//   기존 Depth_functions_check/10_Depth_검출_개인정보 유형 정의_식별 정규식 정의_spec.cy.js 를 그대로 실행하면서
//   화면·탭·창(및 로그 뷰 출력)이 처음 나타날 때마다 대비·밝은 바탕을 검사해 기록 (기존 spec 은 수정하지 않음)
//   결과 : cypress/reports/contrast/contrast-YYYYMMDD.ndjson
// =====================================================================
import '../../support/contrast-auto';
import '../Depth_functions_check/10_Depth_검출_개인정보 유형 정의_식별 정규식 정의_spec.cy.js';
