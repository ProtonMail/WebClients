import JSZip from 'jszip';
import PptxGenJS from 'pptxgenjs';

import type { Attachment, Message } from '../../types';
import { Role } from '../../types-api';
import { findUnsourcedNumbers, readNumberValues } from './checks/dataChecks';
import { inspectPptx } from './checks/inspectPptx';
import { checkLayout } from './checks/layoutChecks';
import { isMissingChart, parseDeck } from './deck';
import { formatChartValue, isChartLabelled } from './deckChartSpec';
import { isDeckArtifact, looksLikeDeckJson, readDeckContent } from './deckContent';
import { collectDeckSourceText } from './deckSources';
import { writeDeckPptx } from './deckToPptx';
import { SLIDES_EVAL_FIXTURES } from './eval/slidesEvalFixtures';
import { layoutDeck } from './layoutDeck';
import { repairJson } from './repairJson';
import { BODY, BODY_BOX } from './slideTokens';
import { measureTextPt, wrapText } from './textMetrics';

// pptxgenjs lazily imports node:fs when it sees Node, for media files these decks don't have, and
// Jest can't run that import. The tests run in a browser-like environment, so take the browser path.
const releaseName = Object.getOwnPropertyDescriptor(process.release, 'name')!;
beforeAll(() => {
    Object.defineProperty(process.release, 'name', { ...releaseName, value: 'jsdom' });
});
afterAll(() => {
    Object.defineProperty(process.release, 'name', releaseName);
});

describe('textMetrics', () => {
    it('measures Arial widths with the safety headroom', () => {
        // "W" is 1933/2048 em in Arial (Liberation Sans); 10pt × 1.1 headroom.
        expect(measureTextPt('W', 10, false)).toBeCloseTo((1933 / 2048) * 10 * 1.1, 5);
        expect(measureTextPt('W', 10, true)).toBeGreaterThan(measureTextPt('W', 10, false) - 0.01);
    });

    it('counts characters Arial lacks as one em', () => {
        expect(measureTextPt('新', 10, false)).toBeCloseTo(11, 5);
    });

    it('wraps at spaces and breaks a word wider than the line', () => {
        expect(wrapText('one two three', 1000, 12, false)).toEqual(['one two three']);
        expect(wrapText('one two three', measureTextPt('one two', 12, false), 12, false)).toEqual(['one two', 'three']);
        const pieces = wrapText('Datenschutzgrundverordnung', 60, 12, false);
        expect(pieces.length).toBeGreaterThan(1);
        expect(pieces.join('')).toBe('Datenschutzgrundverordnung');
    });
});

describe('parseDeck', () => {
    it('rejects output that is not a deck', () => {
        expect(parseDeck('not json').deck).toBeNull();
        expect(parseDeck({ slides: [] }).deck).toBeNull();
    });

    it('repairs common model mistakes and reports each one', () => {
        const fixture = SLIDES_EVAL_FIXTURES.find((item) => {
            return item.id === 'messy-output';
        })!;
        const { deck, issues } = parseDeck(fixture.modelOutput);
        const messages = issues.map((issue) => {
            return `${issue.path}: ${issue.message}`;
        });

        expect(
            deck!.slides.map((slide) => {
                return slide.layout;
            })
        ).toEqual(['bullets', 'chart', 'chart']);
        const bullets = deck!.slides[0]!;
        expect(bullets.layout === 'bullets' && bullets.bullets).toEqual([
            { text: 'Q1 1,200 units', level: 1 },
            { text: 'Q2 1,350 units', level: 2 },
            { text: 'Q3 1,410 units', level: 1 },
        ]);
        const units = deck!.slides[1]!;
        expect(units.layout === 'chart' && !isMissingChart(units.chart) && units.chart.series[0]!.values).toEqual([
            1200, 1350, 1410,
        ]);
        const lines = deck!.slides[2]!;
        expect(lines.layout === 'chart' && !isMissingChart(lines.chart) && lines.chart.series).toHaveLength(4);
        expect(messages).toEqual(
            expect.arrayContaining([
                'slides[0].bullets[1]: Empty bullet removed.',
                'slides[0].bullets[2]: Level 3 shown as level 2.',
                'slides[1].chart.kind: Unknown chart kind "column", drawn as bar.',
                'slides[1].chart.series[0].values[0]: Number sent as text.',
                'slides[2].chart.series: Only the first 4 of 6 series are drawn.',
            ])
        );
    });

    it('turns an unreadable chart into a visible gap instead of dropping it', () => {
        const { deck, issues } = parseDeck({
            slides: [
                {
                    layout: 'chart',
                    title: 'Revenue',
                    chart: { kind: 'bar', categories: ['A', 'B'], series: [{ name: 'S', values: [1] }] },
                },
            ],
        });
        const slide = deck!.slides[0]!;
        expect(slide.layout === 'chart' && isMissingChart(slide.chart)).toBe(true);
        expect(
            issues.some((issue) => {
                return issue.severity === 'error';
            })
        ).toBe(true);
    });
});

