import type { LaidOutParagraph, TextShape } from './layoutDeck';
import { BULLET_INDENT_PT } from './slideTokens';
import { wrapText } from './textMetrics';

/**
 * Where a text shape's lines go, shared by the canvas preview and the PDF writer so both break and
 * stack lines the same way. All values in points.
 */

interface PlacedParagraph extends LaidOutParagraph {
    lines: string[];
}

export interface PlacedText {
    paragraphs: PlacedParagraph[];
    /** Space above the first line inside the inset box, from the shape's vertical alignment. */
    offsetPt: number;
}

export const placeTextShape = (shape: TextShape): PlacedText => {
    const widthPt = shape.w * 72 - 2 * shape.insetPt;
    const paragraphs = shape.paragraphs.map((paragraph) => {
        return {
            ...paragraph,
            // No headroom: break lines where PowerPoint would. The layout's headroom only makes the
            // fit conservative, so the text always fits the box at these breaks.
            lines: wrapText(
                paragraph.text,
                widthPt - paragraph.level * BULLET_INDENT_PT,
                shape.fontSizePt,
                shape.bold,
                1
            ),
        };
    });
    // Renderers skip the space before the first paragraph; the layout counts it to be safe.
    const contentHeight = paragraphs.reduce((height, paragraph, index) => {
        return height + paragraph.lines.length * shape.lineHeightPt + (index > 0 ? shape.paragraphGapPt : 0);
    }, 0);
    const innerHeight = shape.h * 72 - 2 * shape.insetPt;
    let offset = 0;
    if (shape.valign === 'middle') {
        offset = (innerHeight - contentHeight) / 2;
    } else if (shape.valign === 'bottom') {
        offset = innerHeight - contentHeight;
    }
    return { paragraphs, offsetPt: Math.max(offset, 0) };
};
