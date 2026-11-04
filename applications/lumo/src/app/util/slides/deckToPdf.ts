import type { jsPDF as JsPdf } from 'jspdf';

import type { ChartData } from './deck';
import { formatChartValue, isChartLabelled, niceAxis } from './deckChartSpec';
import type { ChartShape, LaidOutDeck, LaidOutSlide, TextShape } from './layoutDeck';
import { placeTextShape } from './placeText';
import { BULLET_INDENT_PT, CHART_LABEL_PT, COLORS, SLIDE_HEIGHT_IN, SLIDE_WIDTH_IN } from './slideTokens';
import { measureTextPt } from './textMetrics';

/**
 * A JSON deck's PDF (D26), drawn from the same layout as the canvas preview and the .pptx: text as
 * real text in the built-in Helvetica (Arial's widths, so the layout's line breaks hold) and charts
 * as vector shapes, following `DeckSlide` and `DeckChart`. Speaker notes are not written.
 *
 * The built-in fonts only cover WinAnsi (Western European); `canWriteDeckPdfAsText` says whether a
 * deck fits in it, and callers fall back to an image PDF when it doesn't.
 */

const PT_PER_IN = 72;
export const PAGE_WIDTH_PT = SLIDE_WIDTH_IN * PT_PER_IN;
export const PAGE_HEIGHT_PT = SLIDE_HEIGHT_IN * PT_PER_IN;

// Arial's hhea ascent and descent (1854 and 434 of 2048 units), for placing a baseline the way a
// browser does inside a CSS line box.
const ASCENT_EM = 1854 / 2048;
const DESCENT_EM = 434 / 2048;
/** Chrome puts the hanging baseline at 80% of the ascent. */
const HANGING_EM = ASCENT_EM * 0.8;

/** Border width of the "Data needed" box, as in the preview. */
const DASHED_BORDER_PT = 1.5;

// DeckChart's sizes, converted from CSS px to points (× 0.75).
const ROW_PT = CHART_LABEL_PT * 1.6;
const AXIS_WIDTH_PT = 42;
const SWATCH_PT = 7.5;
const SWATCH_GAP_PT = 4.5;
const LEGEND_ITEM_GAP_PT = 12;

/** Unicode characters WinAnsiEncoding puts at 0x80–0x9F. */
const WIN_ANSI_EXTRAS = new Set([
    0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152, 0x017d, 0x2018,
    0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
]);

type TextAnchor = 'start' | 'middle' | 'end';
type TextBaseline = 'alphabetic' | 'central' | 'hanging';

/** Control whitespace shows as a space in the preview's nowrap lines; jsPDF would break on it. */
const normaliseLine = (text: string): string => {
    return text.replace(/[\t\n\r\f\v]+/g, ' ');
};

export const isWinAnsiText = (text: string): boolean => {
    for (const character of normaliseLine(text)) {
        const code = character.codePointAt(0)!;
        const inRange = (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff);
        if (!inRange && !WIN_ANSI_EXTRAS.has(code)) {
            return false;
        }
    }
    return true;
};

const chartTexts = (chart: ChartData): string[] => {
    const series = chart.series.map((item) => {
        return item.name;
    });
    return [...chart.categories, ...series, chart.unit ?? ''];
};

/** Every string the PDF would draw, plus the title written into its properties. */
const deckTexts = (deck: LaidOutDeck): string[] => {
    const texts = [deck.title];
    for (const slide of deck.slides) {
        for (const shape of slide.shapes) {
            if (shape.kind === 'text') {
                texts.push(
                    ...shape.paragraphs.map((paragraph) => {
                        return paragraph.text;
                    })
                );
            } else {
                texts.push(...chartTexts(shape.chart));
            }
        }
    }
    return texts;
};

/** False when some text is outside WinAnsi, which the built-in PDF fonts can't show. */
export const canWriteDeckPdfAsText = (deck: LaidOutDeck): boolean => {
    return deckTexts(deck).every(isWinAnsiText);
};

const hex = (color: string): string => {
    return `#${color}`;
};

const labelWidthPt = (text: string): number => {
    return measureTextPt(text, CHART_LABEL_PT, false, 1);
};

