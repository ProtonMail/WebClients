import { c } from 'ttag';

import type { BulletItem, ChartData, ChartSlide, Deck, Slide, TitleSlide } from './deck';
import { isMissingChart } from './deck';
import {
    BLOCK_GAP_IN,
    BODY,
    BODY_BOX,
    BULLET_INDENT_PT,
    type Box,
    COLORS,
    type FontRange,
    LINE_HEIGHT,
    PARAGRAPH_GAP_PT,
    SLIDE_TITLE,
    SLIDE_TITLE_BOX,
    TAKEAWAY,
    TITLE_SLIDE_SUBTITLE,
    TITLE_SLIDE_SUBTITLE_BOX,
    TITLE_SLIDE_TITLE,
    TITLE_SLIDE_TITLE_BOX,
    boxHeightIn,
} from './slideTokens';
import { wrapText } from './textMetrics';

/**
 * Turns a deck into positioned shapes: every box in inches, every font size final. The .pptx writer
 * and the checks both work from this, so what is measured here is what gets written.
 *
 * Text is fitted into fixed boxes: the largest size in the range that fits, and for bullets, more
 * slides when even the smallest size doesn't.
 */

const PT_PER_IN = 72;
/** Room for the "Data needed" box's dashed border around its text. */
const DATA_NEEDED_PADDING_IN = 0.25;
/** Below this a chart's labels crowd out its bars, so it's reported. */
const MIN_CHART_HEIGHT_IN = 1.5;

export type SlideMaster = 'LUMO_TITLE' | 'LUMO_CONTENT' | 'LUMO_CHART';

export interface LaidOutParagraph {
    text: string;
    /** 0 = plain paragraph, 1–2 = bullet level. */
    level: 0 | 1 | 2;
}

export interface TextShape extends Box {
    kind: 'text';
    role: 'title' | 'subtitle' | 'body' | 'takeaway' | 'dataNeeded';
    /** Master placeholder the shape fills, so PowerPoint treats it as the slide's title or body. */
    placeholder?: 'title' | 'body';
    paragraphs: LaidOutParagraph[];
    fontSizePt: number;
    bold: boolean;
    color: string;
    lineHeightPt: number;
    paragraphGapPt: number;
    align: 'left' | 'center';
    valign: 'top' | 'middle' | 'bottom';
    dashedBorder?: boolean;
    /** Inner padding on every side, in points; text wraps within `w` minus twice this. */
    insetPt: number;
    /** Height the text needs at `fontSizePt`, in points. */
    textHeightPt: number;
}

export interface ChartShape extends Box {
    kind: 'chart';
    chart: ChartData;
}

export type SlideShape = TextShape | ChartShape;

export interface LaidOutSlide {
    master: SlideMaster;
    shapes: SlideShape[];
    notes?: string;
    /** Index of the deck slide this came from; a split slide has several parts. */
    sourceSlide: number;
    part: number;
    parts: number;
}

export interface LayoutWarning {
    sourceSlide: number;
    message: string;
}

export interface LaidOutDeck {
    title: string;
    slides: LaidOutSlide[];
    warnings: LayoutWarning[];
    /** Missing information the model reported; shown in the app, not written into the file. */
    gaps: string[];
    /** Every font size the fitting step picked below a range's maximum, for the eval report. */
    shrunkShapes: number;
}

interface FitResult {
    fontSizePt: number;
    heightPt: number;
    lineCount: number;
    fits: boolean;
}

interface LayoutContext {
    warnings: LayoutWarning[];
    shrunk: number;
}

const indentPt = (level: LaidOutParagraph['level']): number => {
    return level * BULLET_INDENT_PT;
};

const measureParagraphs = (
    paragraphs: LaidOutParagraph[],
    widthPt: number,
    fontSizePt: number,
    bold: boolean
): { heightPt: number; lineCount: number } => {
    let lineCount = 0;
    for (const paragraph of paragraphs) {
        lineCount += wrapText(paragraph.text, widthPt - indentPt(paragraph.level), fontSizePt, bold).length;
    }
    // The gap is written as space before each paragraph. LibreOffice skips it on the first paragraph;
    // whether PowerPoint does isn't verified, so it is counted for every paragraph.
    const gaps = paragraphs.length * PARAGRAPH_GAP_PT;
    return { heightPt: lineCount * fontSizePt * LINE_HEIGHT + gaps, lineCount };
};

const fitAtSize = (
    paragraphs: LaidOutParagraph[],
    box: Box,
    insetPt: number,
    range: FontRange,
    fontSizePt: number
): FitResult => {
    const { heightPt, lineCount } = measureParagraphs(
        paragraphs,
        box.w * PT_PER_IN - 2 * insetPt,
        fontSizePt,
        range.bold
    );
    const fits = heightPt <= box.h * PT_PER_IN - 2 * insetPt && lineCount <= range.maxLines;
    return { fontSizePt, heightPt, lineCount, fits };
};

