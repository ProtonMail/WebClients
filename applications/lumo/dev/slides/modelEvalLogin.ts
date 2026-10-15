/**
 * One-time login for the model eval (development only).
 *
 *   node_modules/.bin/tsx applications/lumo/dev/slides/modelEvalLogin.ts <profileDir> <outDir> [url]
 *
 * Opens Chrome with a persistent profile, waits (up to 15 min) for a person to log in and for the
 * Lumo composer to appear, then writes the composer's structure to <outDir>/dom.json so the eval's
 * selectors can be written against the real page. The profile holds a live session: keep it out of
 * the repository and delete it when done.
 */
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const main = async () => {
    const profileDir = path.resolve(process.argv[2]!);
    const outDir = path.resolve(process.argv[3]!);
    const url = process.argv[4] ?? 'https://lumo.proton.dev/';
    mkdirSync(outDir, { recursive: true });

    const context = await chromium.launchPersistentContext(profileDir, {
        channel: 'chrome',
        headless: false,
        ignoreHTTPSErrors: true,
        viewport: { width: 1400, height: 900 },
    });
    const page = context.pages()[0] ?? (await context.newPage());
    await page.goto(url);
    console.log('Waiting for login…');

    const deadline = Date.now() + 15 * 60 * 1000;
    let ready = false;
    while (Date.now() < deadline && !ready) {
        await page.waitForTimeout(2000);
        try {
            const current = new URL(page.url());
            // Guest mode has a composer too, so it doesn't count as logged in.
            ready =
                current.host === new URL(url).host &&
                !current.pathname.startsWith('/guest') &&
                (await page.locator('textarea, [contenteditable="true"]').count()) > 0;
        } catch {
            ready = false;
        }
    }
    if (!ready) {
        console.log('Timed out waiting for login.');
        await context.close();
        process.exit(1);
    }
    await page.waitForTimeout(3000);

    // A string, not a function: tsx adds a `__name` helper to functions, which doesn't exist in the page.
    const dom = (await page.evaluate(`(() => {
        const describe = (element) => ({
            tag: element.tagName.toLowerCase(),
            id: element.id || undefined,
            classes: typeof element.className === 'string' ? element.className : undefined,
            testId: element.getAttribute('data-testid') ?? undefined,
            ariaLabel: element.getAttribute('aria-label') ?? undefined,
            placeholder: element.getAttribute('placeholder') ?? undefined,
            title: element.getAttribute('title') ?? undefined,
            text: (element.textContent ?? '').trim().slice(0, 60) || undefined,
        });
        return {
            url: location.href,
            inputs: Array.from(document.querySelectorAll('textarea, [contenteditable="true"]')).map(describe),
            buttons: Array.from(document.querySelectorAll('button')).map(describe).slice(0, 80),
        };
    })()`)) as { url: string };
    writeFileSync(path.join(outDir, 'dom.json'), JSON.stringify(dom, null, 2));
    console.log(`Logged in at ${dom.url}. Wrote ${path.join(outDir, 'dom.json')}.`);
    await context.close();
};

void main();
