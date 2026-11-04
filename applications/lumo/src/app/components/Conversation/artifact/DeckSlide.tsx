import { memo } from 'react';

import type { DeckSelectionField } from '../../../types';
import type { DeckTextField, LaidOutSlide, TextShape } from '../../../util/slides/layoutDeck';
import { placeTextShape } from '../../../util/slides/placeText';
import { BULLET_INDENT_PT, COLORS, SLIDE_HEIGHT_IN, SLIDE_WIDTH_IN } from '../../../util/slides/slideTokens';
import { DeckChart } from './DeckChart';
import { selectWholeField } from './deckSelection';

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

// Keyed on the deck field, not the shape's role: columns and quotes reuse the body/subtitle roles.
const SELECTION_FIELDS: Record<DeckTextField, DeckSelectionField> = {
    title: 'title',
    subtitle: 'subtitle',
    bullets: 'bullet',
    left: 'left',
    right: 'right',
    quote: 'quote',
    attribution: 'attribution',
    takeaway: 'takeaway',
    dataNeeded: 'missingData',
};

interface TextBoxProps {
    shape: TextShape;
    sourceSlide: number;
    /** A click selects the whole "Data needed" box, so the user can supply the data (D19). */
    selectable: boolean;
}

/**
 * Each paragraph says which deck field it shows (`data-deck-*`), and each line is marked, so a
 * selection can be read back as deck fields (`readDeckSelection`).
 */
const TextBox = ({ shape, sourceSlide, selectable }: TextBoxProps) => {
    const insetPx = shape.insetPt * PX_PER_PT;
    const lineHeightPx = shape.lineHeightPt * PX_PER_PT;
    const gapPx = shape.paragraphGapPt * PX_PER_PT;
    const bulletIndentPx = BULLET_INDENT_PT * PX_PER_PT;
    const { paragraphs, offsetPt } = placeTextShape(shape);
    const offset = offsetPt * PX_PER_PT;
    const selectsWhole = selectable && shape.role === 'dataNeeded';

    return (
        // A mouse shortcut for making a text selection, not a control: selections are mouse-made everywhere in the canvas.
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div
            onMouseUp={selectsWhole ? selectWholeField : undefined}
            style={{
                cursor: selectsWhole ? 'pointer' : undefined,
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
            <div style={{ paddingTop: offset }}>
                {paragraphs.map((paragraph, index) => {
                    const indentPx = paragraph.level * bulletIndentPx;
                    return (
                        <div
                            key={index}
                            data-deck-slide={sourceSlide}
                            data-deck-field={SELECTION_FIELDS[shape.deckField]}
                            data-deck-bullet={paragraph.bullet}
                            data-deck-text={paragraph.sourceText ?? paragraph.text}
                            style={{ position: 'relative', marginTop: index > 0 ? gapPx : 0, paddingLeft: indentPx }}
                        >
                            {paragraph.level > 0 && (
                                <span
                                    style={{
                                        position: 'absolute',
                                        left: indentPx - bulletIndentPx,
                                        userSelect: 'none',
                                    }}
                                    aria-hidden="true"
                                >
                                    •
                                </span>
                            )}
                            {paragraph.lines.map((line, lineIndex) => {
                                return (
                                    <div
                                        key={lineIndex}
                                        data-deck-line
                                        style={{ whiteSpace: 'nowrap', height: lineHeightPx }}
                                    >
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
    /** In the canvas, where selections can be sent to Lumo; not on Library cards. */
    selectable?: boolean;
}

const SLIDE_BACKGROUND: Record<string, string> = {
    LUMO_TITLE: COLORS.titleSlideBackground,
    LUMO_SECTION: COLORS.sectionSlideBackground,
};

export const DeckSlide = memo(function DeckSlide({ slide, width, selectable = false }: Props) {
    const scale = width / SLIDE_WIDTH_PX;
    const background = SLIDE_BACKGROUND[slide.master] ?? COLORS.background;

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
                        return (
                            <TextBox
                                key={index}
                                shape={shape}
                                sourceSlide={slide.sourceSlide}
                                selectable={selectable}
                            />
                        );
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
