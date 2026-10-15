import { LINE_HEIGHT, MARGIN_IN } from '../slideTokens';
import { wrapText } from '../textMetrics';
import type { InspectedDeck, InspectedShape } from './inspectPptx';

/**
 * Checks on a generated .pptx, automating a usual visual QA list for decks (overflow, overlap,
 * margins, leftover placeholders): shapes off the slide or inside the margin, overlapping shapes,
 * text taller than its box, pictures (which can't be edited as text or data), and empty placeholders.
 *
 * Overflow is re-measured from the written XML (sizes, insets, indents, spacing), so it catches a
 * writer that drops formatting. It uses the same font widths as the layout, so it can't catch a
 * renderer that lays text out differently; the rendered-PDF check in the eval runner covers that.
 */

const PT_PER_IN = 72;
/** Slack for EMU rounding when comparing positions, in inches. */
const POSITION_TOLERANCE_IN = 0.005;
/** Slack for rounding when comparing text height with its box, in points. */
const HEIGHT_TOLERANCE_PT = 0.5;

export type LayoutCheck = 'offSlide' | 'margin' | 'overlap' | 'overflow' | 'picture' | 'emptyPlaceholder';

export interface LayoutFinding {
    /** 1-based, as in PowerPoint. */
    slide: number;
    check: LayoutCheck;
    shape: string;
    message: string;
}

const label = (shape: InspectedShape): string => {
    return shape.placeholder ? `${shape.placeholder} placeholder` : shape.name;
};

/** Height the shape's text needs, in points, laid out the way the layout engine does it. */
export const measureShapeTextPt = (shape: InspectedShape): number => {
    const widthPt = shape.box.w * PT_PER_IN - shape.insetsPt.left - shape.insetsPt.right;
    let height = 0;
    shape.paragraphs.forEach((paragraph, index) => {
        const lines = wrapText(
            paragraph.text,
            widthPt - paragraph.marginLeftPt,
            paragraph.sizePt,
            paragraph.bold
        ).length;
        // Space before counts on every paragraph, as in the layout (renderers differ on the first).
        height += lines * (paragraph.lineSpacingPt ?? paragraph.sizePt * LINE_HEIGHT) + paragraph.spaceBeforePt;
        if (index < shape.paragraphs.length - 1) {
            height += paragraph.spaceAfterPt;
        }
    });
    return height;
};

const overlapArea = (a: InspectedShape, b: InspectedShape): number => {
    const width = Math.min(a.box.x + a.box.w, b.box.x + b.box.w) - Math.max(a.box.x, b.box.x);
    const height = Math.min(a.box.y + a.box.h, b.box.y + b.box.h) - Math.max(a.box.y, b.box.y);
    return width > POSITION_TOLERANCE_IN && height > POSITION_TOLERANCE_IN ? width * height : 0;
};

export const checkLayout = (deck: InspectedDeck): LayoutFinding[] => {
    const findings: LayoutFinding[] = [];
    deck.slides.forEach((slide, slideIndex) => {
        const slideNumber = slideIndex + 1;
        const add = (check: LayoutCheck, shape: InspectedShape, message: string): void => {
            findings.push({ slide: slideNumber, check, shape: label(shape), message });
        };

        for (const shape of slide.shapes) {
            const { x, y, w, h } = shape.box;
            const right = x + w;
            const bottom = y + h;
            if (
                x < -POSITION_TOLERANCE_IN ||
                y < -POSITION_TOLERANCE_IN ||
                right > deck.widthIn + POSITION_TOLERANCE_IN ||
                bottom > deck.heightIn + POSITION_TOLERANCE_IN
            ) {
                add(
                    'offSlide',
                    shape,
                    `Box ${x.toFixed(2)},${y.toFixed(2)} ${w.toFixed(2)}×${h.toFixed(2)}" leaves the slide.`
                );
            } else if (
                x < MARGIN_IN - POSITION_TOLERANCE_IN ||
                y < MARGIN_IN - POSITION_TOLERANCE_IN ||
                right > deck.widthIn - MARGIN_IN + POSITION_TOLERANCE_IN ||
                bottom > deck.heightIn - MARGIN_IN + POSITION_TOLERANCE_IN
            ) {
                add('margin', shape, `Box reaches into the ${MARGIN_IN}" margin.`);
            }

            if (shape.kind === 'picture') {
                add('picture', shape, 'Picture on the slide: its content cannot be edited as text or data.');
            }
            if (shape.kind === 'text') {
                const text = shape.paragraphs
                    .map((paragraph) => {
                        return paragraph.text;
                    })
                    .join('')
                    .trim();
                if (!text && shape.placeholder) {
                    add('emptyPlaceholder', shape, 'Placeholder left empty.');
                }
                const neededPt = measureShapeTextPt(shape);
                const availablePt = h * PT_PER_IN - shape.insetsPt.top - shape.insetsPt.bottom;
                if (neededPt > availablePt + HEIGHT_TOLERANCE_PT) {
                    add('overflow', shape, `Text needs ${neededPt.toFixed(1)}pt, box has ${availablePt.toFixed(1)}pt.`);
                }
            }
        }

        for (let i = 0; i < slide.shapes.length; i++) {
            for (let j = i + 1; j < slide.shapes.length; j++) {
                const area = overlapArea(slide.shapes[i]!, slide.shapes[j]!);
                if (area > 0) {
                    add(
                        'overlap',
                        slide.shapes[i]!,
                        `Overlaps ${label(slide.shapes[j]!)} by ${area.toFixed(3)} sq in.`
                    );
                }
            }
        }
    });
    return findings;
};
