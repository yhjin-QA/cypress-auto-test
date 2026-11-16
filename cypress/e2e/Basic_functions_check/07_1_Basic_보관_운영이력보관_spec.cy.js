// ==========================================================================
// [2.9.7 신규] 07_1_Basic_보관_운영이력보관 — 조회 전용 (설정은 바꾸지 않음)
//   보관 > 운영이력 보관 : UI 점검(16_추가화면_UI)만 있던 화면의 입력 규칙 · 환산 표기 · 저장 요청 확인
//   1. 처음 값 기록 (활성 스위치 2개 · 보관일자 · 압축 일자 · 압축 보관 경로 · 원격 전송)
//   2. 잘못된 값 (보관일자 1824 · 36501 · 빈 값 / 압축 일자 0 · 36501) → 입력칸 범위 안내 「N ~ 36500의 값이어야 합니다.」
//      → 「저장」 : 저장 요청은 나가지 않고 「알림 · 저장에 실패했습니다.」 (이유 없는 문구 — 관찰)
//      + 운영가이드 7.3 저장 거부 : 압축 일자 > 보관일자 · 경로 상대 경로 · .. 포함 → 화면은 막지 않고 요청을 보냄(기록만, 여기선 막음)
//        서버 거부 여부는 07_1_Depth_보관_운영이력보관_설정저장 6단계에서 확인
//   3. 올바른 값 (보관일자 2190 · 3650 · 1900) → 「(약 N년 [M개월])」 환산 표기 → 「저장」 → 저장 요청은 나가되 스크립트가 막음(418) — 저장 API · 본문 기록 (Depth 설계용)
//   4. 화면을 다시 열어 처음 값 그대로인지 확인 (막았으므로 바뀌면 안 됨)
//   5. 「운영 이력」 → /settings/admin/operatingLogs · 「접속기록 보관 설정」 → /backup/accessLogs 바로가기 확인
//   저장 API (Depth 07_1 용) : POST /logcatch/common/com06/work-history-backup { useFlag · retentionDay · compressUseFlag · compressDay · archivePath · transferUseFlag }
//   [안전장치] 로그인 뒤 GET 이 아닌 /logcatch/ 요청은 모두 418 로 막는다 (로그인 · 파일 다운로드 목록 제외)
//   첫 실행은 화면 동작 기록 단계 — cypress/probe/B07W_관찰.json 을 보고 확인 항목을 구체화
// ==========================================================================
const A = require('../../support/anomaly');

const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const obs = {};
const note = (k, v) => {
  obs[k] = v;
  cy.log(`📝 ${k}: ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 300)}`);
  cy.writeFile('cypress/probe/B07W_관찰.json', obs, { log: false });
};

const KEEP = 'input[aria-label="보관일자(일)"]';
const ZIP = 'input[aria-label="압축 일자(일)"]';
const PATH = 'input[aria-label="압축 보관 경로"]';

const open = () => {
  cy.visit('/logcatch/backup/workHistory');
  cy.wait(3000);
  cy.get('body').then(($b) => {
    if (!$b.find(KEEP).filter((i, e) => shown(e)).length) {
      cy.contains('button', '보관').filter(':visible').first().click({ force: true });
      cy.wait(2000);
      cy.get('.v-list__tile__title').filter(':visible').filter((i, e) => t(e) === '운영이력 보관').first().click({ force: true });
      cy.wait(3000);
    }
  });
  cy.get(KEEP, { timeout: 15000 }).filter(':visible').should('be.visible');
};

const state = () => cy.get('body').then(($b) => {
  const sw = $b.find('input[aria-label="활성/비활성"]').toArray().map((e) => e.getAttribute('aria-checked'));
  const v = (s) => { const e = $b.find(s).filter((i, x) => shown(x))[0]; return e ? String(e.value) : null; };
  const remote = $b.find('input[aria-label="원격 전송(FTP/SFTP 등)"]')[0];
  return cy.wrap({ 운영이력활성: sw[0], 압축활성: sw[1], 보관일자: v(KEEP), 압축일자: v(ZIP), 경로: v(PATH), 원격전송: remote ? remote.getAttribute('aria-checked') : null }, { log: false });
});

// 입력칸 하나에 값 넣고 칸을 벗어남 → 그 칸의 안내 · 환산 표기 읽기
const put = (sel, val) => {
  cy.get(sel).filter(':visible').first().clear({ force: true });
  if (val !== '') cy.get(sel).filter(':visible').first().type(String(val), { force: true });
  cy.get(sel).filter(':visible').first().blur({ force: true });
  cy.wait(800);
};
const msgOf = (sel) => cy.get(sel).filter(':visible').first().then(($i) => {
  const box = $i.closest('.v-input')[0];
  const msgs = box ? [...box.querySelectorAll('.v-messages__message, .error--text')].filter(shown).map(t).filter(Boolean) : [];
  // 환산 표기 「(약 …)」 : 입력칸 근처(같은 줄 · 바로 아래)에서 찾음
  const row = $i.closest('.layout, .row, .v-card__text')[0] || box;
  const conv = ((row ? t(row) : '').match(/\(약[^)]*\)/) || [null])[0];
  return cy.wrap({ 안내: [...new Set(msgs)], 환산: conv, 오류표시: !!(box && box.classList.contains('error--text')) }, { log: false });
});

