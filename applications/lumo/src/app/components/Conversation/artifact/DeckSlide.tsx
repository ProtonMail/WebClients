import { memo } from 'react';

import type { LaidOutSlide, TextShape } from '../../../util/slides/layoutDeck';
import { BULLET_INDENT_PT, COLORS, SLIDE_HEIGHT_IN, SLIDE_WIDTH_IN } from '../../../util/slides/slideTokens';
import { wrapText } from '../../../util/slides/textMetrics';
import { DeckChart } from './DeckChart';

/**
 * One slide of a JSON deck, drawn from the same laid-out shapes the .pptx is written from: same
 * boxes, sizes and line breaks (lines come from the layout's own wrapping, so the browser's font
 * can't reflow them). Model text is rendered as React text; there is no iframe and no model HTML.
 *
 * Geometry is inline style rather than utility classes: it is computed per shape, and the slide
 * has to draw the same wherever it's shown (panel, Library card, test harness).
 */

const PX_PER_IN = 96;
const PX_PER_PT = PX_PER_IN / 72;
export const SLIDE_WIDTH_PX = SLIDE_WIDTH_IN * PX_PER_IN;
export const SLIDE_HEIGHT_PX = SLIDE_HEIGHT_IN * PX_PER_IN;
// Arial where installed; Liberation Sans and Arimo have the same widths.
const SLIDE_FONT = 'Arial, "Liberation Sans", Arimo, sans-serif';

const toHex = (color: string): string => {
    return `#${color}`;
};

interface TextBoxProps {
    shape: TextShape;
}

const TextBox = ({ shape }: TextBoxProps) => {
    const insetPx = shape.insetPt * PX_PER_PT;
    const widthPt = shape.w * 72 - 2 * shape.insetPt;
    const lineHeightPx = shape.lineHeightPt * PX_PER_PT;
    const gapPx = shape.paragraphGapPt * PX_PER_PT;
    const bulletIndentPx = BULLET_INDENT_PT * PX_PER_PT;
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
        return height + paragraph.lines.length * lineHeightPx + (index > 0 ? gapPx : 0);
    }, 0);
    const innerHeight = shape.h * PX_PER_IN - 2 * insetPx;
    let offset = 0;
    if (shape.valign === 'middle') {
        offset = (innerHeight - contentHeight) / 2;
    } else if (shape.valign === 'bottom') {
        offset = innerHeight - contentHeight;
    }

    return (
        <div
            style={{
                position: 'absolute',
                left: shape.x * PX_PER_IN,
                top: shape.y * PX_PER_IN,
                width: shape.w * PX_PER_IN,
                height: shape.h * PX_PER_IN,
                padding: insetPx,
                boxSizing: 'border-box',
                border: shape.dashedBorder ? `${1.5 * PX_PER_PT}px dashed ${toHex(COLORS.inkFaint)}` : undefined,
                color: toHex(shape.color),
                fontFamily: SLIDE_FONT,
                fontSize: shape.fontSizePt * PX_PER_PT,
                fontWeight: shape.bold ? 700 : 400,
                lineHeight: `${lineHeightPx}px`,
                textAlign: shape.align,
            }}
        >
            <div style={{ paddingTop: Math.max(offset, 0) }}>
                {paragraphs.map((paragraph, index) => {
                    const indentPx = paragraph.level * bulletIndentPx;
                    return (
                        <div
                            key={index}
                            style={{ position: 'relative', marginTop: index > 0 ? gapPx : 0, paddingLeft: indentPx }}
                        >
                            {paragraph.level > 0 && (
                                <span
                                    style={{ position: 'absolute', left: indentPx - bulletIndentPx }}
                                    aria-hidden="true"
                                >
                                    •
                                </span>
                            )}
                            {paragraph.lines.map((line, lineIndex) => {
                                return (
                                    <div key={lineIndex} style={{ whiteSpace: 'nowrap', height: lineHeightPx }}>
                                        {line}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface Props {
    slide: LaidOutSlide;
    /** Rendered width in CSS pixels; the slide is drawn at 960 × 540 and scaled to it. */
    width: number;
}

export const DeckSlide = memo(function DeckSlide({ slide, width }: Props) {
    const scale = width / SLIDE_WIDTH_PX;
    const background = slide.master === 'LUMO_TITLE' ? COLORS.titleSlideBackground : COLORS.background;

    return (
        <div
            className="rounded shadow-norm"
            style={{ position: 'relative', overflow: 'hidden', flexShrink: 0, width, height: SLIDE_HEIGHT_PX * scale }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: SLIDE_WIDTH_PX,
                    height: SLIDE_HEIGHT_PX,
                    transform: `scale(${scale})`,
                    transformOrigin: '0 0',
                    background: toHex(background),
                }}
            >
                {slide.shapes.map((shape, index) => {
                    if (shape.kind === 'text') {
                        return <TextBox key={index} shape={shape} />;
                    }
                    return (
                        <div
                            key={index}
                            style={{ position: 'absolute', left: shape.x * PX_PER_IN, top: shape.y * PX_PER_IN }}
                        >
                            <DeckChart chart={shape.chart} width={shape.w * PX_PER_IN} height={shape.h * PX_PER_IN} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
});
