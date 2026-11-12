// ==========================================================================
// [2.9.7 신규] 04_Depth_소명_수동요청
//   소명 > 신청 > 이상행위 경보 (관리자) : 사용자별 미소명 경보 → 「소명 요청」 → 메일 발송 → Mailpit 확인
//   1. 사용자 묶음(사원_14 · user014) 정보 : 건수 · 정책
//   2. 체크 → 「N명 일괄 소명 요청」 · 「선택 해제」 → 해제
//   3. 요청 창 : 요청 대상 · 건수 · 의견(최대 300자) · 엑셀 첨부 / 「취소」 → 메일 안 감
//   4. 의견 입력 · 엑셀 첨부 → 「소명 요청 발송」 → Mailpit 새 메일 1건 (받는 사람 · 본문 의견 · 위험도별 건수 합 = 요청 건수 · 첨부)
//   반복 실행 설계
//     - 설정·데이터를 바꾸지 않음 (요청 기록과 메일만 남음) · 매 실행마다 user014 에게 메일 1건
//     - Mailpit(.26) 은 공용 메일함 → 지우지 않고 실행 전 메일 ID 와 비교
//     - 대상 경보는 소명 시나리오(04)들이 매일 만드는 user014 경보 (없으면 건너뜀)
//   2.9.7 확인 사항 (probe19, 2026-11-12)
//     - 묶음 .incident-group > .incident-header : .explreq-check · 사용자 배지 · .incident-count · 정책명 · .explreq-open-btn 「소명 요청」
//     - 요청 창 : 「선택한 사용자에게 이상행위 소명을 요청하는 메일을 발송하고 요청 기록을 남깁니다.」 · 요청 대상 N명 · 정보관리 책임자 의견 (0 / 300)
//                  · 이상행위 이력 엑셀 파일 첨부(체크박스) · 취소 / 소명 요청 발송
//     - 메일 「[LOGCATCH] 이상행위 소명을 요청드립니다.」 (요청 자동화와 같은 양식 · 의견 줄 「정보 관리 책임자 의견 : …」)
//   비밀번호: cypress.env.json (LC_PW)
// ==========================================================================
const A = require('../../support/anomaly');
const USER_ID = 'user014';
const USER_NAME = '사원_14';
const MAILPIT = 'http://10.10.54.26:8025/api/v1';