// 「저장」 → 1.5초 동안 나온 창 · 안내 기록 (창이 뜨면 확인을 누르지 않고 취소로 닫음)
const save = () => {
  cy.get('.v-btn__content').filter((i, e) => shown(e) && t(e) === '저장').last().click({ force: true });
  cy.wait(1500);
  return cy.get('body').then(($b) => {
    const snack = $b.find('.v-snack__content').filter((i, e) => shown(e)).toArray().map(t).filter(Boolean);
    const $d = $b.find('.v-dialog--active').filter((i, e) => shown(e)).last();
    const dlg = $d.length ? t($d[0]).slice(0, 200) : null;
    if ($d.length) {
      const $x = $d.find('button, .v-btn').filter((i, e) => shown(e) && /^(취소|닫기|아니오|확인)$/.test(t(e)));
      // 확인을 누르면 저장 요청이 나갈 수 있음 — 막혀 있으니 안전하지만, 안내만 있는 창이면 확인으로 닫음
      const $cancel = $x.filter((i, e) => /^(취소|닫기|아니오)$/.test(t(e)));
      cy.wrap(($cancel.length ? $cancel : $x).last()).click({ force: true });
      cy.wait(1000);
    }
    return cy.wrap({ snack, 창: dlg }, { log: false });
  });
};
const blockedN = () => cy.get('@blocked.all', { log: false }).then((xs) => xs.length);

