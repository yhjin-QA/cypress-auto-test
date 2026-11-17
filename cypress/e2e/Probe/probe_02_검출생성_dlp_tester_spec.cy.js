// ==========================================================================
// [Probe] CRM(.27) dlp_tester.jsp 구조 확인 — 페이지를 열어 보기만 함 (폼 제출 · 버튼 실행 없음, LogCatch 설정 변경 없음)
//   목적 : 02_Basic_이력 · 02_Depth 검출이 「검출 데이터를 만들고 → 조회」 하도록 바꾸기 위해 dlp_tester.jsp 의 폼 · 버튼 · 링크를 기록
//   1. 로그인 없이 GET  2. user001 로그인 후 GET (cy.task crmFetch, 비밀번호는 Node 에서 cypress.env.json 직접 읽음)
//   결과 : cypress/probe/P02D_관찰.json · P02D_dlp_tester_비로그인.html · P02D_dlp_tester_로그인.html
// ==========================================================================
const obs = {};
const note = (k, v) => { obs[k] = v; cy.writeFile('cypress/probe/P02D_관찰.json', obs, { log: false }); };
const summarize = (html) => {
  const doc = new DOMParser().parseFromString(html || '', 'text/html');
  const t = (e) => (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  return {
    title: t(doc.querySelector('title') || doc.createElement('x')),
    forms: [...doc.querySelectorAll('form')].map((f) => ({
      action: f.getAttribute('action'), method: f.getAttribute('method'), id: f.id, name: f.getAttribute('name'),
      fields: [...f.querySelectorAll('input,select,textarea')].map((i) => ({ tag: i.tagName, type: i.type, name: i.name, id: i.id, value: (i.value || '').slice(0, 60) })),
    })),
    buttons: [...doc.querySelectorAll('button,input[type=submit],input[type=button]')].map((b) => ({ text: t(b) || b.value, onclick: (b.getAttribute('onclick') || '').slice(0, 200), id: b.id, name: b.name })),
    links: [...doc.querySelectorAll('a')].map((a) => ({ text: t(a), href: a.getAttribute('href') })).slice(0, 60),
    scripts: [...doc.querySelectorAll('script')].map((s) => (s.getAttribute('src') || s.textContent.replace(/\s+/g, ' ').slice(0, 600))),
    text: t(doc.body || doc.createElement('x')).slice(0, 120) && (doc.body ? doc.body.textContent.replace(/\s+/g, ' ').trim().slice(0, 1500) : ''),
  };
};

describe('probe_02_검출생성_dlp_tester', () => {
  it('dlp_tester.jsp 구조 기록 (보기만)', { retries: 0 }, () => {
    [['비로그인', null], ['로그인', 'user001']].forEach(([key, userId]) => {
      cy.task('crmFetch', { userId, path: '/crm/dlp_tester.jsp' }, { timeout: 90000, log: false }).then((r) => {
        cy.writeFile(`cypress/probe/P02D_dlp_tester_${key}.html`, r.body || '', { log: false });
        note(key, { userId, ok: r.ok, login: r.login, status: r.status, length: r.length, error: r.error, ...summarize(r.body) });
        cy.log(`${key} : 상태 ${r.status} · 길이 ${r.length} ${r.error || ''}`);
      });
    });
  });
});