/** Largest size in the range at which the text fits the box; the minimum size (with `fits: false`) if none does. */
const fitParagraphs = (paragraphs: LaidOutParagraph[], box: Box, insetPt: number, range: FontRange): FitResult => {
    for (let size = range.max; size > range.min; size--) {
        const result = fitAtSize(paragraphs, box, insetPt, range, size);
        if (result.fits) {
            return result;
        }
    }
    return fitAtSize(paragraphs, box, insetPt, range, range.min);
};

const textShape = (
    role: TextShape['role'],
    paragraphs: LaidOutParagraph[],
    box: Box,
    range: FontRange,
    style: { color: string; placeholder?: TextShape['placeholder']; valign?: TextShape['valign'] },
    context: LayoutContext,
    sourceSlide: number,
    fixedSizePt?: number
): TextShape => {
    const insetPt = role === 'dataNeeded' ? DATA_NEEDED_PADDING_IN * PT_PER_IN : 0;
    const fit =
        fixedSizePt === undefined
            ? fitParagraphs(paragraphs, box, insetPt, range)
            : fitAtSize(paragraphs, box, insetPt, range, fixedSizePt);
    if (!fit.fits) {
        context.warnings.push({ sourceSlide, message: `The ${role} doesn't fit its box at ${fit.fontSizePt}pt.` });
    }
    if (fit.fontSizePt < range.max) {
        context.shrunk += 1;
    }
    return {
        kind: 'text',
        role,
        placeholder: style.placeholder,
        ...box,
        paragraphs,
        fontSizePt: fit.fontSizePt,
        bold: range.bold,
        color: style.color,
        lineHeightPt: fit.fontSizePt * LINE_HEIGHT,
        paragraphGapPt: PARAGRAPH_GAP_PT,
        align: role === 'dataNeeded' ? 'center' : 'left',
        valign: style.valign ?? (role === 'dataNeeded' ? 'middle' : 'top'),
        dashedBorder: role === 'dataNeeded' ? true : undefined,
        insetPt,
        textHeightPt: fit.heightPt,
    };
};

const layoutTitleSlide = (slide: TitleSlide, index: number, context: LayoutContext): LaidOutSlide => {
    const shapes: SlideShape[] = [
        textShape(
            'title',
            [{ text: slide.title, level: 0 }],
            TITLE_SLIDE_TITLE_BOX,
            TITLE_SLIDE_TITLE,
            { color: COLORS.titleSlideText, placeholder: 'title', valign: 'bottom' },
            context,
            index
        ),
    ];
    if (slide.subtitle) {
        shapes.push(
            textShape(
                'subtitle',
                [{ text: slide.subtitle, level: 0 }],
                TITLE_SLIDE_SUBTITLE_BOX,
                TITLE_SLIDE_SUBTITLE,
                { color: COLORS.titleSlideSubtitle, placeholder: 'body' },
                context,
                index
            )
        );
    }
    return { master: 'LUMO_TITLE', shapes, notes: slide.notes, sourceSlide: index, part: 1, parts: 1 };
};

const slideTitle = (title: string, index: number, context: LayoutContext): TextShape => {
    return textShape(
        'title',
        [{ text: title, level: 0 }],
        SLIDE_TITLE_BOX,
        SLIDE_TITLE,
        { color: COLORS.ink, placeholder: 'title' },
        context,
        index
    );
};

/** A top-level bullet with its sub-bullets, kept on one slide when possible. */
const groupBullets = (bullets: BulletItem[]): LaidOutParagraph[][] => {
    const groups: LaidOutParagraph[][] = [];
    for (const bullet of bullets) {
        const paragraph: LaidOutParagraph = { text: bullet.text, level: bullet.level };
        const last = groups[groups.length - 1];
        if (bullet.level === 2 && last) {
            last.push(paragraph);
        } else {
            groups.push([paragraph]);
        }
    }
    return groups;
};

const fitsInBody = (paragraphs: LaidOutParagraph[], fontSizePt: number): boolean => {
    return fitAtSize(paragraphs, BODY_BOX, 0, BODY, fontSizePt).fits;
};

/** Packs groups in order onto as few slides as fit at this size. A group too tall for one slide is split into single bullets. */
const packGroups = (groups: LaidOutParagraph[][], fontSizePt: number): LaidOutParagraph[][] => {
    const units = groups.flatMap((group) => {
        if (fitsInBody(group, fontSizePt)) {
            return [group];
        }
        return group.map((paragraph) => {
            return [paragraph];
        });
    });
    const pages: LaidOutParagraph[][] = [];
    let current: LaidOutParagraph[] = [];
    for (const unit of units) {
        if (current.length > 0 && !fitsInBody([...current, ...unit], fontSizePt)) {
            pages.push(current);
            current = [];
        }
        current = [...current, ...unit];
    }
    if (current.length > 0) {
        pages.push(current);
    }
    return pages;
};

