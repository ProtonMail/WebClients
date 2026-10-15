import type JSZip from 'jszip';
import type PptxGenJS from 'pptxgenjs';

import type { ChartData } from './deck';
import { chartDecimals, isChartLabelled } from './deckChartSpec';
import type { ChartShape, LaidOutDeck, LaidOutSlide, SlideMaster, TextShape } from './layoutDeck';
import { repairChartWorkbooks } from './repairChartWorkbooks';
import {
    BODY,
    BODY_BOX,
    BULLET_INDENT_PT,
    type Box,
    CHART_LABEL_PT,
    COLORS,
    FONT_FACE,
    type FontRange,
    SLIDE_TITLE,
    SLIDE_TITLE_BOX,
    TITLE_SLIDE_SUBTITLE,
    TITLE_SLIDE_SUBTITLE_BOX,
    TITLE_SLIDE_TITLE,
    TITLE_SLIDE_TITLE_BOX,
} from './slideTokens';

/**
 * Writes a laid-out deck as a .pptx made only of native objects: text in the masters' title and body
 * placeholders, native charts with their data embedded, and speaker notes. Nothing is an image.
 *
 * pptxgenjs copies a master placeholder's options over the slide's (position, size, font size,
 * line spacing), so the layout engine fits text into the masters' own boxes, and every text format
 * is set on the runs, which the copy doesn't touch.
 */

type Pptx = InstanceType<typeof PptxGenJS>;
type PptxSlide = ReturnType<Pptx['addSlide']>;

interface PlaceholderSpec {
    name: 'title' | 'body';
    box: Box;
    range: FontRange;
    color: string;
    valign: 'top' | 'bottom';
}

const placeholder = ({ name, box, range, color, valign }: PlaceholderSpec) => {
    return {
        placeholder: {
            options: {
                name,
                type: name,
                ...box,
                fontFace: FONT_FACE,
                fontSize: range.max,
                bold: range.bold,
                color,
                valign,
                margin: 0,
            },
            // Empty: PowerPoint then shows its own localized prompt ("Click to add title").
            text: '',
        },
    };
};

const TITLE_PLACEHOLDER: PlaceholderSpec = {
    name: 'title',
    box: SLIDE_TITLE_BOX,
    range: SLIDE_TITLE,
    color: COLORS.ink,
    valign: 'top',
};

const MASTERS: Record<SlideMaster, { background: string; placeholders: PlaceholderSpec[] }> = {
    LUMO_TITLE: {
        background: COLORS.titleSlideBackground,
        placeholders: [
            {
                name: 'title',
                box: TITLE_SLIDE_TITLE_BOX,
                range: TITLE_SLIDE_TITLE,
                color: COLORS.titleSlideText,
                valign: 'bottom',
            },
            {
                name: 'body',
                box: TITLE_SLIDE_SUBTITLE_BOX,
                range: TITLE_SLIDE_SUBTITLE,
                color: COLORS.titleSlideSubtitle,
                valign: 'top',
            },
        ],
    },
    LUMO_CONTENT: {
        background: COLORS.background,
        placeholders: [
            TITLE_PLACEHOLDER,
            { name: 'body', box: BODY_BOX, range: BODY, color: COLORS.ink, valign: 'top' },
        ],
    },
    // A chart is not a placeholder type pptxgenjs can fill, so this master only holds the title.
    LUMO_CHART: {
        background: COLORS.background,
        placeholders: [TITLE_PLACEHOLDER],
    },
};

const defineMasters = (pptx: Pptx): void => {
    for (const [title, master] of Object.entries(MASTERS)) {
        pptx.defineSlideMaster({
            title,
            background: { color: master.background },
            objects: master.placeholders.map(placeholder),
        });
    }
};

const addTextShape = (slide: PptxSlide, shape: TextShape): void => {
    const runs = shape.paragraphs.map((paragraph) => {
        return {
            text: paragraph.text,
            options: {
                breakLine: true,
                bullet: paragraph.level > 0 ? { indent: BULLET_INDENT_PT } : false,
                indentLevel: paragraph.level > 0 ? paragraph.level - 1 : 0,
                fontFace: FONT_FACE,
                fontSize: shape.fontSizePt,
                bold: shape.bold,
                color: shape.color,
                align: shape.align,
                lineSpacing: shape.lineHeightPt,
                // Set on every paragraph: otherwise body placeholders inherit the master's default
                // body style, which adds 20% of the font size before each paragraph.
                paraSpaceBefore: shape.paragraphGapPt,
            },
        };
    });
    slide.addText(runs, {
        x: shape.x,
        y: shape.y,
        w: shape.w,
        h: shape.h,
        placeholder: shape.placeholder,
        objectName: shape.role,
        valign: shape.valign,
        margin: shape.insetPt,
        fit: 'none',
        wrap: true,
        line: shape.dashedBorder ? { color: COLORS.inkFaint, width: 1.5, dashType: 'dash' } : undefined,
    });
};

const chartType = (pptx: Pptx, chart: ChartData) => {
    if (chart.kind === 'line') {
        return pptx.ChartType.line;
    }
    if (chart.kind === 'pie') {
        return pptx.ChartType.pie;
    }
    return pptx.ChartType.bar;
};

/** Excel number format: thousands separators, the data's own decimals, and "%" when that's the unit. */
const numberFormat = (chart: ChartData, withUnit: boolean): string => {
    const decimals = chartDecimals(chart);
    const base = decimals > 0 ? `#,##0.${'0'.repeat(decimals)}` : '#,##0';
    return withUnit && chart.unit === '%' ? `${base}"%"` : base;
};