/** Draws a chart label positioned like an SVG `<text>` with `text-anchor` and `dominant-baseline`. */
const drawLabel = (
    doc: JsPdf,
    text: string,
    x: number,
    y: number,
    color: string,
    anchor: TextAnchor,
    baseline: TextBaseline = 'alphabetic'
) => {
    const width = labelWidthPt(text);
    let left = x;
    if (anchor === 'middle') {
        left = x - width / 2;
    } else if (anchor === 'end') {
        left = x - width;
    }
    let baselineY = y;
    if (baseline === 'central') {
        baselineY = y + ((ASCENT_EM - DESCENT_EM) / 2) * CHART_LABEL_PT;
    } else if (baseline === 'hanging') {
        baselineY = y + HANGING_EM * CHART_LABEL_PT;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(CHART_LABEL_PT);
    doc.setTextColor(color);
    doc.text(normaliseLine(text), left, baselineY);
};

const drawLine = (doc: JsPdf, x1: number, y1: number, x2: number, y2: number, color: string, width: number) => {
    doc.setDrawColor(color);
    doc.setLineWidth(width);
    doc.line(x1, y1, x2, y2);
};

const drawLegend = (
    doc: JsPdf,
    names: string[],
    colors: string[],
    x: number,
    y: number,
    width: number,
    vertical: boolean
) => {
    const itemWidths = names.map((name) => {
        return SWATCH_PT + SWATCH_GAP_PT + labelWidthPt(name) + LEGEND_ITEM_GAP_PT;
    });
    const total = itemWidths.reduce((sum, itemWidth) => {
        return sum + itemWidth;
    }, 0);
    let cursor = x + Math.max(0, (width - total) / 2);
    names.forEach((name, index) => {
        const itemX = vertical ? x : cursor;
        const itemY = vertical ? y + index * ROW_PT : y;
        cursor += itemWidths[index]!;
        doc.setFillColor(colors[index % colors.length]!);
        doc.rect(itemX, itemY - SWATCH_PT / 2, SWATCH_PT, SWATCH_PT, 'F');
        drawLabel(doc, name, itemX + SWATCH_PT + SWATCH_GAP_PT, itemY, hex(COLORS.inkDim), 'start', 'central');
    });
};

/** A pie slice from `start` to `end` (radians, clockwise on the page), as cubic Béziers of at most 90°. */
const drawSlice = (doc: JsPdf, cx: number, cy: number, radius: number, start: number, end: number) => {
    doc.moveTo(cx, cy);
    doc.lineTo(cx + radius * Math.cos(start), cy + radius * Math.sin(start));
    const segments = Math.max(1, Math.ceil((end - start) / (Math.PI / 2)));
    const step = (end - start) / segments;
    const k = (4 / 3) * Math.tan(step / 4);
    for (let index = 0; index < segments; index++) {
        const a0 = start + index * step;
        const a1 = a0 + step;
        doc.curveTo(
            cx + radius * (Math.cos(a0) - k * Math.sin(a0)),
            cy + radius * (Math.sin(a0) + k * Math.cos(a0)),
            cx + radius * (Math.cos(a1) + k * Math.sin(a1)),
            cy + radius * (Math.sin(a1) - k * Math.cos(a1)),
            cx + radius * Math.cos(a1),
            cy + radius * Math.sin(a1)
        );
    }
    doc.close();
    doc.fillStroke();
};

const drawPieChart = (doc: JsPdf, chart: ChartData, ox: number, oy: number, width: number, height: number) => {
    const values = chart.series[0]?.values ?? [];
    const total = values.reduce((sum, value) => {
        return sum + Math.max(value, 0);
    }, 0);
    const colors = COLORS.chartSeries.map(hex);
    const legendWidth = Math.max(
        ...chart.categories.map((category) => {
            return SWATCH_PT + SWATCH_GAP_PT + labelWidthPt(category);
        })
    );
    const radius = Math.max(7.5, Math.min(height / 2 - 6, (width - legendWidth - 36) / 2));
    const cx = ox + (width - legendWidth - 18) / 2;
    const cy = oy + height / 2;
    let angle = -Math.PI / 2;

    doc.setDrawColor('#FFFFFF');
    doc.setLineWidth(1.125);
    values.forEach((value, index) => {
        const sweep = total > 0 ? (Math.max(value, 0) / total) * 2 * Math.PI : 0;
        const start = angle;
        angle += sweep;
        doc.setFillColor(colors[index % colors.length]!);
        if (sweep >= 2 * Math.PI - 1e-6) {
            doc.circle(cx, cy, radius, 'FD');
        } else if (sweep > 0) {
            drawSlice(doc, cx, cy, radius, start, angle);
        }
    });
    // Labels after every slice, so a later slice's white edge doesn't cross an earlier label.
    angle = -Math.PI / 2;
    values.forEach((value) => {
        const sweep = total > 0 ? (Math.max(value, 0) / total) * 2 * Math.PI : 0;
        const middle = angle + sweep / 2;
        angle += sweep;
        drawLabel(
            doc,
            formatChartValue(value, chart),
            cx + radius * 0.65 * Math.cos(middle),
            cy + radius * 0.65 * Math.sin(middle),
            hex(COLORS.ink),
            'middle',
            'central'
        );
    });
    drawLegend(
        doc,
        chart.categories,
        colors,
        ox + width - legendWidth,
        cy - ((chart.categories.length - 1) * ROW_PT) / 2,
        legendWidth,
        true
    );
};

const drawBarOrLineChart = (doc: JsPdf, chart: ChartData, ox: number, oy: number, width: number, height: number) => {
    const labelled = isChartLabelled(chart);
    const multiSeries = chart.series.length > 1;
    const colors = COLORS.chartSeries.map(hex);
    const unitTitle = labelled && chart.unit && chart.unit !== '%' ? chart.unit : undefined;
    const top = oy + (unitTitle ? ROW_PT : 0) + (labelled ? ROW_PT : CHART_LABEL_PT / 2);
    const bottom = oy + height - ROW_PT - (multiSeries ? ROW_PT : 0);
    const left = ox + (labelled ? 0 : AXIS_WIDTH_PT);
    const right = ox + width;
    const plotWidth = right - left;
    const plotHeight = Math.max(bottom - top, 1);
    const axis = niceAxis(
        chart.series.flatMap((series) => {
            return series.values;
        })
    );
    const yFor = (value: number): number => {
        return bottom - ((value - axis.min) / (axis.max - axis.min)) * plotHeight;
    };
    const zeroY = yFor(0);
    const band = plotWidth / chart.categories.length;
    const barWidth = band / (chart.series.length + 0.6 + 0.08 * (chart.series.length - 1));

    if (unitTitle) {
        drawLabel(doc, unitTitle, ox + width / 2, oy + ROW_PT / 2, hex(COLORS.inkDim), 'middle', 'central');
    }
    if (!labelled) {
        for (let index = 0; index < 6; index++) {
            const tick = axis.min + ((axis.max - axis.min) / 5) * index;
            drawLine(doc, left, yFor(tick), right, yFor(tick), hex(COLORS.hairline), 0.5625);
            drawLabel(
                doc,
                formatChartValue(tick, { ...chart, unit: undefined }),
                left - 6,
                yFor(tick),
                hex(COLORS.inkDim),
                'end',
                'central'
            );
        }
    }
    drawLine(doc, left, zeroY, right, zeroY, hex(COLORS.hairline), 0.75);
    chart.categories.forEach((category, index) => {
        drawLabel(
            doc,
            category,
            left + band * (index + 0.5),
            bottom + ROW_PT / 2,
            hex(COLORS.inkDim),
            'middle',
            'central'
        );
    });

    chart.series.forEach((series, seriesIndex) => {
        const color = colors[seriesIndex % colors.length]!;
        if (chart.kind === 'line') {
            const points = series.values.map((value, index) => {
                return { x: left + band * (index + 0.5), y: yFor(value), value };
            });
            if (points.length > 1) {
                doc.setDrawColor(color);
                doc.setLineWidth(2);
                doc.moveTo(points[0]!.x, points[0]!.y);
                points.slice(1).forEach((point) => {
                    doc.lineTo(point.x, point.y);
                });
                doc.stroke();
            }
            points.forEach((point) => {
                doc.setFillColor(color);
                doc.circle(point.x, point.y, 4, 'F');
                if (labelled) {
                    drawLabel(
                        doc,
                        formatChartValue(point.value, chart),
                        point.x,
                        point.y - 10.5,
                        hex(COLORS.ink),
                        'middle'
                    );
                }
            });
            return;
        }
        series.values.forEach((value, index) => {
            const groupLeft =
                left + band * index + (band - barWidth * (chart.series.length + 0.08 * (chart.series.length - 1))) / 2;
            const x = groupLeft + seriesIndex * barWidth * 1.08;
            const y = yFor(value);
            const barHeight = Math.abs(zeroY - y);
            if (barHeight > 0) {
                doc.setFillColor(color);
                doc.rect(x, Math.min(y, zeroY), barWidth, barHeight, 'F');
            }
            if (labelled) {
                // A negative bar hangs below zero, with its label under its end.
                const isNegative = value < 0;
                drawLabel(
                    doc,
                    formatChartValue(value, chart),
                    x + barWidth / 2,
                    isNegative ? y + 6 : y - 6,
                    hex(COLORS.ink),
                    'middle',
                    isNegative ? 'hanging' : 'alphabetic'
                );
            }
        });
    });

    if (multiSeries) {
        drawLegend(
            doc,
            chart.series.map((series) => {
                return series.name;
            }),
            colors,
            ox,
            oy + height - ROW_PT / 2,
            width,
            false
        );
    }
};

const drawChart = (doc: JsPdf, shape: ChartShape) => {
    const x = shape.x * PT_PER_IN;
    const y = shape.y * PT_PER_IN;
    const width = shape.w * PT_PER_IN;
    const height = shape.h * PT_PER_IN;
    if (shape.chart.kind === 'pie') {
        drawPieChart(doc, shape.chart, x, y, width, height);
        return;
    }
    drawBarOrLineChart(doc, shape.chart, x, y, width, height);
};

const drawText = (doc: JsPdf, shape: TextShape) => {
    const x = shape.x * PT_PER_IN;
    const y = shape.y * PT_PER_IN;
    const width = shape.w * PT_PER_IN;
    const height = shape.h * PT_PER_IN;
    // The preview's box is border-box, so the border sits inside it and pushes the text in.
    const border = shape.dashedBorder ? DASHED_BORDER_PT : 0;
    if (shape.dashedBorder) {
        doc.setDrawColor(hex(COLORS.inkFaint));
        doc.setLineWidth(DASHED_BORDER_PT);
        doc.setLineDashPattern([3 * DASHED_BORDER_PT, 3 * DASHED_BORDER_PT], 0);
        doc.rect(x + border / 2, y + border / 2, width - border, height - border, 'S');
        doc.setLineDashPattern([], 0);
    }

    const { paragraphs, offsetPt } = placeTextShape(shape);
    const innerLeft = x + border + shape.insetPt;
    const innerWidth = width - 2 * (border + shape.insetPt);
    const size = shape.fontSizePt;
    // Baseline inside a CSS line box: half the leading above the font's ascent.
    const baselineInLine = (shape.lineHeightPt - (ASCENT_EM + DESCENT_EM) * size) / 2 + ASCENT_EM * size;
    let lineTop = y + border + shape.insetPt + offsetPt;

    doc.setFont('helvetica', shape.bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(hex(shape.color));
    paragraphs.forEach((paragraph, index) => {
        if (index > 0) {
            lineTop += shape.paragraphGapPt;
        }
        const indent = paragraph.level * BULLET_INDENT_PT;
        if (paragraph.level > 0) {
            doc.text('•', innerLeft + indent - BULLET_INDENT_PT, lineTop + baselineInLine);
        }
        paragraph.lines.forEach((line) => {
            const text = normaliseLine(line);
            let left = innerLeft + indent;
            if (shape.align === 'center') {
                left += (innerWidth - indent - measureTextPt(text, size, shape.bold, 1)) / 2;
            }
            doc.text(text, left, lineTop + baselineInLine);
            lineTop += shape.lineHeightPt;
        });
    });
};

const SLIDE_BACKGROUND: Partial<Record<LaidOutSlide['master'], string>> = {
    LUMO_TITLE: COLORS.titleSlideBackground,
    LUMO_SECTION: COLORS.sectionSlideBackground,
};

const drawSlide = (doc: JsPdf, slide: LaidOutSlide) => {
    doc.setFillColor(hex(SLIDE_BACKGROUND[slide.master] ?? COLORS.background));
    doc.rect(0, 0, PAGE_WIDTH_PT, PAGE_HEIGHT_PT, 'F');
    for (const shape of slide.shapes) {
        if (shape.kind === 'text') {
            drawText(doc, shape);
        } else {
            drawChart(doc, shape);
        }
    }
};

export interface DeckToPdfOptions {
    /** Tests turn compression off to read the content streams. */
    compress?: boolean;
}

/** Builds the file with a given jsPDF constructor (tests pass the Node build). */
export const writeDeckPdf = (
    deck: LaidOutDeck,
    JsPdfConstructor: typeof JsPdf,
    options: DeckToPdfOptions = {}
): ArrayBuffer => {
    if (!canWriteDeckPdfAsText(deck)) {
        throw new Error('The deck has text the built-in PDF fonts cannot show.');
    }
    const doc = new JsPdfConstructor({
        unit: 'pt',
        format: [PAGE_WIDTH_PT, PAGE_HEIGHT_PT],
        orientation: 'landscape',
        compress: options.compress ?? true,
    });
    doc.setProperties({ title: deck.title });
    deck.slides.forEach((slide, index) => {
        if (index > 0) {
            doc.addPage([PAGE_WIDTH_PT, PAGE_HEIGHT_PT], 'landscape');
        }
        drawSlide(doc, slide);
    });
    return doc.output('arraybuffer');
};

export const deckToPdfBytes = async (deck: LaidOutDeck): Promise<ArrayBuffer> => {
    const { jsPDF } = await import('jspdf');
    return writeDeckPdf(deck, jsPDF);
};
