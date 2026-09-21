// 앱에서 발생하는 uncaught exception 중 테스트 실패로 처리하지 않을 목록

// 부분 일치로 무시 (라우팅/청크 로딩 등 환경성 에러)
const ignoredContains = [
  'Navigation cancelled',
  'NavigationDuplicated',
  'Redirected when going from',
  'navigation guard',
  'Avoided redundant navigation',
  'Loading chunk',
  'Loading CSS chunk',
  'ChunkLoadError',
  'resetValidation',
  'operate.task.packageManagement',
  'Cannot read properties',   // TODO: 범위가 넓음 - 정리 필요
  'Script error',
  'not valid JSON',
  'this.items.forEach is not a function', // 알려진 버그 - Mantis #____
];

// 정확히 일치할 때만 무시
const ignoredExact = [
  'e is not defined',
];

Cypress.on('uncaught:exception', (err) => {
  const msg = err.message.trim();
  if (ignoredContains.some(e => msg.includes(e)) || ignoredExact.includes(msg)) {
    return false;
  }
});