// Mark and label styling follows the dataviz skill: colour follows the series (one series, one
// colour), bars start at zero, recessive grid and axes, a legend only for two or more series, 2pt
// lines and 8pt markers, a gap between bars. Direct labels also make up for the palette's green being below 3:1
// contrast on white.
const addChartShape = (pptx: Pptx, slide: PptxSlide, shape: ChartShape): void => {
    const { chart } = shape;
    const data = chart.series.map((series) => {
        return { name: series.name, labels: chart.categories, values: series.values };
    });
    const isPie = chart.kind === 'pie';
    const labelled = isChartLabelled(chart);
    const labelText = { fontFace: FONT_FACE, fontSize: CHART_LABEL_PT, color: COLORS.inkDim };
    // Pie slices are categories, so each gets its own colour; otherwise colours are per series.
    const colorCount = isPie ? chart.categories.length : chart.series.length;
    const hasNegativeValue = chart.series.some((series) => {
        return series.values.some((value) => {
            return value < 0;
        });
    });

    slide.addChart(chartType(pptx, chart), data, {
        x: shape.x,
        y: shape.y,
        w: shape.w,
        h: shape.h,
        objectName: 'chart',
        chartColors: COLORS.chartSeries.slice(0, colorCount),
        showValue: labelled,
        dataLabelFormatCode: numberFormat(chart, true),
        dataLabelFontFace: FONT_FACE,
        dataLabelFontSize: CHART_LABEL_PT,
        dataLabelColor: COLORS.ink,
        dataLabelPosition: isPie ? 'bestFit' : chart.kind === 'line' ? 't' : 'outEnd',
        showLegend: isPie || chart.series.length > 1,
        legendPos: isPie ? 'r' : 'b',
        legendFontFace: labelText.fontFace,
        legendFontSize: labelText.fontSize,
        legendColor: labelText.color,
        barDir: 'col',
        barGrouping: 'clustered',
        barGapWidthPct: 60,
        // A thin gap between a group's bars, so neighbouring fills don't merge.
        barOverlapPct: chart.series.length > 1 ? -8 : 0,
        lineSize: 2,
        lineDataSymbol: 'circle',
        lineDataSymbolSize: 8,
        catAxisLabelFontFace: labelText.fontFace,
        catAxisLabelFontSize: labelText.fontSize,
        catAxisLabelColor: labelText.color,
        catAxisLineShow: true,
        catAxisLineColor: COLORS.hairline,
        // Bars encode length, so their axis always starts at zero. With negative values the automatic
        // axis goes below zero instead: a floor at zero would hide those bars.
        valAxisMinVal: chart.kind === 'bar' && !hasNegativeValue ? 0 : undefined,
        // With every value labelled the axis and gridlines only repeat the labels.
        valAxisHidden: labelled,
        valGridLine: labelled ? { style: 'none' } : { color: COLORS.hairline, size: 0.5 },
        valAxisLabelFormatCode: numberFormat(chart, false),
        valAxisLabelFontFace: labelText.fontFace,
        valAxisLabelFontSize: labelText.fontSize,
        valAxisLabelColor: labelText.color,
        valAxisLineShow: false,
        // The unit goes on the value axis; with the axis hidden it becomes a small chart title,
        // except "%", which the labels already carry.
        showTitle: labelled && Boolean(chart.unit) && chart.unit !== '%',
        title: chart.unit,
        titleFontFace: labelText.fontFace,
        titleFontSize: labelText.fontSize,
        titleColor: labelText.color,
        showValAxisTitle: Boolean(chart.unit) && !isPie && !labelled,
        valAxisTitle: chart.unit,
        valAxisTitleFontFace: labelText.fontFace,
        valAxisTitleFontSize: labelText.fontSize,
        valAxisTitleColor: labelText.color,
    });
};

const addSlide = (pptx: Pptx, laidOut: LaidOutSlide): void => {
    const slide = pptx.addSlide({ masterName: laidOut.master });
    for (const shape of laidOut.shapes) {
        if (shape.kind === 'chart') {
            addChartShape(pptx, slide, shape);
        } else {
            addTextShape(slide, shape);
        }
    }
    if (laidOut.notes) {
        slide.addNotes(laidOut.notes);
    }
};

type PptxGenConstructor = typeof PptxGenJS;

/**
 * Builds the file with given pptxgenjs and JSZip constructors (tests import them directly);
 * `deckToPptxBytes` loads both lazily for the app.
 */
export const writeDeckPptx = async (
    PptxGen: PptxGenConstructor,
    Zip: typeof JSZip,
    deck: LaidOutDeck
): Promise<ArrayBuffer> => {
    // One instance per file: pptxgenjs keeps slides and masters on the instance.
    const pptx = new PptxGen();
    // The layout must be set before any slide is added.
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = deck.title;
    pptx.author = 'Lumo';
    pptx.theme = { headFontFace: FONT_FACE, bodyFontFace: FONT_FACE };
    defineMasters(pptx);

    for (const slide of deck.slides) {
        addSlide(pptx, slide);
    }

    const output = await pptx.write({ outputType: 'arraybuffer' });
    if (!(output instanceof ArrayBuffer)) {
        throw new Error('PPTX export did not produce an ArrayBuffer.');
    }
    // Without this, Keynote rejects the file and drops every chart (see repairChartWorkbooks).
    return repairChartWorkbooks(Zip, output);
};

export const deckToPptxBytes = async (deck: LaidOutDeck): Promise<ArrayBuffer> => {
    const [{ default: PptxGen }, { default: Zip }] = await Promise.all([
        import(/* webpackChunkName: "pptxgenjs" */ 'pptxgenjs'),
        import(/* webpackChunkName: "pptxgenjs" */ 'jszip'),
    ]);
    return writeDeckPptx(PptxGen, Zip, deck);
};
