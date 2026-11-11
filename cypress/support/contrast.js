// =====================================================================
// 다크 모드 글자 대비 검사 (cypress-axe / axe-core color-contrast)
//   - spec 맨 위에서  import '../../support/contrast';  로 불러옵니다.
//     (support/e2e.js 는 수정하지 않음)
//   - 결과: cypress/reports/contrast/contrast-YYYYMMDD.ndjson (한 줄 = 요소 1건, 이어쓰기)
//   - 기본은 기록만. --env CONTRAST_FAIL=true 이면 대비 미달 시 실패 처리
// =====================================================================
import 'cypress-axe';

const luminance = (rgb) => {
  const m = (rgb || '').match(/[\d.]+/g);
  if (!m) return 1;
  const [r, g, b] = m.slice(0, 3).map((v) => {
    v = Number(v) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// 화면 배경 밝기로 다크 여부 판정 (Vuetify .application 기준)
Cypress.Commands.add('isDarkTheme', () =>
  cy.document({ log: false }).then((doc) => {
    const app = doc.querySelector('.application, .v-application, #app') || doc.body;
    if (app.classList.contains('theme--dark')) return true;
    if (app.classList.contains('theme--light')) return false;
    return luminance(getComputedStyle(app).backgroundColor) < 0.2;
  })
);

// 상단 툴바의 테마(☀) 아이콘 — 아이콘 이름 후보 중 보이는 것을 클릭
const THEME_ICONS = ['wb_sunny', 'brightness_7', 'brightness_4', 'brightness_high',
  'brightness_low', 'light_mode', 'dark_mode', 'wb_incandescent', 'nights_stay'];

Cypress.Commands.add('ensureDarkTheme', () => {
  cy.isDarkTheme().then((dark) => {
    if (dark) { cy.log('🌙 이미 다크 모드'); return; }
    const sel = Cypress.env('THEME_TOGGLE');
    if (sel) {
      cy.get(sel).filter(':visible').first().click({ force: true });
    } else {
      cy.get('i.material-icons:visible').then(($icons) => {
        const hit = [...$icons].find((i) => THEME_ICONS.includes(i.textContent.trim()));
        if (!hit) throw new Error('테마 아이콘을 찾지 못했습니다. --env THEME_TOGGLE="선택자" 로 지정해 주세요');
        cy.wrap(hit).closest('button, .v-btn, a, div').click({ force: true });
      });
    }
    cy.wait(1000);
  });
  cy.isDarkTheme().should('eq', true);
});

const FAIL_ON = String(Cypress.env('CONTRAST_FAIL')) === 'true';
const ymd = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
};

// cy.checkContrast('화면 이름', '검사 범위 선택자(없으면 전체)', { exclude: ['선택자'] })
Cypress.Commands.add('checkContrast', (label, context = null, opts = {}) => {
  const exclude = (opts.exclude || []).map((s) => [s]);
  cy.injectAxe();
  cy.window({ log: false }).then((win) => {
    const ctx = context ? { include: [[context]], exclude } : { exclude };
    return cy
      .wrap(win.axe.run(ctx, {
        runOnly: { type: 'rule', values: ['color-contrast'] },
        resultTypes: ['violations', 'incomplete'],
      }), { log: false, timeout: 60000 })
      .then((res) => {
        const toRows = (list, kind) => list.flatMap((rule) => rule.nodes.map((n) => {
          const d = (n.any[0] && n.any[0].data) || {};
          return {
            screen: label, kind, target: n.target.join(' '),
            text: (n.html || '').replace(/\s+/g, ' ').slice(0, 160),
            fg: d.fgColor || '', bg: d.bgColor || '',
            ratio: d.contrastRatio || '', expected: d.expectedContrastRatio || '',
            message: (n.any[0] && n.any[0].message) || '',
            host: win.location.host, url: win.location.pathname, at: new Date().toISOString(),
          };
        }));
        // 배경 이미지·그라데이션 때문에 계산 못 한(incomplete) 요소 중 사람이 이미 확인한 영역은 기록에서 뺌
        //   예) { skipIncomplete: ['.policy-card'] }
        const skip = opts.skipIncomplete || [];
        const inc = toRows(res.incomplete, 'incomplete').filter((r) => !skip.some((k) => r.target.includes(k) || r.text.includes(k.replace(/^\./, ''))));
        // 자동 모드에서는 대비 값을 계산하지 못한 incomplete(그라데이션·가상 요소 등)는 버리고, 값이 있는 것만 남김
        const inc2 = opts.auto ? inc.filter((r) => r.ratio) : inc;
        const rows = [...toRows(res.violations, 'violation'), ...inc2].map((r) => ({ spec: Cypress.spec.name, ...r }));
        const v = rows.filter((r) => r.kind === 'violation');

        Cypress.log({ name: 'contrast', message: `${label} : 미달 ${v.length}건 / 확인 필요 ${rows.length - v.length}건` });
        v.forEach((r) => Cypress.log({ name: '  미달', message: `${r.ratio} (${r.fg} on ${r.bg}) ${r.target}` }));

        const line = rows.length
          ? rows.map((r) => JSON.stringify(r)).join('\n') + '\n'
          : JSON.stringify({ spec: Cypress.spec.name, screen: label, kind: 'none', host: win.location.host, at: new Date().toISOString() }) + '\n';
        return cy.writeFile(`cypress/reports/contrast/contrast-${ymd()}.ndjson`, line, { flag: 'a+', log: false })
          .then(() => { if (FAIL_ON) expect(v, `${label} 대비 미달 요소`).to.have.length(0); });
      });
  });
});

// =====================================================================
// 「다크 모드인데 밝은 바탕」 검사 (0038920 유형 — 컴포넌트에 다크 테마 미적용)
//   cy.checkDarkLeaks('화면 이름', '검사 범위 선택자(없으면 전체)')
//   - 보이는 요소 중 자기 배경색이 밝은(밝기 >= DARK_LEAK_LUM) 영역을 찾음
//   - 브라우저 안에서 한 번에 계산 (cy.each 로 요소마다 돌지 않음 → 빠름)
//   - 결과는 대비 검사와 같은 ndjson 파일에 kind=light-bg 로 기록
//   - 옵션 : --env DARK_LEAK_LUM=0.5 (밝기 기준, 0~1)  DARK_LEAK_MIN_AREA=400 (px², 작은 점·스위치 손잡이 제외)
// =====================================================================
const LEAK_LUM = Number(Cypress.env('DARK_LEAK_LUM') || 0.5);
const LEAK_MIN_AREA = Number(Cypress.env('DARK_LEAK_MIN_AREA') || 400);
// 원래 밝게 그리는 부품(스위치 손잡이 등)은 제외 — 필요하면 --env DARK_LEAK_SKIP="cls1,cls2" 로 추가
// [2026-11-11] approval-action-layout : 결재 창 하단 버튼 줄 — 바탕값은 흰색이지만 안쪽 어두운 영역에 덮여 화면에는 어둡게 보임(오탐)
const LEAK_SKIP_CLASSES = ['v-input--switch__thumb', 'v-slider__thumb', 'v-progress-circular__underlay', 'approval-action-layout']
  .concat(String(Cypress.env('DARK_LEAK_SKIP') || '').split(',').map((x) => x.trim()).filter(Boolean));
const LEAK_SKIP_TAGS = new Set(['IMG', 'SVG', 'CANVAS', 'VIDEO', 'IFRAME', 'PATH', 'G', 'CIRCLE', 'RECT', 'LINE', 'POLYLINE', 'POLYGON']);

const cssPath = (el) => {
  const parts = [];
  for (let n = el, d = 0; n && n.nodeType === 1 && d < 4; n = n.parentElement, d++) {
    let p = n.tagName.toLowerCase();
    const cls = [...n.classList].filter((c) => !/^(v-.*--active|theme--)/.test(c)).slice(0, 2);
    if (cls.length) p += '.' + cls.join('.');
    parts.unshift(p);
  }
  return parts.join(' > ');
};

Cypress.Commands.add('checkDarkLeaks', (label, context = null) => {
  cy.window({ log: false }).then((win) => {
    const doc = win.document;
    const root = context ? doc.querySelector(context) : doc.body;
    const rows = [];
    if (root) {
      const all = [root, ...root.querySelectorAll('*')];
      for (const el of all) {
        if (LEAK_SKIP_TAGS.has(el.tagName.toUpperCase())) continue;
        if (LEAK_SKIP_CLASSES.some((c) => el.classList.contains(c))) continue;
        const cs = win.getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
        const m = (cs.backgroundColor || '').match(/[\d.]+/g);
        if (!m) continue;
        const alpha = m.length > 3 ? Number(m[3]) : 1;
        if (alpha < 0.5) continue; // 투명·반투명 바탕 제외
        const r = el.getBoundingClientRect();
        if (r.width * r.height < LEAK_MIN_AREA || r.bottom < 0 || r.right < 0) continue;
        const lum = luminance(cs.backgroundColor);
        if (lum < LEAK_LUM) continue;
        // 부모도 밝은 바탕으로 이미 잡혔으면 자식은 생략 (가장 바깥 영역만 기록)
        if (rows.some((x) => x._el.contains(el))) continue;
        rows.push({
          _el: el,
          spec: Cypress.spec.name, screen: label, kind: 'light-bg',
          target: cssPath(el),
          text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80),
          bg: cs.backgroundColor, fg: cs.color, lum: Number(lum.toFixed(2)),
          size: `${Math.round(r.width)}x${Math.round(r.height)}`,
          host: win.location.host, url: win.location.pathname, at: new Date().toISOString(),
        });
      }
    }
    const out = rows.map(({ _el, ...rest }) => rest);
    Cypress.log({ name: 'dark-leak', message: `${label} : 밝은 바탕 ${out.length}건` });
    out.forEach((x) => Cypress.log({ name: '  밝은 바탕', message: `${x.lum} ${x.bg} ${x.size} ${x.target}` }));
    if (!out.length) return;
    return cy.writeFile(`cypress/reports/contrast/contrast-${ymd()}.ndjson`,
      out.map((x) => JSON.stringify(x)).join('\n') + '\n', { flag: 'a+', log: false });
  });
});