describe('07_1_Basic_보관_운영이력보관', () => {
  A.ignoreErrors();

  beforeEach(() => {
    cy.intercept({ url: /\/logcatch\/(?!.*\.(js|css|png|svg|ico|gif|woff2?|ttf|map)(\?|$))/ }).as('net');
    A.loginAdmin();
    // 로그인 뒤부터 GET 이 아닌 요청은 모두 막음 (설정을 바꾸지 않기 위해)
    cy.intercept({ method: /^(POST|PUT|DELETE|PATCH)$/, url: /\/logcatch\/(?!oauth\/token|common\/com05\/file\/download)/ }, (req) => {
      req.reply({ statusCode: 418, body: { code: 418, message: 'blocked by 07_1_Basic (조회 전용)' } });
    }).as('blocked');
  });

  it('운영이력 보관 — 입력 규칙 · 환산 표기 · 저장 요청 (저장은 막음)', { retries: 0 }, () => {
    open();
    state().then((s0) => {
      note('B07W_처음값', s0);
      cy.wrap(s0, { log: false }).as('s0');
      expect(Number(s0.보관일자), '보관일자 처음 값 (1825~36500)').to.be.within(1825, 36500);
      expect(Number(s0.압축일자), '압축 일자 처음 값 (1~36500)').to.be.within(1, 36500);
    });
    A.dumpScreen('B07W_1_처음');

    // ---- 2. 잘못된 값 ----
    const bad = [
      { k: '보관일자_1824', sel: KEEP, v: 1824 },
      { k: '보관일자_36501', sel: KEEP, v: 36501 },
      { k: '보관일자_빈값', sel: KEEP, v: '' },
      { k: '압축일자_0', sel: ZIP, v: 0 },
      { k: '압축일자_36501', sel: ZIP, v: 36501 },
      // 운영가이드 7.3 저장 거부 조건 : 압축 일자 > 보관일자 · 압축 보관 경로가 절대 경로가 아니거나 .. 포함
      { k: '압축일자_보관일자초과', sel: ZIP, v: 'KEEP+1', rule: true },   // 화면이 막지 않고 요청을 보냄 → 서버 거부는 Depth 설정저장에서 확인
      { k: '경로_상대경로', sel: PATH, v: 'logcatch/backup', path: true },
      { k: '경로_상위폴더', sel: PATH, v: '/home/logcatch/../tmp', path: true }
    ];
    bad.forEach((c) => {
      open();
      blockedN().then((b0) => {
        if (c.v === 'KEEP+1') cy.get(KEEP).filter(':visible').first().invoke('val').then((k) => { c.v = Number(k) + 1; });
        cy.then(() => put(c.sel, c.v));
        msgOf(c.sel).then((m) => {
          save().then((r) => {
            blockedN().then((b1) => {
              cy.get('@blocked.all', { log: false }).then((xs) => {
                const sent = xs.slice(b0).map((x) => `${x.request.method} ${x.request.url.replace(/^https?:\/\/[^/]+/, '')}`);
                const rec = { 값: c.v, ...m, 저장후: r, 저장요청: sent };
                note(`B07W_잘못된값_${c.k}`, rec);
                // 입력칸 바로 아래 빨간 안내 「1825 ~ 36500의 값이어야 합니다.」 (2026-11-16 수동 확인)
                if (c.rule) { /* 기록만 */ } else if (c.path) {
                  // 2026-11-16 확인 : 입력칸 아래 「직접 지정할 경우 /로 시작하는 절대 경로만 입력할 수 있습니다. (.. 사용 불가)」 빨간 안내 · 저장 요청 없음
                  expect(m.오류표시, `${c.k} — 경로 입력칸 오류 표시`).to.eq(true);
                  expect(m.안내.join(' | '), `${c.k} — 경로 규칙 안내`).to.include('절대 경로만 입력할 수 있습니다');
                } else if (c.v !== '') expect(m.안내.join(' | '), `${c.k} — 입력칸 범위 안내`).to.match(/\d+ ~ 36500의 값이어야 합니다/);
                else expect(m.안내.length > 0 || m.오류표시 || r.snack.length > 0 || !!r.창, `${c.k} — 빈 값 안내`).to.eq(true);
                // 화면이 저장 요청을 보내지 않음 (2026-11-16 확인) — 다만 알림은 이유 없이 「저장에 실패했습니다.」 (관찰)
                // 거부 조건(c.rule) 3건은 화면이 막지 않고 요청을 보냄 (2026-11-16) — 서버 거부는 07_1_Depth 설정저장에서 확인, 여기선 기록만
                if (!c.rule) expect(sent, `${c.k} — 잘못된 값은 저장 요청이 나가지 않음`).to.deep.eq([]);
                if (!c.rule) expect(r.창 || r.snack.join(' '), `${c.k} — 저장 막힘 알림`).to.include('저장에 실패했습니다');
              });
            });
          });
        });
      });
    });
    A.dumpScreen('B07W_2_잘못된값');

    // ---- 3. 올바른 값 : 환산 표기 · 저장 요청 (막힘) ----
    const good = [2190, 3650, 1900];
    good.forEach((v) => {
      open();
      blockedN().then((b0) => {
        put(KEEP, v);
        msgOf(KEEP).then((m) => {
          const y = Math.floor(v / 365);
          note(`B07W_환산_${v}`, { ...m, 기대년: y });
          expect(m.안내.filter((x) => !/^\(약/.test(x)), `${v}일 — 오류 안내 없음`).to.deep.eq([]);
          expect(m.환산, `${v}일 — 「(약 N년 …)」 환산 표기`).to.match(new RegExp(`\\(약 ${y}년`));
          if (v % 365 === 0) expect(m.환산, `${v}일 = 정확히 ${y}년`).to.eq(`(약 ${y}년)`);
        });
        if (v === good[0]) {
          save().then((r) => {
            cy.get('@blocked.all', { log: false }).then((xs) => {
              const mine = xs.slice(b0);
              const sent = mine.map((x) => ({ 요청: `${x.request.method} ${x.request.url.replace(/^https?:\/\/[^/]+/, '')}`, 본문: x.request.body }));
              note('B07W_저장요청', { 저장후: r, 요청: sent });
              expect(mine.length, `올바른 값(${v}) 저장 → 저장 요청이 나감 (스크립트가 막음)`).to.be.greaterThan(0);
            });
          });
        }
      });
    });
    A.dumpScreen('B07W_3_올바른값');

    // ---- 4. 다시 열기 → 처음 값 그대로 ----
    open();
    cy.get('@s0').then((s0) => state().then((s1) => {
      note('B07W_다시열기', s1);
      expect(s1, '저장을 막았으므로 처음 값 그대로').to.deep.eq(s0);
    }));

    // ---- 5. 바로가기 ----
    [['운영 이력', /\/settings\/admin\/operatingLogs$/], ['접속기록 보관 설정', /\/backup\/accessLogs$/]].forEach(([label, re]) => {
      open();
      cy.get('button, .v-btn').filter((i, e) => shown(e) && t(e).replace(/^launch\s*/, '') === label).first().click({ force: true });
      cy.wait(3000);
      cy.location('pathname').then((p) => {
        note(`B07W_바로가기_${label.replace(/\s/g, '')}`, p);
        expect(p, `「${label}」 바로가기 이동`).to.match(re);
      });
    });
    cy.get('@blocked.all', { log: false }).then((xs) => note('B07W_막은요청_전체', xs.map((x) => `${x.request.method} ${x.request.url.replace(/^https?:\/\/[^/]+/, '')}`)));
  });
});
