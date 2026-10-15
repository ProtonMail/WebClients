/**
 * Model eval for slide decks, through the running app (development only).
 *
 *   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --remote-debugging-port=9333 \
 *       --user-data-dir=<scratch profile> --ignore-certificate-errors https://lumo.proton.dev/
 *   (log in once in that window and leave it open)
 *   node_modules/.bin/tsx applications/lumo/dev/slides/runModelEval.ts http://127.0.0.1:9333 <outDir> [url]
 *
 * For each prompt: turns `LumoArtifactSlides`
 * on by rewriting the flag response, sends the prompt in a new chat, waits for the creation,
 * screenshots the canvas, copies the deck JSON (title menu → Copy) and downloads the .pptx
 * (Download → PowerPoint). Then scores each deck with the same checks as the renderer eval and
 * renders the downloaded files through LibreOffice. Writes report.md / report.json to <outDir>.
 *
 * Each prompt runs once, so this shows what the model does, not how often it does it.
 */
import { DOMParser } from '@xmldom/xmldom';
import { execFileSync } from 'child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { chromium } from 'playwright';

import { findUnsourcedNumbers } from '../../src/app/util/slides/checks/dataChecks';
import { inspectPptx } from '../../src/app/util/slides/checks/inspectPptx';
import { checkLayout } from '../../src/app/util/slides/checks/layoutChecks';
import { isMissingChart } from '../../src/app/util/slides/deck';
import { looksLikeDeckJson, readDeckContent } from '../../src/app/util/slides/deckContent';
import { deckToPptxBytes } from '../../src/app/util/slides/deckToPptx';
import { SLIDES_EVAL_FIXTURES } from '../../src/app/util/slides/eval/slidesEvalFixtures';
import { layoutDeck } from '../../src/app/util/slides/layoutDeck';

(globalThis as any).DOMParser = DOMParser;

const SOFFICE = '/Applications/LibreOffice.app/Contents/MacOS/soffice';
const CREATION_TIMEOUT_MS = 4 * 60 * 1000;

const sourceOf = (id: string): string => {
    return SLIDES_EVAL_FIXTURES.find((fixture) => {
        return fixture.id === id;
    })!.source;
};

interface EvalPrompt {
    id: string;
    purpose: string;
    prompt: string;
}

const PROMPTS: EvalPrompt[] = [
    {
        id: 'northwind-memo',
        purpose: 'Memo with a table → deck with charts; every number is in the memo',
        prompt: `Turn this memo into a short slide deck for the leadership team.\n\n${sourceOf('northwind-q3')}`,
    },
    {
        id: 'pilot-feedback',
        purpose: 'Prose only: should be bullets, no charts with made-up numbers',
        prompt: `Make a few slides summarising this pilot feedback.\n\n${sourceOf('dense-bullets')}`,
    },
    {
        id: 'onboarding',
        purpose: 'Long checklist: tests splitting and bullet limits',
        prompt: `Create an onboarding slide deck for new engineers from this checklist.\n\n${sourceOf('split-list')}`,
    },
    {
        id: 'german-status',
        purpose: 'German input: slides in German, long compound words',
        prompt: `Erstelle eine kurze Präsentation zum Projektstatus aus diesen Notizen.\n\n${sourceOf('german-compounds')}`,
    },
    {
        id: 'pitch-missing-market',
        purpose: 'Market size slide asked for, source says the numbers are missing: must flag, not invent',
        prompt: `Make a seed pitch deck for my startup. Include a market size slide.\n\n${sourceOf('missing-data')}`,
    },
    {
        id: 'tickets-average',
        purpose: 'Chart plus a computed average: the average should be listed as calculated',
        prompt: `Make one slide with a chart of last week's support tickets, and mention the weekly average.\n\n${sourceOf('invented-number')}`,
    },
    {
        id: 'trial-pie',
        purpose: 'Shares → pie chart with % unit',
        prompt: `Make a slide showing where our trial users came from in September.\n\n${sourceOf('pie-shares')}`,
    },
    {
        id: 'no-data-market',
        purpose: 'No data given at all: charts must be "missing", not invented',
        prompt: 'Make a 5-slide deck about the European coffee market, with charts of market size by country.',
    },
];

