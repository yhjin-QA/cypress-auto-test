/** 코드 시작 */
describe('로그캐치 사이트 테스트', () => {

  // ▼ 모든 에러 무시 설정 ▼
  Cypress.on('uncaught:exception', (err, runnable) => {
    const ignoredErrors = [
      'Navigation cancelled',
      'Cannot read properties',
      'resetValidation',
      'NavigationDuplicated',
      'Avoided redundant navigation',
      'Loading chunk',
      'operate.task.packageManagement',
      'e is not defined',
      'Script error'
    ];
    if (ignoredErrors.some(e => err.message.includes(e))) {
      return false;
    }
  });


  it('DEV_Release 로그캐치 UI기본체크', () => {

    // ==========================================
    // 공통 설정
    // ==========================================
    // [일반 모드] 사이드 메뉴 (메뉴명 변경 이력)
    // - v2.9.1.125_r35234: '소명' 제거, '결재' 추가
    // - 2.9.4.0_261001: '상태' → '현황'
    // - (현재 버전 기입): '결재' → '소명'
    const USER_MENUS = ['이력', '현황', '자산', '보고', '보관', '분석', '검출', '운영', '소명', '점검'];

    // [관리자 모드] 사이드 메뉴 (톱니바퀴 클릭 후)
    const ADMIN_MENUS = ['관리', '설정'];

    // Vuetify 1.x 서브메뉴 항목 (1단계 항목만, 하위 메뉴 제외)
    const SUBMENU_ITEM =
      '.v-menu__content.menuable__content__active > .v-list > [role="listitem"] > .v-list__tile .v-list__tile__title';

    // 페이지 내 탭메뉴 셀렉터 (모두 수집 후 중복 제거)
    // - LogCatch 탭 버튼: 접속기록 이력 → 통합 / 파일 다운로드 / 검출 (button.tab-btn)
    // - Vuetify 기본 탭: 접속기록 보관 → 백업/복원
    // ※ .v-treeview-node(즐겨찾기용 숨김 메뉴 트리)는 화면 탭이 아니므로 제외
    const TAB_SELECTORS = [
      'button.tab-btn',
      '.v-tabs__div',
      '[role="tab"]',
    ];

    // 서브메뉴가 없는 메뉴의 탭을 기록할 때 쓰는 이름
    const NO_SUBMENU_KEY = '(메뉴 화면)';

    // 전체 변경 내역 (엄격 모드 판정용)
    const allDiffs = [];

    // 수행 중 닫은 알림창 기록 (예: '업무시스템을 선택해주세요.')
    const alertLog = [];
    const stuckEls = new Set(); // 닫히지 않는 창 (중복 기록 방지)
    let currentMode = '일반';

    // 정규식 특수문자 이스케이프 (예: '개인정보 파일 / 문서')
    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const exact = (text) => new RegExp(`^\\s*${escapeRegExp(text)}\\s*$`);

    // 사이드 메뉴 표시명에서 뒤쪽 괄호 표시 제거 (예: '설정 (⚙)' → '설정')
    const baseName = (s) => s.trim().replace(/\s*\([^)]*\)\s*$/, '').trim();

    // 사이드 메뉴 표시명 차이 기록 (변경 건수에는 포함하지 않음)
    const labelLog = [];

    // 떠 있는 알림창(v-dialog)이 있으면 메시지를 기록하고 [확인]으로 닫기
    // - 알림창이 남아 있으면 오버레이가 다음 클릭(톱니바퀴 등)을 막기 때문
    // - 연달아 뜨는 경우를 위해 최대 3번 반복
    // - 닫아도 같은 창이 남아 있으면 '닫히지 않는 창'으로 1번만 기록하고 HTML을 파일로 저장
    const dismissAlerts = (round = 0, prevEl = null) => {
      cy.get('body').then(($body) => {
        const $dlg = $body.find('.v-dialog--active').filter(':visible');
        if (!$dlg.length) {
          if (round === 0 && $body.find('.v-overlay--active').length) {
            cy.log('⚠️ 오버레이가 남아 있으나 알림창을 찾지 못했습니다');
          }
          return;
        }
        const el = $dlg.last()[0];
        const $el = Cypress.$(el);
        const where = el.ownerDocument.location.pathname.replace('/logcatch', '');

        // 이미 '닫히지 않는 창'으로 기록한 창이면 다시 기록하지 않음
        if (stuckEls.has(el)) return;

        // 같은 창이 닫히지 않고 남아 있는 경우
        if (el === prevEl || round >= 3) {
          stuckEls.add(el);
          cy.log(`⛔ [${currentMode}] 닫히지 않는 창 (${where}) → cypress/results/stuck-dialog.html 확인`);
          const last = alertLog[alertLog.length - 1];
          if (last) last.stuck = true;
          cy.writeFile('cypress/results/stuck-dialog.html',
            `<!-- ${currentMode} | ${where} -->\n${el.outerHTML}`);
          return;
        }

        // 메시지 정리: 제목 + 본문, 둘 다 비어 있으면 버튼 이름이라도 기록
        const title = $el.find('.v-card__title, .headline').first().text().replace(/\s+/g, ' ').trim();
        const body = ($el.find('.v-card__text').text() || '').replace(/\s+/g, ' ').trim();
        const buttons = [...$el.find('button')].map((b) => b.innerText.trim()).filter(Boolean).join(' / ');
        let msg = [title && `[${title}]`, body].filter(Boolean).join(' ').slice(0, 150);
        if (!msg) msg = `(내용 없음 · 버튼: ${buttons || '없음'})`;

        alertLog.push({ mode: currentMode, where, message: msg });
        cy.log(`🔔 [${currentMode}] 알림창 닫음 (${where}): ${msg}`);

        const $ok = $el
          .find('button')
          .filter((i, b) => /확인|닫기|취소|OK|Close/i.test(b.innerText));
        if ($ok.length) {
          cy.wrap($ok.last()).click({ force: true });
        } else {
          cy.get('body').type('{esc}');
        }
        cy.wait(700);
        dismissAlerts(round + 1, el);
      });
    };

    // 화면에 보이는 사이드 메뉴 이름 수집
    // - 서브메뉴가 없는 메뉴(현황/보고/점검 등)는 button.side-menu 클래스가 없으므로
    //   클래스 대신 '왼쪽 사이드바 영역 안의 버튼'을 기준으로 수집
    const collectSideMenus = ($body) => {
      // 사이드바 오른쪽 끝 위치 계산 (side-menu 버튼 기준, 없으면 250px)
      const sideRights = [...$body.find('button.side-menu').filter(':visible')]
        .map((el) => el.getBoundingClientRect().right);
      const sidebarRight = sideRights.length ? Math.max(...sideRights) + 5 : 250;

      const names = [...$body.find('button span.font-weight-bold').filter(':visible')]
        .filter((el) => {
          const btn = el.closest('button');
          return btn && btn.getBoundingClientRect().right <= sidebarRight;
        })
        .map((el) => el.innerText.trim());
      return [...new Set(names.filter(Boolean))];
    };

    // 사이드 메뉴 버튼 클릭
    // 1순위: 버튼 안 span.font-weight-bold 글자 일치 (일반 모드)
    // 2순위: button.side-menu 글자 일치 (관리자 모드 등)
    // ※ 뒤쪽 괄호 표시는 무시하고 비교 (예: '설정 (⚙)'도 '설정'으로 클릭)
    const clickSideMenu = (menu) => {
      dismissAlerts(); // 이전 화면의 알림창이 남아 있으면 먼저 닫기
      cy.get('body').then(($body) => {
        const same = (el) => baseName(el.innerText) === menu;
        let $btn = $body
          .find('button span.font-weight-bold')
          .filter((i, el) => same(el))
          .closest('button');
        if (!$btn.length) {
          $btn = $body
            .find('button.side-menu')
            .filter((i, el) => same(el));
        }
        if (!$btn.length) {
          throw new Error(`사이드 메뉴 버튼을 찾을 수 없습니다: '${menu}' (메뉴명 변경 여부 확인)`);
        }
        cy.wrap($btn.first()).click({ force: true });
      });
      cy.wait(2000); // 서브메뉴 펼쳐질 시간
    };

    // 현재 화면의 탭메뉴 이름 수집
    const collectTabs = ($body) => {
      const names = [];
      TAB_SELECTORS.forEach((sel) => {
        [...$body.find(sel).filter(':visible')]
          .map((el) => el.innerText.trim())
          .filter(Boolean)
          .forEach((n) => names.push(n));
      });
      return [...new Set(names)];
    };

    // 기준 대비 추가/삭제 비교
    const compare = (names, base) => ({
      added: names.filter((n) => !base.includes(n)),
      removed: base.filter((n) => !names.includes(n)),
    });


    // ==========================================
    // 메뉴 감지 함수 (서브메뉴 + 탭메뉴 + 요약)
    // - label : 로그 표시용 이름 (예: '일반', '관리자')
    // - menus : 사이드 메뉴 목록
    // - prefix: 파일 이름 앞에 붙는 구분자 ('' 또는 'admin-')
    // ==========================================
    const runMenuDetection = ({ label, menus, prefix }) => {
      const F = {
        base: `${prefix}menu-baseline.json`,                       // fixtures
        tabBase: `${prefix}menu-tab-baseline.json`,                // fixtures
        snap: `cypress/results/${prefix}menu-snapshot.json`,
        diff: `cypress/results/${prefix}menu-diff.json`,
        tabSnap: `cypress/results/${prefix}menu-tab-snapshot.json`,
        tabDiff: `cypress/results/${prefix}menu-tab-diff.json`,
      };

      const current = {};
      const diffs = [];
      const tabCurrent = {};
      const tabDiffs = [];
      const missing = []; // 화면에 없어 건너뛸 사이드 메뉴

      cy.log(`==================== 🔍 [${label}] 메뉴 감지 시작 ====================`);
      cy.then(() => { currentMode = label; });
      dismissAlerts();

      // ---------- 사이드 메뉴 자체 추가/삭제 (코드의 메뉴 목록과 비교) ----------
      cy.get('body').then(($body) => {
        const side = collectSideMenus($body);
        if (!side.length) {
          cy.log(`⚠️ [${label}] 사이드 메뉴 목록을 읽지 못했습니다 (셀렉터 확인 필요)`);
          return;
        }
        cy.log(`📌 [${label}] 화면의 사이드 메뉴: ${side.join(', ')}`);

        // 표시명 차이 기록 (예: 코드 '설정' ↔ 화면 '설정 (⚙)')
        side
          .filter((n) => baseName(n) !== n && menus.includes(baseName(n)))
          .forEach((n) => {
            labelLog.push({ mode: label, menu: baseName(n), shown: n });
            cy.log(`🏷 [${label}] 표시명 차이: '${baseName(n)}' → 화면에는 '${n}'`);
          });

        const { added, removed } = compare(side.map(baseName), menus);
        if (added.length) {
          cy.log(`🆕 [${label}] 새 사이드 메뉴: ${added.join(', ')} (메뉴 목록에 없어 하위 감지는 생략됨)`);
          diffs.push({ menu: '(사이드 메뉴)', type: 'added', items: added });
        }
        if (removed.length) {
          cy.log(`❌ [${label}] 사라진 사이드 메뉴: ${removed.join(', ')} (해당 메뉴 감지는 건너뜀)`);
          diffs.push({ menu: '(사이드 메뉴)', type: 'removed', items: removed });
          removed.forEach((m) => missing.push(m));
        }
      });

      // ---------- 사이드 메뉴 → 서브메뉴 ----------
      cy.fixture(F.base).then((baseline) => {
        menus.forEach((menu) => {
          cy.then(() => {
            if (missing.includes(menu)) {
              cy.log(`⏭ [${label}][${menu}] 화면에 없는 메뉴라 건너뜀`);
              return;
            }
            clickSideMenu(menu);

            cy.get('body').then(($body) => {
              const names = [...$body.find(SUBMENU_ITEM)]
                .map((el) => el.innerText.trim())
                .filter(Boolean);

              if (names.length === 0) {
                cy.log(`➖ [${label}][${menu}] 서브메뉴 없음`);
              }
              current[menu] = names;

              const { added, removed } = compare(names, baseline[menu] || []);
              if (added.length) {
                cy.log(`🆕 [${label}][${menu}] 새 서브메뉴: ${added.join(', ')}`);
                diffs.push({ menu, type: 'added', items: added });
              }
              if (removed.length) {
                cy.log(`❌ [${label}][${menu}] 사라진 서브메뉴: ${removed.join(', ')}`);
                diffs.push({ menu, type: 'removed', items: removed });
              }
              cy.writeFile(F.snap, current);
            });

            dismissAlerts(); // 메뉴 클릭으로 페이지 이동 시 뜬 알림창 닫기
            cy.get('body').type('{esc}');
            cy.wait(500);
          });
        });
      });

      cy.then(() => {
        cy.writeFile(F.diff, diffs);
      });

      // ---------- 서브메뉴 → 탭메뉴 ----------
      cy.fixture(F.tabBase).then((tabBaseline) => {
        cy.readFile(F.snap).then((snapshot) => {
          menus.forEach((menu) => {
            if (!(menu in snapshot)) return; // 건너뛴 메뉴
            const subs = snapshot[menu] || [];
            // 서브메뉴가 없는 메뉴는 버튼 클릭 후 이동한 화면의 탭을 기록
            const targets = subs.length ? subs : [NO_SUBMENU_KEY];

            targets.forEach((sub) => {
              clickSideMenu(menu);

              if (sub !== NO_SUBMENU_KEY) {
                cy.contains(SUBMENU_ITEM, exact(sub)).click({ force: true });
              }
              cy.wait(3000); // 페이지 로딩 대기

              // 탭 결과 기록 + 기준 비교
              const recordTabs = (tabs) => {
                tabCurrent[menu] = tabCurrent[menu] || {};
                tabCurrent[menu][sub] = tabs;

                const base = (tabBaseline[menu] || {})[sub] || [];
                const { added, removed } = compare(tabs, base);
                if (added.length) {
                  cy.log(`🆕 [${label}][${menu} > ${sub}] 새 탭: ${added.join(', ')}`);
                  tabDiffs.push({ menu, sub, type: 'added', items: added });
                }
                if (removed.length) {
                  cy.log(`❌ [${label}][${menu} > ${sub}] 사라진 탭: ${removed.join(', ')}`);
                  tabDiffs.push({ menu, sub, type: 'removed', items: removed });
                }
                cy.writeFile(F.tabSnap, tabCurrent);
              };

              cy.get('body').then(($body) => {
                const tabs = collectTabs($body);
                const base = (tabBaseline[menu] || {})[sub] || [];

                // 기준에는 탭이 있는데 0개로 읽히면: 화면 로딩 지연/남은 창일 수 있으니 한 번 더 확인
                if (tabs.length === 0 && base.length > 0) {
                  cy.log(`⏳ [${label}][${menu} > ${sub}] 탭이 읽히지 않아 3초 후 다시 확인`);
                  dismissAlerts();
                  cy.wait(3000);
                  cy.get('body').then(($b2) => recordTabs(collectTabs($b2)));
                } else {
                  recordTabs(tabs);
                }
              });

              dismissAlerts(); // 페이지 진입 시 뜬 알림창 닫기
              cy.get('body').type('{esc}');
              cy.wait(500);
            });
          });
        });
      });

      cy.then(() => {
        cy.writeFile(F.tabDiff, tabDiffs);
        cy.log(`==================== ✔ [${label}] 메뉴 감지 완료 ====================`);
      });

      // 요약은 테스트 마지막에 printSummary로 출력
      return { label, menus, F, diffs, tabDiffs };
    };


    // ==========================================
    // 결과 요약 출력 함수 (저장된 파일 기준)
    // ==========================================
    const printSummary = ({ label, menus, F, diffs, tabDiffs }) => {
      cy.readFile(F.snap).then((snapshot) => {
        cy.readFile(F.tabSnap).then((tabSnapshot) => {
          cy.log(`==================== 📋 [${label}] 메뉴 점검 결과 ====================`);
          menus.forEach((menu) => {
            const subs = snapshot[menu] || [];
            cy.log(`■ [${menu}] 서브메뉴 ${subs.length}개`);

            const tabMap = tabSnapshot[menu] || {};
            Object.keys(tabMap).forEach((sub) => {
              const tabs = tabMap[sub];
              cy.log(`   └ ${sub}: 탭 ${tabs.length}개${tabs.length ? ` (${tabs.join(', ')})` : ''}`);
            });
          });
        });
      });

      cy.then(() => {
        if (diffs.length === 0 && tabDiffs.length === 0) {
          cy.log(`✅ [${label}] 기준(baseline) 대비 변경 없음 (서브메뉴 / 탭)`);
        } else {
          cy.log(`⚠️ [${label}] 기준 대비 변경: 서브메뉴 ${diffs.length}건, 탭 ${tabDiffs.length}건`);
          diffs.forEach((d) => {
            const mark = d.type === 'added' ? '🆕 추가' : '❌ 삭제';
            cy.log(`${mark} [${d.menu}] ${d.items.join(', ')}`);
          });
          tabDiffs.forEach((d) => {
            const mark = d.type === 'added' ? '🆕 탭 추가' : '❌ 탭 삭제';
            cy.log(`${mark} [${d.menu} > ${d.sub}] ${d.items.join(', ')}`);
          });
        }

        diffs.forEach((d) => allDiffs.push({ mode: label, ...d }));
        tabDiffs.forEach((d) => allDiffs.push({ mode: label, ...d }));

        // 사이드 메뉴 표시명 차이 (변경 판정에는 포함하지 않고 참고용으로 표시)
        const myLabels = labelLog.filter((l) => l.mode === label);
        if (myLabels.length) {
          cy.log(`🏷 [${label}] 사이드 메뉴 표시명 차이 ${myLabels.length}건 (같은 메뉴로 점검함)`);
          myLabels.forEach((l) => cy.log(`   └ ${l.menu} → 화면 표시: ${l.shown}`));
        }

        // 수행 중 닫은 알림창 (변경 판정에는 포함하지 않고 참고용으로 표시)
        const myAlerts = alertLog.filter((a) => a.mode === label);
        if (myAlerts.length) {
          cy.log(`🔔 [${label}] 수행 중 알림창 ${myAlerts.length}건 (자동으로 닫음)`);
          myAlerts.forEach((a) => cy.log(`   └ ${a.where} : ${a.message}${a.stuck ? '  ⛔ 닫히지 않음' : ''}`));
        }
      });
    };


    // ==========================================
    // STEP 1: 로그인
    // ==========================================
    // 대상 서버: 실행 시 --env HOST=10.10.54.21 로 바꿀 수 있음 (기본 51)
    const HOST = Cypress.env('HOST') || '10.10.54.51';
    cy.log(`🖥 대상 서버: ${HOST}`);
    cy.visit(`https://${HOST}:18443/logcatch/login`);
    cy.wait(4000); // 로딩 대기

    // 흰 화면이면 새로고침
    cy.get('body').then(($body) => {
      if ($body.find('input[aria-label="사용자 계정"]').length === 0) {
        cy.log('🔴 화면 렌더링 실패 감지! 페이지를 새로고침합니다.');
        cy.reload();
        cy.wait(2000);
      } else {
        cy.log('🟢 화면이 정상적으로 로드되었습니다.');
      }
    });

    cy.get('input[aria-label="사용자 계정"]').should('exist').type('admin', { force: true });
    cy.get('input[aria-label="패스워드"]').should('exist').type('Manager1!', { force: true });
    cy.get('input[aria-label="패스워드"]').type('{enter}', { force: true });

    // "이미 접속 중인 계정" 알림창 처리
    cy.wait(2000);
    cy.get('body').then(($body) => {
      if ($body.find('.v-card__title:contains("이미 접속 중인 계정입니다."):visible').length > 0) {
        cy.log('⚠️ 알림창 발견! 확인 버튼을 클릭합니다.');
        cy.contains('.v-card__title', '이미 접속 중인 계정입니다.')
          .closest('.v-card')
          .contains('확인')
          .click({ force: true });
        cy.wait(1000);
      } else {
        cy.log('✅ 알림창이 없습니다. 넘어갑니다.');
      }
    });

    // 로그인 성공 검증
    cy.url({ timeout: 10000 }).should('not.include', '/login');
    cy.wait(3000); // 화면 안정화 대기


    // ==========================================
    // STEP 2: [일반 모드] 메뉴 감지
    // ==========================================
    const userResult = runMenuDetection({ label: '일반', menus: USER_MENUS, prefix: '' });


    // ==========================================
    // STEP 3: 관리자 페이지 진입 (상단 톱니바퀴 클릭)
    // ==========================================
    cy.log('🚀 관리자(톱니바퀴) 버튼 클릭');
    dismissAlerts(); // 남아 있는 알림창이 톱니바퀴를 가리지 않도록 먼저 닫기
    cy.get('.g-IConfig').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('✅ 관리자 페이지 진입 완료');


    // ==========================================
    // STEP 4: [관리자 모드] 메뉴 감지
    // ==========================================
    const adminResult = runMenuDetection({ label: '관리자', menus: ADMIN_MENUS, prefix: 'admin-' });


    // ==========================================
    // STEP 5: 전체 결과 요약 (일반 + 관리자 한 번에) + 엄격 모드 판정
    // ==========================================
    cy.log('##################### 📊 전체 메뉴 점검 결과 #####################');
    printSummary(userResult);
    printSummary(adminResult);

    cy.then(() => {
      cy.writeFile('cypress/results/menu-all-diff.json', allDiffs);
      cy.writeFile('cypress/results/menu-alerts.json', alertLog);
      cy.writeFile('cypress/results/menu-labels.json', labelLog);
      cy.log('##################################################################');
      if (allDiffs.length === 0) {
        cy.log('✅✅ 전체(일반 + 관리자) 메뉴 변경 없음');
      } else {
        cy.log(`⚠️⚠️ 전체 변경 ${allDiffs.length}건 → cypress/results/menu-all-diff.json 확인`);
      }

      // --env MENU_STRICT=true 로 실행하면 변경이 있을 때 실패 처리
      if (Cypress.env('MENU_STRICT')) {
        expect(allDiffs, '메뉴 변경 내역 (일반 + 관리자)').to.be.empty;
      }
    });


    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 모든 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });

  });
});
/** 코드 마지막 */