describe('layoutDeck', () => {
    it('shrinks long bullets before splitting', () => {
        const fixture = SLIDES_EVAL_FIXTURES.find((item) => {
            return item.id === 'dense-bullets';
        })!;
        const laidOut = layoutDeck(parseDeck(fixture.modelOutput).deck!);
        const body = laidOut.slides[0]!.shapes.find((shape) => {
            return shape.kind === 'text' && shape.role === 'body';
        });

        expect(laidOut.slides).toHaveLength(1);
        expect(body?.kind === 'text' && body.fontSizePt).toBeLessThan(BODY.max);
    });

    it('splits a list that does not fit, keeps sub-bullets with their parent, and numbers the parts', () => {
        const fixture = SLIDES_EVAL_FIXTURES.find((item) => {
            return item.id === 'split-list';
        })!;
        const laidOut = layoutDeck(parseDeck(fixture.modelOutput).deck!);
        const titles = laidOut.slides.map((slide) => {
            const title = slide.shapes[0]!;
            return title.kind === 'text' ? title.paragraphs[0]!.text : '';
        });

        expect(laidOut.slides.length).toBeGreaterThan(1);
        expect(titles[0]).toBe(`Your First Weeks on the Team (1/${laidOut.slides.length})`);
        for (const slide of laidOut.slides) {
            const body = slide.shapes[1]!;
            expect(body.kind === 'text' && body.paragraphs[0]!.level).toBe(1);
            expect(body.kind === 'text' && body.textHeightPt).toBeLessThanOrEqual(BODY_BOX.h * 72);
        }
        // Notes would repeat on every part, so only the first keeps them.
        expect(
            laidOut.slides.filter((slide) => {
                return slide.notes;
            })
        ).toHaveLength(0);
    });
});

// Keynote rejected every chart until the broken table pptxgenjs puts in each chart's spreadsheet
// was removed (2026-10-15).
describe('repairChartWorkbooks', () => {
    it('leaves no Excel table in any embedded chart spreadsheet', async () => {
        const fixture = SLIDES_EVAL_FIXTURES.find((item) => {
            return item.id === 'northwind-q3';
        })!;
        const bytes = await writeDeckPptx(PptxGenJS, JSZip, layoutDeck(parseDeck(fixture.modelOutput).deck!));
        const presentation = await JSZip.loadAsync(bytes);
        const workbooks = Object.keys(presentation.files).filter((path) => {
            return /^ppt\/embeddings\/.+\.xlsx$/.test(path);
        });

        expect(workbooks).toHaveLength(2);
        for (const path of workbooks) {
            const workbook = await JSZip.loadAsync(await presentation.file(path)!.async('uint8array'));
            const files = Object.keys(workbook.files);
            expect(files.some((file) => file.startsWith('xl/tables/') && !file.endsWith('/'))).toBe(false);
            expect(await workbook.file('[Content_Types].xml')!.async('string')).not.toContain('/xl/tables/');
            // The data the chart's "Edit Data" opens is still there.
            expect(await workbook.file('xl/worksheets/sheet1.xml')!.async('string')).toContain('<sheetData>');
        }
    });
});

describe('inspectPptx', () => {
    // Regression: body placeholders inherit the master's 20% space before each paragraph unless a
    // paragraph sets its own. The writer now does; the reader must see the inherited value if not.
    it('resolves paragraph spacing inherited from the master body style', async () => {
        const fixture = SLIDES_EVAL_FIXTURES.find((item) => {
            return item.id === 'northwind-q3';
        })!;
        const bytes = await writeDeckPptx(PptxGenJS, JSZip, layoutDeck(parseDeck(fixture.modelOutput).deck!));
        const zip = await JSZip.loadAsync(bytes);
        const slidePath = 'ppt/slides/slide2.xml';
        const xml = await zip.file(slidePath)!.async('string');
        zip.file(slidePath, xml.replace(/<a:spcBef>.*?<\/a:spcBef>/g, ''));
        const stripped = await zip.generateAsync({ type: 'arraybuffer' });

        const written = (await inspectPptx(bytes)).slides[1]!.shapes.find((shape) => {
            return shape.placeholder === 'body';
        })!;
        const inherited = (await inspectPptx(stripped)).slides[1]!.shapes.find((shape) => {
            return shape.placeholder === 'body';
        })!;
        expect(written.paragraphs[0]!.spaceBeforePt).toBe(6);
        // 20% of the 16pt body text.
        expect(inherited.paragraphs[0]!.spaceBeforePt).toBeCloseTo(3.2, 5);
    });
});

