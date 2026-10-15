import {
    PROTON_CATEGORY_COLORS,
    PROTON_HAIRLINE,
    PROTON_INK,
    PROTON_INK_DIM,
    PROTON_INK_FAINT,
    PROTON_PURPLE,
    PROTON_PURPLE_TINT,
} from '../../components/LumoMarkdown/vega/protonChartTokens';
import { MAX_CHART_SERIES } from './deck';

/**
 * Design tokens for generated decks. Sizes start from a common presentation type scale and spacing
 * (titles 36–44pt, section headers 20–24pt, body 14–16pt, captions 10–12pt, margins ≥ 0.5",
 * 0.3–0.5" between blocks) and are meant to be tuned on rendered decks. Colours reuse the chat chart
 * tokens so a chart looks the same in chat and on a slide.
 */

/** pptxgenjs `LAYOUT_16x9`, the canvas the type scale above is given for. */
export const SLIDE_WIDTH_IN = 10;
export const SLIDE_HEIGHT_IN = 5.625;

export const MARGIN_IN = 0.5;
export const BLOCK_GAP_IN = 0.3;
export const CONTENT_WIDTH_IN = SLIDE_WIDTH_IN - 2 * MARGIN_IN;
/** Title slides keep shorter lines than content slides. */
const TITLE_SLIDE_TEXT_WIDTH_IN = 8;
const TITLE_SLIDE_SUBTITLE_GAP_IN = 0.2;

export const FONT_FACE = 'Arial';

export interface FontRange {
    max: number;
    min: number;
    bold: boolean;
    maxLines: number;
}

// The title slide's minimum is below the type scale's 36pt so a long deck title can still fit in three lines.
export const TITLE_SLIDE_TITLE: FontRange = { max: 40, min: 32, bold: true, maxLines: 3 };
export const TITLE_SLIDE_SUBTITLE: FontRange = { max: 20, min: 16, bold: false, maxLines: 2 };
export const SLIDE_TITLE: FontRange = { max: 24, min: 20, bold: true, maxLines: 2 };
export const BODY: FontRange = { max: 16, min: 14, bold: false, maxLines: Infinity };
export const TAKEAWAY: FontRange = { max: 16, min: 14, bold: false, maxLines: 2 };
export const CHART_LABEL_PT = 12;

/** Exact line spacing ("Exactly" in PowerPoint), so every renderer stacks lines the same way. */
export const LINE_HEIGHT = 1.2;
const PT_PER_IN = 72;
export const PARAGRAPH_GAP_PT = 6;
export const BULLET_INDENT_PT = 18;

/**
 * Measured widths are multiplied by this before comparing with a box: about 10% headroom, since the
 * real font can't be checked. Liberation Sans has Arial's widths, but renderers still differ in
 * kerning and line breaking.
 */
export const WIDTH_SAFETY = 1.1;

export interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
}

/**
 * Tall enough for the range's maximum lines at its largest size, plus the space before the
 * paragraph, which the layout counts on every paragraph (renderers differ on the first).
 */
export const boxHeightIn = (range: FontRange): number => {
    return (range.maxLines * range.max * LINE_HEIGHT + PARAGRAPH_GAP_PT) / PT_PER_IN;
};

// Placeholder boxes, in inches. They are fixed per master because pptxgenjs gives a placeholder the
// master's position and size, whatever the slide asks for; text is fitted into them instead. A fixed
// body top also keeps content at the same height on every slide.
const TITLE_SLIDE_TITLE_HEIGHT_IN = boxHeightIn(TITLE_SLIDE_TITLE);
const TITLE_SLIDE_SUBTITLE_HEIGHT_IN = boxHeightIn(TITLE_SLIDE_SUBTITLE);
/** The title sits on this line (bottom-anchored) and the subtitle hangs from it, a little below the centre. */
const TITLE_SLIDE_BASELINE_IN = 3;

export const TITLE_SLIDE_TITLE_BOX: Box = {
    x: MARGIN_IN,
    y: TITLE_SLIDE_BASELINE_IN - TITLE_SLIDE_TITLE_HEIGHT_IN,
    w: TITLE_SLIDE_TEXT_WIDTH_IN,
    h: TITLE_SLIDE_TITLE_HEIGHT_IN,
};
export const TITLE_SLIDE_SUBTITLE_BOX: Box = {
    x: MARGIN_IN,
    y: TITLE_SLIDE_BASELINE_IN + TITLE_SLIDE_SUBTITLE_GAP_IN,
    w: TITLE_SLIDE_TEXT_WIDTH_IN,
    h: TITLE_SLIDE_SUBTITLE_HEIGHT_IN,
};
export const SLIDE_TITLE_BOX: Box = { x: MARGIN_IN, y: MARGIN_IN, w: CONTENT_WIDTH_IN, h: boxHeightIn(SLIDE_TITLE) };
const BODY_TOP_IN = SLIDE_TITLE_BOX.y + SLIDE_TITLE_BOX.h + BLOCK_GAP_IN;
export const BODY_BOX: Box = {
    x: MARGIN_IN,
    y: BODY_TOP_IN,
    w: CONTENT_WIDTH_IN,
    h: SLIDE_HEIGHT_IN - MARGIN_IN - BODY_TOP_IN,
};

const hex = (color: string): string => {
    return color.replace('#', '').toUpperCase();
};

// pptxgenjs colours take no `#` and no alpha; either corrupts the file.
export const COLORS = {
    background: 'FFFFFF',
    ink: hex(PROTON_INK),
    inkDim: hex(PROTON_INK_DIM),
    inkFaint: hex(PROTON_INK_FAINT),
    hairline: hex(PROTON_HAIRLINE),
    accent: hex(PROTON_PURPLE),
    titleSlideBackground: hex(PROTON_INK),
    titleSlideText: 'FFFFFF',
    titleSlideSubtitle: hex(PROTON_PURPLE_TINT),
    chartSeries: PROTON_CATEGORY_COLORS.slice(0, MAX_CHART_SERIES).map(hex),
};
