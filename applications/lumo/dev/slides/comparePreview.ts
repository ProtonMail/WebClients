/**
 * Canvas preview vs .pptx (development only; nothing here ships).
 *
 *   node_modules/.bin/tsx applications/lumo/dev/slides/comparePreview.ts <evalOutDir>
 *
 * Run runSlidesEval.ts into the same directory first: it leaves one LibreOffice PNG per slide.
 * This bundles previewHarness.tsx with esbuild, screenshots each slide in Chrome with Playwright,
 * and writes <id>-compare.png per fixture: the preview on the left, LibreOffice's render of the
 * .pptx on the right.
 */
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { build } from 'esbuild';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { chromium } from 'playwright';

import { SLIDES_EVAL_FIXTURES } from '../../src/app/util/slides/eval/slidesEvalFixtures';

const main = async () => {
    const outDir = path.resolve(process.argv[2] ?? 'slides-eval-out');
    const previewDir = path.join(outDir, 'preview');
    mkdirSync(previewDir, { recursive: true });

    await build({
        entryPoints: [path.join(__dirname, 'previewHarness.tsx')],
        bundle: true,
        outfile: path.join(previewDir, 'harness.js'),
        platform: 'browser',
        format: 'iife',
        jsx: 'automatic',
        loader: { '.scss': 'empty', '.css': 'empty', '.svg': 'dataurl', '.png': 'dataurl' },
        define: { 'process.env.NODE_ENV': '"production"' },
        logLevel: 'error',
    });
    writeFileSync(
        path.join(previewDir, 'index.html'),
        '<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0"><div id="root"></div><script src="harness.js"></script></body></html>'
    );

    // The installed Chrome, so no browser download is needed.
    const browser = await chromium.launch({ channel: 'chrome' });
    const page = await browser.newPage({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: 1 });
    const errors: string[] = [];
    page.on('pageerror', (error) => {
        errors.push(error.message);
    });
    await page.goto(`file://${path.join(previewDir, 'index.html')}`);
    await page.waitForSelector('[data-slide]');
    // Charts render asynchronously; wait until no slide still shows a loader.
    await page
        .waitForFunction(
            () => {
                return document.querySelectorAll('[data-slide] .circle-loader').length === 0;
            },
            undefined,
            { timeout: 30000 }
        )
        .catch(() => {
            errors.push('Charts did not finish rendering within 30 s.');
        });

    for (const element of await page.$$('[data-slide]')) {
        const name = await element.getAttribute('data-slide');
        await element.screenshot({ path: path.join(previewDir, `${name}.png`) });
    }
    await browser.close();

    for (const fixture of SLIDES_EVAL_FIXTURES) {
        const rows: { preview: string; pptx: string }[] = [];
        for (let slide = 1; existsSync(path.join(previewDir, `${fixture.id}-slide${slide}.png`)); slide++) {
            rows.push({
                preview: path.join(previewDir, `${fixture.id}-slide${slide}.png`),
                pptx: path.join(outDir, `${fixture.id}-slide${slide}.png`),
            });
        }
        const thumbWidth = 640;
        const thumbHeight = 360;
        const gap = 12;
        const canvas = createCanvas(2 * thumbWidth + 3 * gap, rows.length * (thumbHeight + gap) + gap);
        const context = canvas.getContext('2d');
        context.fillStyle = '#9a9aa5';
        context.fillRect(0, 0, canvas.width, canvas.height);
        for (const [index, row] of rows.entries()) {
            const y = gap + index * (thumbHeight + gap);
            context.drawImage(await loadImage(readFileSync(row.preview)), gap, y, thumbWidth, thumbHeight);
            if (existsSync(row.pptx)) {
                context.drawImage(
                    await loadImage(readFileSync(row.pptx)),
                    2 * gap + thumbWidth,
                    y,
                    thumbWidth,
                    thumbHeight
                );
            }
        }
        writeFileSync(path.join(outDir, `${fixture.id}-compare.png`), canvas.toBuffer('image/png'));
    }

    console.log(errors.length > 0 ? `Page errors:\n${errors.join('\n')}` : 'No page errors.');
    console.log(`Wrote ${SLIDES_EVAL_FIXTURES.length} comparison sheets to ${outDir}`);
};

void main();
