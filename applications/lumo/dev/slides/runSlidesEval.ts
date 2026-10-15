/**
 * Slides eval runner (development only; nothing here ships in the app).
 *
 *   node_modules/.bin/tsx applications/lumo/dev/slides/runSlidesEval.ts <outDir>
 *
 * For each eval fixture: parse → lay out → write .pptx → read it back and run the layout and data
 * checks. Then LibreOffice (headless) converts every .pptx to PDF, an independent renderer, and
 * pdf.js draws each page to PNG and reports where LibreOffice actually put each piece of text, so
 * text that ends up outside its box is caught even if our own measurement says it fits.
 *
 * Needs LibreOffice at /Applications/LibreOffice.app (brew install --cask libreoffice).
 * Writes <id>.pptx, <id>.pdf, <id>-slide<N>.png, <id>-sheet.png, report.md and report.json.
 */
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { DOMParser } from '@xmldom/xmldom';
import { execFileSync } from 'child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import path from 'path';

import { findUnsourcedNumbers } from '../../src/app/util/slides/checks/dataChecks';
import { type InspectedDeck, inspectPptx } from '../../src/app/util/slides/checks/inspectPptx';
import { checkLayout } from '../../src/app/util/slides/checks/layoutChecks';
import { isMissingChart, parseDeck } from '../../src/app/util/slides/deck';
import { deckToPptxBytes } from '../../src/app/util/slides/deckToPptx';
import { SLIDES_EVAL_FIXTURES } from '../../src/app/util/slides/eval/slidesEvalFixtures';
import { layoutDeck } from '../../src/app/util/slides/layoutDeck';

const SOFFICE = '/Applications/LibreOffice.app/Contents/MacOS/soffice';
const RENDER_SCALE = 1.5;
/** How far rendered text may stray outside its box before it counts, in inches (≈ 2pt). */
const RENDER_TOLERANCE_IN = 0.03;
// Arial's ascent and descent, as fractions of the font size, to turn a baseline into a text box.
const ASCENT = 0.905;
const DESCENT = 0.212;

(globalThis as any).DOMParser = DOMParser;

interface RenderedFinding {
    slide: number;
    text: string;
    shape: string;
    byIn: number;
}

const normalize = (text: string): string => {
    return text.replace(/\s+/g, '');
};

/** Text pdf.js finds outside the box of the shape it belongs to. Text inside a chart is skipped. */
const checkRenderedText = async (pdfPath: string, inspected: InspectedDeck, outPrefix: string) => {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const document = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(pdfPath)) }).promise;
    const findings: RenderedFinding[] = [];
    const missingText: { slide: number; shape: string; characters: string }[] = [];
    const pngs: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
        const page = await document.getPage(pageNumber);
        const viewport = page.getViewport({ scale: RENDER_SCALE });
        const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
        await page.render({ canvas: canvas as any, canvasContext: canvas.getContext('2d') as any, viewport }).promise;
        const pngPath = `${outPrefix}-slide${pageNumber}.png`;
        writeFileSync(pngPath, canvas.toBuffer('image/png'));
        pngs.push(pngPath);

        const slide = inspected.slides[pageNumber - 1];
        if (!slide) {
            continue;
        }
        const pageHeightPt = page.getViewport({ scale: 1 }).height;
        const content = await page.getTextContent();
        // Text that the renderer dropped (e.g. no font with those characters) never shows up as
        // misplaced, so check that every character of every text shape made it onto the page.
        const pageCharacters = new Set(
            normalize(
                (content.items as any[])
                    .map((item) => {
                        return item.str ?? '';
                    })
                    .join('')
            )
        );
        for (const shape of slide.shapes) {
            const shapeText = normalize(
                shape.paragraphs
                    .map((paragraph) => {
                        return paragraph.text;
                    })
                    .join('')
            );
            const missing = Array.from(new Set(shapeText)).filter((character) => {
                return !pageCharacters.has(character);
            });
            if (missing.length > 0) {
                missingText.push({
                    slide: pageNumber,
                    shape: shape.placeholder ?? shape.name,
                    characters: missing.join(''),
                });
            }
        }
        for (const item of content.items as any[]) {
            const text = normalize(item.str ?? '');
            // Bullet characters and spaces aren't in the shape text.
            if (text.length < 2) {
                continue;
            }
            const size = Math.hypot(item.transform[2], item.transform[3]);
            const left = item.transform[4] / 72;
            const baseline = (pageHeightPt - item.transform[5]) / 72;
            const box = {
                left,
                right: left + item.width / 72,
                top: baseline - (size * ASCENT) / 72,
                bottom: baseline + (size * DESCENT) / 72,
            };
            const centerX = (box.left + box.right) / 2;
            const centerY = (box.top + box.bottom) / 2;

            const inChart = slide.shapes.some((shape) => {
                const { x, y, w, h } = shape.box;
                return shape.kind === 'chart' && centerX >= x && centerX <= x + w && centerY >= y && centerY <= y + h;
            });
            if (inChart) {
                continue;
            }
            const candidates = slide.shapes.filter((shape) => {
                return (
                    shape.kind === 'text' &&
                    normalize(
                        shape.paragraphs
                            .map((paragraph) => {
                                return paragraph.text;
                            })
                            .join('')
                    ).includes(text)
                );
            });
            if (candidates.length === 0) {
                continue;
            }
            const distance = (shape: (typeof candidates)[number]): number => {
                const { x, y, w, h } = shape.box;
                const dx = Math.max(x - centerX, 0, centerX - (x + w));
                const dy = Math.max(y - centerY, 0, centerY - (y + h));
                return Math.hypot(dx, dy);
            };
            const shape = candidates.sort((a, b) => {
                return distance(a) - distance(b);
            })[0]!;
            const { x, y, w, h } = shape.box;
            const by = Math.max(x - box.left, box.right - (x + w), y - box.top, box.bottom - (y + h), 0);
            if (by > RENDER_TOLERANCE_IN) {
                findings.push({ slide: pageNumber, text: item.str, shape: shape.placeholder ?? shape.name, byIn: by });
            }
        }
    }
    return { findings, missingText, pngs, pages: document.numPages };
};

