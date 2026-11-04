import { useEffect, useRef } from 'react';

import type { DeckTextField, LaidOutSlide, TextShape } from '../../../util/slides/layoutDeck';
import { BULLET_INDENT_PT, COLORS, SLIDE_HEIGHT_IN, SLIDE_WIDTH_IN } from '../../../util/slides/slideTokens';
import { DeckChart } from './DeckChart';

/**
 * One slide rendered in edit mode at native 960 × 540 px (no CSS scale transform, so contenteditable
 * cursors land correctly). Text shapes are contenteditable; charts are read-only.
 */

const PX_PER_IN = 96;
const PX_PER_PT = PX_PER_IN / 72;
export const EDITOR_SLIDE_WIDTH_PX = SLIDE_WIDTH_IN * PX_PER_IN;
const EDITOR_SLIDE_HEIGHT_PX = SLIDE_HEIGHT_IN * PX_PER_IN;
const SLIDE_FONT = 'Arial, "Liberation Sans", Arimo, sans-serif';

const toHex = (color: string): string => {
    return `#${color}`;
};

export interface DeckEditEvent {
    sourceSlide: number;
    deckField: DeckTextField;
    bulletIndex?: number;
    value: string;
}

// ---------------------------------------------------------------------------
// EditableParagraph — a single uncontrolled contenteditable line
// ---------------------------------------------------------------------------

interface EditableParagraphProps {
    text: string;
    onBlur: (value: string) => void;
}

/**
 * Sets its text content once on mount via a ref; never re-applies it on re-render so the user's in-
 * progress edits are not clobbered. The parent key must change to force a remount when the initial
 * text needs to reset.
 */
const EditableParagraph = ({ text, onBlur }: EditableParagraphProps) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (ref.current) {
            ref.current.textContent = text;
        }
        // Intentionally run only on mount — re-renders must not reset the user's typed text.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            ref={ref}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
                onBlur(e.currentTarget.textContent ?? '');
            }}
            style={{
                outline: 'none',
                cursor: 'text',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                minHeight: '1em',
            }}
        />
    );
};

// ---------------------------------------------------------------------------
// EditableTextBox — positions + styles a text shape with editable paragraphs
// ---------------------------------------------------------------------------

interface EditableTextBoxProps {
    shape: TextShape;
    sourceSlide: number;
    onEdit: (event: DeckEditEvent) => void;
}

const EditableTextBox = ({ shape, sourceSlide, onEdit }: EditableTextBoxProps) => {
    const insetPx = shape.insetPt * PX_PER_PT;
    const bulletIndentPx = BULLET_INDENT_PT * PX_PER_PT;
    const gapPx = shape.paragraphGapPt * PX_PER_PT;

    const outerStyle: React.CSSProperties = {
        position: 'absolute',
        left: shape.x * PX_PER_IN,
        top: shape.y * PX_PER_IN,
        width: shape.w * PX_PER_IN,
        height: shape.h * PX_PER_IN,
        padding: insetPx,
        boxSizing: 'border-box',
        color: toHex(shape.color),
        fontFamily: SLIDE_FONT,
        fontSize: shape.fontSizePt * PX_PER_PT,
        fontWeight: shape.bold ? 700 : 400,
        lineHeight: `${shape.lineHeightPt * PX_PER_PT}px`,
        textAlign: shape.align,
        overflow: 'hidden',
    };

    // dataNeeded is read-only (no data to type in the editor)
    if (shape.role === 'dataNeeded') {
        return (
            <div
                style={{
                    ...outerStyle,
                    border: `${1.5 * PX_PER_PT}px dashed ${toHex(COLORS.inkFaint)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {shape.paragraphs[0]?.text}
            </div>
        );
    }

    return (
        <div style={outerStyle}>
            {shape.paragraphs.map((paragraph, index) => {
                const indentPx = paragraph.level * bulletIndentPx;
                // Use sourceText (the deck's own field value) when the rendered text differs from it
                // (e.g. a split-slide title like "Title (2/3)").
                const text = paragraph.sourceText ?? paragraph.text;
                return (
                    <div
                        key={index}
                        style={{ position: 'relative', marginTop: index > 0 ? gapPx : 0, paddingLeft: indentPx }}
                    >
                        {paragraph.level > 0 && (
                            <span
                                style={{ position: 'absolute', left: indentPx - bulletIndentPx, userSelect: 'none' }}
                                aria-hidden="true"
                            >
                                •
                            </span>
                        )}
                        <EditableParagraph
                            text={text}
                            onBlur={(value) => {
                                onEdit({
                                    sourceSlide,
                                    deckField: shape.deckField,
                                    bulletIndex: paragraph.bullet,
                                    value,
                                });
                            }}
                        />
                    </div>
                );
            })}
        </div>
    );
};

// ---------------------------------------------------------------------------
// DeckSlideEditor — the full slide at native size
// ---------------------------------------------------------------------------

const SLIDE_BACKGROUND: Record<string, string> = {
    LUMO_TITLE: COLORS.titleSlideBackground,
    LUMO_SECTION: COLORS.sectionSlideBackground,
};

interface Props {
    slide: LaidOutSlide;
    onEdit: (event: DeckEditEvent) => void;
}

export const DeckSlideEditor = ({ slide, onEdit }: Props) => {
    const background = SLIDE_BACKGROUND[slide.master] ?? COLORS.background;

    return (
        <div
            className="rounded shadow-norm"
            style={{
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0,
                width: EDITOR_SLIDE_WIDTH_PX,
                height: EDITOR_SLIDE_HEIGHT_PX,
                background: toHex(background),
            }}
        >
            {slide.shapes.map((shape, index) => {
                if (shape.kind === 'text') {
                    return (
                        <EditableTextBox key={index} shape={shape} sourceSlide={slide.sourceSlide} onEdit={onEdit} />
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
    );
};