describe('findUnsourcedNumbers', () => {
    it('reads numbers in either English or German notation', () => {
        expect(readNumberValues('12,400')).toEqual([12400, 12.4]);
        expect(readNumberValues('1.234,5')).toEqual([1234.5]);
        expect(readNumberValues('80%')).toEqual([80]);
    });
});

describe.each(SLIDES_EVAL_FIXTURES)('eval fixture $id', (fixture) => {
    it('renders to an editable .pptx with no layout findings and only the expected unsourced numbers', async () => {
        const { deck } = parseDeck(fixture.modelOutput);
        expect(deck).not.toBeNull();
        const laidOut = layoutDeck(deck!);
        const inspected = await inspectPptx(await writeDeckPptx(PptxGenJS, JSZip, laidOut));

        expect(inspected.widthIn).toBeCloseTo(10, 3);
        expect(inspected.heightIn).toBeCloseTo(5.625, 3);
        expect(inspected.slides).toHaveLength(laidOut.slides.length);
        expect(inspected.slides.length).toBeGreaterThanOrEqual(fixture.minSlides ?? 1);
        expect(checkLayout(inspected)).toEqual([]);

        // Editability: every slide's title is a real title placeholder, nothing is a picture, and
        // every chart is a native chart holding exactly the deck's numbers.
        for (const slide of inspected.slides) {
            expect(
                slide.shapes.some((shape) => {
                    return shape.placeholder === 'title';
                })
            ).toBe(true);
            expect(
                slide.shapes.some((shape) => {
                    return shape.kind === 'picture';
                })
            ).toBe(false);
        }
        const deckCharts = deck!.slides.flatMap((slide) => {
            return slide.layout === 'chart' && !isMissingChart(slide.chart) ? [slide.chart] : [];
        });
        const writtenCharts = inspected.slides.flatMap((slide) => {
            return slide.charts;
        });
        expect(
            writtenCharts.map((chart) => {
                return chart.series;
            })
        ).toEqual(
            deckCharts.map((chart) => {
                return chart.series.map((series) => {
                    return series.values;
                });
            })
        );
        expect(
            writtenCharts.map((chart) => {
                return chart.categories;
            })
        ).toEqual(
            deckCharts.map((chart) => {
                return chart.categories;
            })
        );

        // Notes land on the slide they belong to.
        laidOut.slides.forEach((slide, index) => {
            expect(inspected.slides[index]!.notes).toBe(slide.notes ?? '');
        });

        const unsourced = findUnsourcedNumbers(deck!, fixture.source).map((finding) => {
            return finding.value;
        });
        expect(unsourced.sort()).toEqual([...fixture.expectedUnsourced].sort());
    });
});

describe('deckContent', () => {
    it('tells JSON decks from HTML decks, including fenced JSON', () => {
        expect(looksLikeDeckJson('<section>Slide</section>')).toBe(false);
        expect(looksLikeDeckJson('  {"slides": []}')).toBe(true);
        expect(readDeckContent('```json\n{"slides": [{"layout": "title", "title": "Hi"}]}\n```')?.deck?.title).toBe(
            'Hi'
        );
        expect(readDeckContent('<section>Slide</section>')).toBeNull();
        expect(isDeckArtifact({ type: 'webpage', content: '{}' })).toBe(false);
    });
});

describe('collectDeckSourceText', () => {
    const message = (overrides: Partial<Message>): Message => {
        return {
            id: 'm',
            conversationId: 'c',
            createdAt: '2026-10-15T00:00:00.000Z',
            content: '',
            ...overrides,
        } as Message;
    };

    it("reads user messages, their files and tool results up to the deck message, but not the model's own text", () => {
        const chain = [
            message({ id: 'u1', role: Role.User, content: 'Revenue was 410', attachments: [{ id: 'a1' } as never] }),
            message({
                id: 'a1-reply',
                role: Role.Assistant,
                content: 'I think it was 999',
                blocks: [{ type: 'tool_result', content: '{"results":"orders 12,400"}' }],
            }),
            message({ id: 'u2', role: Role.User, content: 'Later message 777' }),
        ];
        const attachments = { a1: { id: 'a1', markdown: 'Table: 455' } as Attachment };
        const text = collectDeckSourceText(chain, attachments, 'a1-reply');

        expect(text).toContain('410');
        expect(text).toContain('455');
        expect(text).toContain('12,400');
        expect(text).not.toContain('999');
        expect(text).not.toContain('777');
    });
});