const layoutBulletsSlide = (
    slide: Slide & { layout: 'bullets' },
    index: number,
    context: LayoutContext
): LaidOutSlide[] => {
    const groups = groupBullets(slide.bullets);
    const paragraphs = groups.flat();
    const single = fitParagraphs(paragraphs, BODY_BOX, 0, BODY);

    // One slide at the largest size that fits; otherwise the size that needs the fewest slides
    // (ties go to the larger size), with the same size on every part.
    let pages = [paragraphs];
    let fixedSizePt: number | undefined;
    if (!single.fits && paragraphs.length > 1) {
        pages = [];
        for (let size = BODY.max; size >= BODY.min; size--) {
            const candidate = packGroups(groups, size);
            if (pages.length === 0 || candidate.length < pages.length) {
                pages = candidate;
                fixedSizePt = size;
            }
        }
        context.warnings.push({ sourceSlide: index, message: `Split into ${pages.length} slides.` });
    }

    return pages.map((pageParagraphs, pageIndex): LaidOutSlide => {
        // "(2/3)" rather than a word like "continued": the deck is in the user's language, not the app's.
        const title = pages.length > 1 ? `${slide.title} (${pageIndex + 1}/${pages.length})` : slide.title;
        const shapes: SlideShape[] = [slideTitle(title, index, context)];
        if (pageParagraphs.length > 0) {
            shapes.push(
                textShape(
                    'body',
                    pageParagraphs,
                    BODY_BOX,
                    BODY,
                    { color: COLORS.ink, placeholder: 'body' },
                    context,
                    index,
                    fixedSizePt
                )
            );
        }
        return {
            master: 'LUMO_CONTENT',
            shapes,
            // Notes belong to the slide as a whole; repeating them on every part would duplicate them.
            notes: pageIndex === 0 ? slide.notes : undefined,
            sourceSlide: index,
            part: pageIndex + 1,
            parts: pages.length,
        };
    });
};

const layoutChartSlide = (slide: ChartSlide, index: number, context: LayoutContext): LaidOutSlide => {
    const shapes: SlideShape[] = [slideTitle(slide.title, index, context)];

    let region: Box = { ...BODY_BOX };
    if (slide.takeaway) {
        const paragraphs: LaidOutParagraph[] = [{ text: slide.takeaway, level: 0 }];
        // Bottom-anchored in a box tall enough for its two lines, so the chart above keeps one size.
        const height = boxHeightIn(TAKEAWAY);
        const box: Box = { x: BODY_BOX.x, y: BODY_BOX.y + BODY_BOX.h - height, w: BODY_BOX.w, h: height };
        shapes.push(
            textShape('takeaway', paragraphs, box, TAKEAWAY, { color: COLORS.inkDim, valign: 'bottom' }, context, index)
        );
        region = { ...BODY_BOX, h: box.y - BLOCK_GAP_IN - BODY_BOX.y };
    }
    if (region.h < MIN_CHART_HEIGHT_IN) {
        context.warnings.push({ sourceSlide: index, message: `Chart area is only ${region.h.toFixed(2)}" tall.` });
    }

    if (isMissingChart(slide.chart)) {
        const missing = slide.chart.missing;
        shapes.push(
            textShape(
                'dataNeeded',
                [{ text: c('collider_2025: Info').t`Data needed: ${missing}`, level: 0 }],
                region,
                BODY,
                { color: COLORS.inkDim },
                context,
                index
            )
        );
        context.warnings.push({ sourceSlide: index, message: 'Chart data is missing.' });
    } else {
        shapes.push({ kind: 'chart', ...region, chart: slide.chart });
    }

    return { master: 'LUMO_CHART', shapes, notes: slide.notes, sourceSlide: index, part: 1, parts: 1 };
};

export const layoutDeck = (deck: Deck): LaidOutDeck => {
    const context: LayoutContext = { warnings: [], shrunk: 0 };
    const slides = deck.slides.flatMap((slide, index): LaidOutSlide[] => {
        if (slide.layout === 'title') {
            return [layoutTitleSlide(slide, index, context)];
        }
        if (slide.layout === 'chart') {
            return [layoutChartSlide(slide, index, context)];
        }
        return layoutBulletsSlide(slide, index, context);
    });
    return { title: deck.title, slides, warnings: context.warnings, gaps: deck.gaps, shrunkShapes: context.shrunk };
};