const main = async () => {
    const cdpUrl = process.argv[2] ?? 'http://127.0.0.1:9333';
    const outDir = path.resolve(process.argv[3]!);
    const baseUrl = process.argv[4] ?? 'https://lumo.proton.dev/';
    mkdirSync(outDir, { recursive: true });

    // Attach to a Chrome started by hand with --remote-debugging-port (see the usage note), so one
    // login lasts across runs: the session lives in the tab and doesn't survive a browser restart.
    const browser = await chromium.connectOverCDP(cdpUrl);
    const context = browser.contexts()[0]!;
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(baseUrl).origin });

    let flagResponses = 0;
    // The Unleash toolbar is off under automation, so the flag is turned on in the response itself.
    await context.route(/api\/feature\/v2\/frontend/, async (route) => {
        // route.fetch() runs in Node, which must trust the local proton.dev CA: run with
        // NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem". Anything that fails passes through.
        let response;
        try {
            response = await route.fetch();
        } catch (error) {
            console.log(
                `Flag request passed through unchanged: ${error instanceof Error ? error.message.split('\n')[0] : error}`
            );
            await route.continue();
            return;
        }
        let json: any;
        try {
            json = JSON.parse(await response.text());
        } catch {
            json = undefined;
        }
        // Same path also takes metrics posts that answer "ok"; only flag lists are rewritten.
        if (!json || !Array.isArray(json.toggles)) {
            await route.fulfill({ response });
            return;
        }
        const toggles = json.toggles.filter((toggle: { name: string }) => {
            return toggle.name !== 'LumoArtifactSlides';
        });
        // SLIDES_FLAG=off keeps the flag off, to compare against today's HTML decks.
        toggles.push({
            name: 'LumoArtifactSlides',
            enabled: process.env.SLIDES_FLAG !== 'off',
            variant: { name: 'disabled', enabled: false },
        });
        flagResponses += 1;
        await route.fulfill({ response, json: { ...json, toggles } });
    });

    const page =
        context.pages().find((candidate) => {
            return candidate.url().startsWith(new URL(baseUrl).origin);
        }) ?? context.pages()[0]!;
    await page.bringToFront();
    const results: any[] = [];
    // Errors the app logs while a prompt runs: a render loop or crash shows up against that prompt.
    let consoleErrors: string[] = [];
    page.on('pageerror', (error) => {
        consoleErrors.push(`pageerror: ${error.message}`);
    });
    page.on('console', (message) => {
        if (message.type() === 'error') {
            consoleErrors.push(message.text().slice(0, 300));
        }
    });

    const isLoggedIn = async (): Promise<boolean> => {
        const current = new URL(page.url());
        return (
            current.host === new URL(baseUrl).host &&
            !current.pathname.startsWith('/guest') &&
            (await page.locator('textarea.composer').count()) > 0
        );
    };
    const loginDeadline = Date.now() + 15 * 60 * 1000;
    if (!(await isLoggedIn())) {
        console.log('Log in in the Chrome window; the eval starts once you are on the logged-in Lumo page.');
    }
    while (!(await isLoggedIn())) {
        if (Date.now() > loginDeadline) {
            console.log('Timed out waiting for login.');
            await browser.close();
            process.exit(1);
        }
        await page.waitForTimeout(2000);
    }
    // Always the account's new-chat page (/u/N/), never the conversation the browser happens to
    // be on: otherwise every prompt lands in the same chat, and earlier prompts count as sources.
    const accountPrefix = new URL(page.url()).pathname.match(/^\/u\/\d+/)?.[0] ?? '';
    const newChatUrl = `${new URL(baseUrl).origin}${accountPrefix}/`;
    console.log(`Logged in; new chats at ${newChatUrl}`);
    const seenConversations = new Set<string>();

    // ONLY=<id>,<id> runs a subset, e.g. to try the setup on one prompt first.
    const only = process.env.ONLY?.split(',');
    const prompts = only
        ? PROMPTS.filter((item) => {
              return only.includes(item.id);
          })
        : PROMPTS;

    for (const item of prompts) {
        const result: any = { id: item.id, purpose: item.purpose };
        consoleErrors = [];
        results.push(result);
        console.log(`→ ${item.id}`);
        try {
            await page.goto(newChatUrl);
            const composer = page.locator('textarea.composer');
            await composer.waitFor({ timeout: 30000 });
            result.url = page.url();
            if (new URL(page.url()).pathname.startsWith('/guest')) {
                throw new Error('Not logged in (guest mode); run modelEvalLogin.ts again.');
            }
            await composer.fill(item.prompt);
            await composer.press('Enter');

            const titleMenu = page.locator('button[title="Versions and actions"]');
            const started = Date.now();
            await titleMenu.first().waitFor({ timeout: CREATION_TIMEOUT_MS });
            const conversation = new URL(page.url()).pathname.match(/\/c\/([^/]+)/)?.[1];
            if (!conversation || seenConversations.has(conversation)) {
                throw new Error(`Prompt did not start a new chat (${page.url()}).`);
            }
            seenConversations.add(conversation);
            result.conversation = conversation;
            result.secondsToCreation = Math.round((Date.now() - started) / 1000);
            // Let the preview settle after the panel opens.
            await page.waitForTimeout(2500);
            await page.screenshot({ path: path.join(outDir, `${item.id}-app.png`) });
            // The app's own check counts web results as sources; the eval only sees the prompt,
            // so the banner's numbers are the ones that count.
            const panelText = await page.locator('body').innerText();
            result.appUnsourced = Number(panelText.match(/(\d+) numbers? (?:isn't|aren't) in your messages/)?.[1] ?? 0);
            result.appCalculated = Number(panelText.match(/(\d+) numbers? (?:was|were) calculated/)?.[1] ?? 0);
            result.appUnreadable = panelText.includes("This slide deck couldn't be read.");

            // Menus render in a portal as role="dialog"; scoping to it skips the chat's own Copy button.
            const menus = page.locator('[role="dialog"]');
            await titleMenu.first().click();
            await menus.getByRole('button', { name: /^Copy/ }).first().click();
            await page.waitForTimeout(500);
            const content = (await page.evaluate('navigator.clipboard.readText()')) as string;
            writeFileSync(path.join(outDir, `${item.id}.json`), content);
            result.isJsonDeck = looksLikeDeckJson(content);

            const parsed = readDeckContent(content);
            result.parseIssues = parsed?.issues ?? [];
            const deck = parsed?.deck;
            if (deck) {
                result.slides = deck.slides.length;
                result.layouts = deck.slides.map((slide) => {
                    return slide.layout;
                });
                result.charts = deck.slides.filter((slide) => {
                    return slide.layout === 'chart' && !isMissingChart(slide.chart);
                }).length;
                result.missingCharts = deck.slides.filter((slide) => {
                    return slide.layout === 'chart' && isMissingChart(slide.chart);
                }).length;
                result.gaps = deck.gaps;
                result.notes = deck.slides.filter((slide) => {
                    return Boolean(slide.notes);
                }).length;
                const findings = findUnsourcedNumbers(deck, item.prompt);
                result.unsourced = findings.filter((finding) => {
                    return !finding.calculatedAs;
                });
                result.calculated = findings.filter((finding) => {
                    return finding.calculatedAs;
                });
            }

            if (result.isJsonDeck && deck) {
                await titleMenu.first().click();
                // On desktop the submenu opens on hover; a click would toggle it shut again.
                await menus
                    .getByRole('button', { name: /^Download/ })
                    .first()
                    .hover();
                const powerPoint = menus.getByRole('button', { name: /PowerPoint/ }).first();
                await powerPoint.waitFor({ timeout: 10000 });
                const pptxPath = path.join(outDir, `${item.id}.pptx`);
                try {
                    const [download] = await Promise.all([
                        page.waitForEvent('download', { timeout: 30000 }),
                        powerPoint.click(),
                    ]);
                    await download.saveAs(pptxPath);
                    result.pptxFrom = 'app download';
                } catch {
                    // Downloads aren't always reported over CDP; build the file with the app's own code path.
                    await page.keyboard.press('Escape');
                    writeFileSync(pptxPath, Buffer.from(await deckToPptxBytes(layoutDeck(deck!))));
                    result.pptxFrom = 'built from copied JSON';
                }
                const inspected = await inspectPptx(new Uint8Array(readFileSync(pptxPath)).buffer);
                result.pptxSlides = inspected.slides.length;
                result.layoutFindings = checkLayout(inspected);
                result.pictures = inspected.slides.flatMap((slide) => {
                    return slide.shapes.filter((shape) => {
                        return shape.kind === 'picture';
                    });
                }).length;
            }
        } catch (error) {
            result.error = error instanceof Error ? error.message.split('\n')[0] : String(error);
            if (await page.getByText('Something went wrong').count()) {
                result.error += ' (app error page shown)';
            }
            await page.screenshot({ path: path.join(outDir, `${item.id}-error.png`) }).catch(() => {});
        }
        result.consoleErrors = consoleErrors.filter((text) => {
            // Known dev-only noise: dev-server compile warnings and missing native bridges.
            return !/webpack-dev-server|Native .* Bridge|Payment Bridge/.test(text);
        });
    }
    // Over CDP, close() only disconnects; the logged-in window stays open for the next run.
    await browser.close();

    const pptxFiles = results
        .filter((result) => {
            return result.pptxSlides;
        })
        .map((result) => {
            return path.join(outDir, `${result.id}.pptx`);
        });
    if (pptxFiles.length > 0) {
        const profile = path.join(outDir, '.lo-profile');
        execFileSync(
            SOFFICE,
            [
                `-env:UserInstallation=file://${profile}`,
                '--headless',
                '--convert-to',
                'pdf',
                '--outdir',
                outDir,
                ...pptxFiles,
            ],
            { stdio: 'pipe' }
        );
    }

    const lines = [
        '# Slides model eval',
        '',
        `${new Date().toISOString()} · ${baseUrl} · flag responses rewritten: ${flagResponses}. One run per prompt.`,
        '',
        '| Prompt | JSON deck | Slides (pptx) | Layouts | Charts / missing | Parse errors / warnings | Layout findings | App banner: unsourced / calculated | Gaps | Notes | Time to creation |',
        '| ------ | --------- | ------------- | ------- | ---------------- | ----------------------- | --------------- | ---------------------------------- | ---- | ----- | ---------------- |',
    ];
    for (const result of results) {
        if (result.error) {
            lines.push(`| ${result.id} | error: ${result.error} | | | | | | | | | |`);
            continue;
        }
        const errors = (result.parseIssues ?? []).filter((issue: any) => {
            return issue.severity === 'error';
        }).length;
        lines.push(
            `| ${result.id} | ${result.isJsonDeck ? 'yes' : '**NO**'} | ${result.slides ?? '—'} (${result.pptxSlides ?? '—'}) | ${(result.layouts ?? []).join(', ')} | ${result.charts ?? 0} / ${result.missingCharts ?? 0} | ${errors} / ${(result.parseIssues ?? []).length - errors} | ${(result.layoutFindings ?? []).length} | ${result.appUnreadable ? 'deck unreadable' : `${result.appUnsourced ?? '—'} / ${result.appCalculated ?? '—'}`} | ${(result.gaps ?? []).length} | ${result.notes ?? 0} | ${result.secondsToCreation ?? '—'} s |`
        );
    }
    lines.push('', '## Details', '');
    for (const result of results) {
        lines.push(`### ${result.id}`, '', result.purpose, '');
        for (const issue of result.parseIssues ?? []) {
            lines.push(`- parse ${issue.severity}: \`${issue.path}\` ${issue.message}`);
        }
        for (const finding of result.layoutFindings ?? []) {
            lines.push(`- check ${finding.check}: slide ${finding.slide} ${finding.shape}: ${finding.message}`);
        }
        for (const finding of result.unsourced ?? []) {
            lines.push(
                `- not in the prompt (web results not checked here): slide ${finding.sourceSlide + 1} ${finding.where}: ${finding.value}`
            );
        }
        for (const finding of result.calculated ?? []) {
            lines.push(
                `- calculated: slide ${finding.sourceSlide + 1} ${finding.where}: ${finding.value} (${finding.calculatedAs})`
            );
        }
        for (const gap of result.gaps ?? []) {
            lines.push(`- gap: ${gap}`);
        }
        for (const text of result.consoleErrors ?? []) {
            lines.push(`- console error: ${text}`);
        }
        lines.push('');
    }
    writeFileSync(path.join(outDir, 'report.md'), lines.join('\n'));
    writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(results, null, 2));
    console.log(lines.slice(0, 6 + results.length).join('\n'));
};

void main();