/** All slides of one deck side by side, two per row, for viewing in one image. */
const writeContactSheet = async (pngs: string[], sheetPath: string): Promise<void> => {
    const images = await Promise.all(
        pngs.map((png) => {
            return loadImage(readFileSync(png));
        })
    );
    const thumbWidth = 720;
    const thumbHeight = Math.round((thumbWidth * 5.625) / 10);
    const gap = 16;
    const columns = 2;
    const rows = Math.ceil(images.length / columns);
    const canvas = createCanvas(columns * thumbWidth + (columns + 1) * gap, rows * thumbHeight + (rows + 1) * gap);
    const context = canvas.getContext('2d');
    context.fillStyle = '#9a9aa5';
    context.fillRect(0, 0, canvas.width, canvas.height);
    images.forEach((image, index) => {
        const x = gap + (index % columns) * (thumbWidth + gap);
        const y = gap + Math.floor(index / columns) * (thumbHeight + gap);
        context.drawImage(image, x, y, thumbWidth, thumbHeight);
    });
    writeFileSync(sheetPath, canvas.toBuffer('image/png'));
};

const main = async () => {
    const outDir = path.resolve(process.argv[2] ?? 'slides-eval-out');
    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });

    const results: any[] = [];
    for (const fixture of SLIDES_EVAL_FIXTURES) {
        const { deck, issues } = parseDeck(fixture.modelOutput);
        if (!deck) {
            results.push({ id: fixture.id, error: 'Deck could not be parsed', issues });
            continue;
        }
        const laidOut = layoutDeck(deck);
        const bytes = await deckToPptxBytes(laidOut);
        const pptxPath = path.join(outDir, `${fixture.id}.pptx`);
        writeFileSync(pptxPath, Buffer.from(bytes));
        const inspected = await inspectPptx(bytes);

        const deckCharts = deck.slides.flatMap((slide) => {
            return slide.layout === 'chart' && !isMissingChart(slide.chart) ? [slide.chart] : [];
        });
        const writtenCharts = inspected.slides.flatMap((slide) => {
            return slide.charts;
        });
        const chartsMatch =
            JSON.stringify(
                writtenCharts.map((chart) => {
                    return chart.series;
                })
            ) ===
            JSON.stringify(
                deckCharts.map((chart) => {
                    return chart.series.map((series) => {
                        return series.values;
                    });
                })
            );
        const unsourced = findUnsourcedNumbers(deck, fixture.source);
        const expected = [...fixture.expectedUnsourced].sort();
        const flagged = unsourced
            .map((finding) => {
                return finding.value;
            })
            .sort();

        const editability = {
            noPictures: inspected.slides.every((slide) => {
                return !slide.shapes.some((shape) => {
                    return shape.kind === 'picture';
                });
            }),
            titlePlaceholderOnEverySlide: inspected.slides.every((slide) => {
                return slide.shapes.some((shape) => {
                    return shape.placeholder === 'title';
                });
            }),
            nativeCharts: writtenCharts.length === deckCharts.length,
            notesOnTheirSlides: laidOut.slides.every((slide, index) => {
                return inspected.slides[index]?.notes === (slide.notes ?? '');
            }),
        };

        results.push({
            id: fixture.id,
            purpose: fixture.purpose,
            slides: inspected.slides.length,
            parseIssues: issues,
            layoutWarnings: laidOut.warnings,
            shrunkShapes: laidOut.shrunkShapes,
            splitSlides: laidOut.slides.filter((slide) => {
                return slide.parts > 1;
            }).length,
            layoutFindings: checkLayout(inspected),
            editability,
            chartsMatch,
            unsourced,
            dataCheckAsExpected: JSON.stringify(flagged) === JSON.stringify(expected),
            inspected,
        });
    }

    // One LibreOffice run for all files; a private profile so it doesn't clash with an open LibreOffice.
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
            ...results
                .filter((result) => {
                    return !result.error;
                })
                .map((result) => {
                    return path.join(outDir, `${result.id}.pptx`);
                }),
        ],
        { stdio: 'pipe' }
    );
    rmSync(profile, { recursive: true, force: true });

    for (const result of results) {
        if (result.error) {
            continue;
        }
        const rendered = await checkRenderedText(
            path.join(outDir, `${result.id}.pdf`),
            result.inspected,
            path.join(outDir, result.id)
        );
        result.renderedFindings = rendered.findings;
        result.missingText = rendered.missingText;
        result.renderedPages = rendered.pages;
        await writeContactSheet(rendered.pngs, path.join(outDir, `${result.id}-sheet.png`));
        delete result.inspected;
    }

    const yesNo = (value: boolean): string => {
        return value ? 'yes' : '**NO**';
    };
    const lines = [
        '# Slides eval report',
        '',
        `Generated ${new Date().toISOString()} from ${SLIDES_EVAL_FIXTURES.length} fixtures. Visual quality is scored by looking at the contact sheets; everything else is automatic.`,
        '',
        '| Fixture | Slides | Editability | Text fit: XML findings | Text fit: rendered outside box | Text missing in render | Shrunk / split | Data check as expected | Charts match deck |',
        '| ------- | ------ | ----------- | ---------------------- | ------------------------------ | ---------------------- | -------------- | ---------------------- | ----------------- |',
    ];
    for (const result of results) {
        if (result.error) {
            lines.push(`| ${result.id} | — | ${result.error} | | | | | | |`);
            continue;
        }
        const editabilityPassed = Object.values(result.editability).filter(Boolean).length;
        lines.push(
            `| ${result.id} | ${result.slides} (PDF ${result.renderedPages}) | ${editabilityPassed}/${Object.keys(result.editability).length} | ${result.layoutFindings.length} | ${result.renderedFindings.length} | ${result.missingText.length} | ${result.shrunkShapes} / ${result.splitSlides} | ${yesNo(result.dataCheckAsExpected)} (${result.unsourced.length} flagged) | ${yesNo(result.chartsMatch)} |`
        );
    }
    lines.push('', '## Details', '');
    for (const result of results) {
        lines.push(`### ${result.id}`, '', result.purpose ?? '', '');
        for (const issue of result.parseIssues ?? []) {
            lines.push(`- parse ${issue.severity}: \`${issue.path}\` ${issue.message}`);
        }
        for (const warning of result.layoutWarnings ?? []) {
            lines.push(`- layout: slide ${warning.sourceSlide + 1}: ${warning.message}`);
        }
        for (const finding of result.layoutFindings ?? []) {
            lines.push(`- check ${finding.check}: slide ${finding.slide} ${finding.shape}: ${finding.message}`);
        }
        for (const finding of result.renderedFindings ?? []) {
            lines.push(
                `- rendered: slide ${finding.slide} "${finding.text}" is ${finding.byIn.toFixed(2)}" outside ${finding.shape}`
            );
        }
        for (const finding of result.missingText ?? []) {
            lines.push(
                `- missing in render: slide ${finding.slide} ${finding.shape}: ${finding.characters.slice(0, 30)}`
            );
        }
        for (const finding of result.unsourced ?? []) {
            lines.push(`- unsourced number: slide ${finding.sourceSlide + 1} ${finding.where}: ${finding.value}`);
        }
        lines.push('');
    }
    writeFileSync(path.join(outDir, 'report.md'), lines.join('\n'));
    writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(results, null, 2));
    console.log(lines.slice(0, 6 + results.length).join('\n'));
};

void main();