const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const p2 = (n) => String(n).padStart(2, '0');
const stamp = () => { const d = new Date(); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`; };

const go = () => {
  cy.visit('/logcatch/approval/submit/anomaly-alerts');
  cy.wait(3500);
  cy.get('.esh-title', { timeout: 15000 }).should('contain', '소명 요청');
  cy.get('.esh-scope-btn').filter((i, e) => t(e) === '전체 사용자').click({ force: true });
  cy.wait(2500);
};
const group = () => cy.get('.incident-header').filter((i, e) => shown(e) && t(e).includes(`(${USER_ID})`));
const dialog = () => cy.get('.v-dialog--active').filter(':visible').last();
const mailIds = (alias) => cy.request({ url: `${MAILPIT}/messages?limit=200`, failOnStatusCode: false })
  .then((res) => cy.wrap(((res.body && res.body.messages) || []).map((m) => m.ID)).as(alias));
const newMails = (alias) => cy.get(`@${alias}`).then((before) => cy.request({ url: `${MAILPIT}/messages?limit=200`, failOnStatusCode: false })
  .then((res) => ((res.body && res.body.messages) || []).filter((m) => !before.includes(m.ID) && /소명/.test(m.Subject || ''))));

describe('04_Depth_소명_수동요청', () => {
  A.ignoreErrors();

  it('사용자 미소명 경보 → 소명 요청(의견 · 엑셀 첨부) → Mailpit 메일 확인', { retries: 0 }, function () {
    const test = this;
    A.loginAdmin();
    go();
    A.dumpScreen('D04Q_1_목록');

    // ---------- 1. 사원_14 묶음 ----------
    cy.get('body').then(($b) => {
      const has = $b.find('.incident-header').toArray().some((e) => t(e).includes(`(${USER_ID})`));
      if (!has) { cy.log(`⏭️ ${USER_ID} 미소명 경보가 없음 — 건너뜀`); cy.then(() => test.skip()); }
    });
    group().should('have.length', 1).then(($h) => {
      const count = parseInt(t($h.find('.incident-count')[0]), 10);
      const policies = t($h.find('.incident-window')[0]).split(',').map((s) => s.trim()).filter(Boolean);
      cy.log(`${USER_NAME} 미소명 경보 ${count}건 · 정책 ${policies.join(', ')}`);
      expect(count, '묶음 건수').to.be.greaterThan(0);
      cy.wrap({ count, policies }).as('grp');
    });

    // ---------- 2. 체크 → 일괄 요청 버튼 → 선택 해제 ----------
    group().find('.explreq-check').click({ force: true });
    cy.wait(1000);
    cy.get('.explreq-selectall-count').should(($c) => expect(t($c[0]), '전체 선택 표시').to.match(/^1\s*\/\s*\d+$/));
    cy.get('button, .v-btn').filter((i, e) => shown(e) && /1명 일괄 소명 요청$/.test(t(e))).should('have.length', 1);
    A.dumpScreen('D04Q_2_체크');
    cy.get('button, .v-btn').filter((i, e) => shown(e) && t(e) === '선택 해제').first().click({ force: true });
    cy.wait(1000);
    cy.get('.explreq-selectall-count').should(($c) => expect(t($c[0]), '선택 해제 후').to.match(/^0\s*\/\s*\d+$/));
    cy.get('body').then(($b) => expect($b.find('button, .v-btn').filter((i, e) => shown(e) && /일괄 소명 요청$/.test(t(e))).length, '선택 해제 후 일괄 요청 버튼').to.eq(0));

    // ---------- 3. 요청 창 내용 · 취소 → 메일 안 감 ----------
    mailIds('mailBeforeCancel');
    group().find('.explreq-open-btn').click({ force: true });
    cy.wait(2000);
    cy.get('@grp').then((g) => {
      dialog().should('contain', '소명 요청').and('contain', '요청 대상').and('contain', USER_NAME).and('contain', `${g.count}건`);
      g.policies.forEach((p) => dialog().should('contain', p));
    });
    dialog().find('textarea').should('have.attr', 'placeholder').and('include', '최대 300자');
    // 300자 제한 : 301자 입력 → 300자까지만
    dialog().find('textarea').clear({ force: true }).type('가'.repeat(301), { force: true, delay: 0 });
    dialog().find('textarea').invoke('val').then((v) => expect(v.length, '의견 최대 글자 수').to.be.at.most(300));
    dialog().should(($d) => expect(t($d[0]), '의견 글자 수 표시').to.match(/300\s*\/\s*300/));
    A.dumpScreen('D04Q_3_요청창');
    dialog().find('button, .v-btn').filter((i, e) => t(e) === '취소').first().click({ force: true });
    cy.wait(1500);
    cy.get('.v-dialog--active:visible').should('not.exist');
    cy.wait(4000);
    newMails('mailBeforeCancel').then((fresh) => expect(fresh.length, '취소했을 때 새 소명 메일').to.eq(0));

    // ---------- 4. 의견 · 엑셀 첨부 → 발송 → Mailpit ----------
    const COMMENT = `[자동화] 수동 소명 요청 시나리오 ${stamp()}`;
    mailIds('mailBeforeSend');
    group().find('.explreq-open-btn').click({ force: true });
    cy.wait(2000);
    dialog().find('textarea').clear({ force: true }).type(COMMENT, { force: true, delay: 0 });
    dialog().find('input[type="checkbox"]').first().check({ force: true }).should('be.checked');
    A.dumpScreen('D04Q_4_발송전');
    dialog().find('button, .v-btn').filter((i, e) => /소명 요청 발송$/.test(t(e))).first().click({ force: true });
    cy.wait(1500);
    A.confirmIfAny();
    cy.wait(2500);
    A.dumpScreen('D04Q_4_발송후');
    cy.get('body').then(($b) => cy.writeFile('cypress/probe/D04Q_4_발송후_안내.json', {
      message: $b.find('.v-snack__content, .v-alert, .v-dialog--active, [role="alert"]').filter((i, e) => shown(e)).toArray().map(t).join(' | ')
    }));
    cy.get('body').then(($b) => {
      const $ok = $b.find('.v-dialog--active .v-btn, .v-dialog--active button').filter((i, e) => shown(e) && /^(확인|닫기)$/.test(t(e)));
      if ($ok.length) cy.wrap($ok.last()).click({ force: true });
    });
    cy.get('@grp').then((g) => {
      const poll = (left) => newMails('mailBeforeSend').then((fresh) => {
        if (!fresh.length && left > 0) { cy.wait(5000); poll(left - 1); return; }
        cy.writeFile('cypress/probe/D04Q_4_새메일.json', fresh.map((m) => ({ id: m.ID, subject: m.Subject, to: (m.To || []).map((x) => x.Address), attachments: m.Attachments })));
        expect(fresh.length, '발송 후 새 소명 메일 수').to.eq(1);
        const m = fresh[0];
        expect(m.Subject, '제목').to.include('소명을 요청드립니다');
        expect((m.To || []).map((x) => x.Address), '받는 사람').to.include(`${USER_ID}@logcatch.com`);
        cy.request({ url: `${MAILPIT}/message/${m.ID}`, failOnStatusCode: false }).then((r) => {
          const body = String((r.body && (r.body.Text || r.body.HTML)) || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
          const files = ((r.body && r.body.Attachments) || []).map((a) => a.FileName);
          const sev = ['심각', '경계', '주의'].map((k) => parseInt((body.match(new RegExp(`\\[\\s*${k}\\s*\\]\\s*[:：∶]?\\s*(\\d+)\\s*건`)) || [])[1] || '0', 10));
          cy.writeFile('cypress/probe/D04Q_4_메일본문.json', { files, sev, body: body.slice(0, 2000) });
          expect(body, '[ 사용자 ]').to.include(`${USER_NAME} (${USER_ID})`);
          expect(body, '정보 관리 책임자 의견 = 입력한 의견').to.include(COMMENT);
          expect(sev.reduce((a, b) => a + b, 0), `위험도별 건수 합 = 요청 건수 ${g.count}`).to.eq(g.count);
          g.policies.forEach((p) => expect(body, `[ 정책 위반 사항 ] ${p}`).to.include(p));
          expect(files, '엑셀 첨부').to.include('이상행위_이력.xlsx');
        });
      });
      poll(6);
    });
  });
});