describe('calculated numbers', () => {
    it('reports numbers the model says it calculated as calculated, not missing', () => {
        const { deck } = parseDeck({
            slides: [{ layout: 'bullets', title: 'Tickets', bullets: ['Average 123 tickets a day', 'Peak 140'] }],
            calculated: [{ value: '123', how: 'Average of the five weekday counts' }],
        });
        const findings = findUnsourcedNumbers(deck!, 'Monday 140, Tuesday 122');

        expect(findings).toEqual([
            { sourceSlide: 0, where: 'bullet 1', value: '123', calculatedAs: 'Average of the five weekday counts' },
        ]);
    });
});

describe('chart rules', () => {
    const chart = {
        kind: 'bar' as const,
        categories: ['North', 'South'],
        series: [{ name: 'Q3', values: [1200.5, 362] }],
        unit: '%',
    };

    it("labels values with thousands separators, the data's decimals and the % unit", () => {
        expect(isChartLabelled(chart)).toBe(true);
        expect(formatChartValue(1200.5, chart)).toBe('1,200.5%');
        expect(formatChartValue(362, { ...chart, unit: undefined })).toBe('362.0');
    });

    it('starts bar axes at zero in the .pptx, unless a value is negative', async () => {
        const chartXml = async (values: number[]): Promise<string> => {
            const deck = parseDeck({
                title: 'Margins',
                slides: [
                    {
                        layout: 'chart',
                        title: 'Margin by region',
                        chart: { kind: 'bar', categories: ['North', 'South'], series: [{ name: 'Q3', values }] },
                    },
                ],
            }).deck!;
            const presentation = await JSZip.loadAsync(await writeDeckPptx(PptxGenJS, JSZip, layoutDeck(deck)));
            const path = Object.keys(presentation.files).find((file) => {
                return /^ppt\/charts\/chart\d+\.xml$/.test(file);
            })!;
            return presentation.file(path)!.async('string');
        };

        expect(await chartXml([12, 5])).toContain('<c:min val="0"/>');
        expect(await chartXml([12, -5])).not.toContain('<c:min val="0"/>');
    });

    it('stops labelling every point on busy charts', () => {
        const categories = Array.from({ length: 13 }, (_, index) => {
            return String(index);
        });
        expect(
            isChartLabelled({ ...chart, categories, series: [{ name: 'Q3', values: categories.map(Number) }] })
        ).toBe(false);
    });
});

// Shapes of the malformed decks seen in the model eval (2026-10-15).
describe('repairJson', () => {
    it('inserts a comma missing between two bullets', () => {
        const repaired = repairJson('{"bullets": ["Seen as temporary" "Refit planned"]}');
        expect(JSON.parse(repaired!)).toEqual({ bullets: ['Seen as temporary', 'Refit planned'] });
    });

    it('drops closing brackets left over at the end', () => {
        const repaired = repairJson('{"slides": [{"bullets": ["a", "b"]}]}]}');
        expect(JSON.parse(repaired!)).toEqual({ slides: [{ bullets: ['a', 'b'] }] });
    });

    it('closes brackets left open', () => {
        expect(JSON.parse(repairJson('{"slides": [{"title": "a"}')!)).toEqual({ slides: [{ title: 'a' }] });
    });

    it('keeps escaped quotes and brackets inside strings', () => {
        const text = '{"title": "He said \\"hi\\" [sic]" "x": 1}';
        expect(JSON.parse(repairJson(text)!)).toEqual({ title: 'He said "hi" [sic]', x: 1 });
    });

    it('drops a stray brace in front of a list of strings', () => {
        const repaired = repairJson('{"slides": [{"bullets": [{"Fortschritt 80 %", "Kundenportal"]}]}');
        expect(JSON.parse(repaired!)).toEqual({ slides: [{ bullets: ['Fortschritt 80 %', 'Kundenportal'] }] });
    });

    it('gives up on text that is not JSON', () => {
        expect(repairJson('<section>Slide</section>')).toBeNull();
    });

    it('reports the repair when parseDeck needed it', () => {
        const { deck, issues } = parseDeck('{"slides": [{"layout": "bullets", "title": "T", "bullets": ["a" "b"]}]}]}');
        expect(deck?.slides).toHaveLength(1);
        expect(issues).toContainEqual({
            severity: 'warning',
            path: '',
            message: 'JSON was malformed and has been repaired.',
        });
    });
});
