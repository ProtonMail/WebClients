import { useCallback, useEffect, useMemo, useRef } from 'react';

import { c } from 'ttag';

import type { BulletsSlide, ChartSlide, Deck, QuoteSlide, Slide, TwoColumnSlide } from '../../../util/slides/deck';
import { readDeckContent } from '../../../util/slides/deckContent';
import { layoutDeck } from '../../../util/slides/layoutDeck';
import type { DeckTextField } from '../../../util/slides/layoutDeck';
import type { DeckEditEvent } from './DeckSlideEditor';
import { DeckSlideEditor, EDITOR_SLIDE_WIDTH_PX } from './DeckSlideEditor';
import type { ParsedArtifact } from './parseArtifacts';

/**
 * Deck edit mode: every slide rendered at native 960 × 540 px with contenteditable text fields.
 * Edits are accumulated into a mutable copy of the deck and reported to the parent via `onChange`
 * on each blur, so the outer draftContent always reflects the latest JSON.
 */

interface Props {
    artifact: ParsedArtifact;
    onChange: (content: string) => void;
}

// ---------------------------------------------------------------------------
// Field patching — write a blur value back into the mutable deck copy
// ---------------------------------------------------------------------------

const patchSlideField = (
    slide: Slide,
    deckField: DeckTextField,
    bulletIndex: number | undefined,
    value: string
): void => {
    switch (deckField) {
        case 'title':
            if ('title' in slide) {
                (slide as Slide & { title: string }).title = value;
            }
            break;
        case 'subtitle':
            if ('subtitle' in slide) {
                (slide as Slide & { subtitle?: string }).subtitle = value || undefined;
            }
            break;
        case 'bullets':
            if (slide.layout === 'bullets' && bulletIndex !== undefined) {
                (slide as BulletsSlide).bullets[bulletIndex].text = value;
            }
            break;
        case 'left':
            if (slide.layout === 'two-column' && bulletIndex !== undefined) {
                (slide as TwoColumnSlide).left[bulletIndex].text = value;
            }
            break;
        case 'right':
            if (slide.layout === 'two-column' && bulletIndex !== undefined) {
                (slide as TwoColumnSlide).right[bulletIndex].text = value;
            }
            break;
        case 'quote':
            if (slide.layout === 'quote') {
                (slide as QuoteSlide).quote = value;
            }
            break;
        case 'attribution':
            if (slide.layout === 'quote') {
                (slide as QuoteSlide).attribution = value || undefined;
            }
            break;
        case 'takeaway':
            if (slide.layout === 'chart') {
                (slide as ChartSlide).takeaway = value || undefined;
            }
            break;
        case 'dataNeeded':
            break;
    }
};

// ---------------------------------------------------------------------------
// EditableNotes — one notes block per source slide, shown below the slide
// ---------------------------------------------------------------------------

interface EditableNotesProps {
    notes?: string;
    onBlur: (value: string) => void;
}

const EditableNotes = ({ notes, onBlur }: EditableNotesProps) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (ref.current) {
            ref.current.textContent = notes ?? '';
        }
        // Intentionally mount-only — same pattern as EditableParagraph.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex gap-2 text-sm color-weak" style={{ width: EDITOR_SLIDE_WIDTH_PX }}>
            <span className="text-semibold shrink-0 user-select-none">{c('collider_2025: Info').t`Notes:`}</span>
            <div
                ref={ref}
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                    onBlur(e.currentTarget.textContent ?? '');
                }}
                className="flex-1 outline-none cursor-text"
                style={{ whiteSpace: 'pre-wrap', minHeight: '1.5em', wordBreak: 'break-word' }}
            />
        </div>
    );
};

// ---------------------------------------------------------------------------
// DeckEditor
// ---------------------------------------------------------------------------

export const DeckEditor = ({ artifact, onChange }: Props) => {
    const parsed = useMemo(() => {
        return readDeckContent(artifact.content);
    }, [artifact.content]);
    const deck = parsed?.deck ?? null;
    const laidOut = useMemo(() => {
        return deck ? layoutDeck(deck) : null;
    }, [deck]);

    // Mutable copy of the deck; not React state so edits never cause re-renders.
    const editDeckRef = useRef<Deck | null>(null);
    if (editDeckRef.current === null && deck) {
        editDeckRef.current = structuredClone(deck);
    }

    const handleEdit = useCallback(
        (event: DeckEditEvent) => {
            const editDeck = editDeckRef.current;
            if (!editDeck) {
                return;
            }
            const slide = editDeck.slides[event.sourceSlide];
            if (!slide) {
                return;
            }
            patchSlideField(slide, event.deckField, event.bulletIndex, event.value);
            onChange(JSON.stringify(editDeck, null, 2));
        },
        [onChange]
    );

    const handleNotesEdit = useCallback(
        (sourceSlide: number, value: string) => {
            const editDeck = editDeckRef.current;
            if (!editDeck) {
                return;
            }
            const slide = editDeck.slides[sourceSlide];
            if (!slide) {
                return;
            }
            slide.notes = value || undefined;
            onChange(JSON.stringify(editDeck, null, 2));
        },
        [onChange]
    );

    if (!laidOut) {
        return (
            <div className="flex items-center justify-center flex-1 min-h-0 p-8">
                <p className="m-0 color-weak text-sm">
                    {c('collider_2025: Error').t`This slide deck couldn't be read.`}
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-0 overflow-auto bg-weak">
            {/* min-width keeps the slides from squishing on narrow panels; the outer div scrolls. */}
            <div className="flex flex-column items-center gap-4 p-4" style={{ minWidth: EDITOR_SLIDE_WIDTH_PX + 32 }}>
                {laidOut.slides.map((slide, index) => {
                    const slideNumber = index + 1;
                    return (
                        <section key={`${slide.sourceSlide}-${slide.part}`} className="flex flex-column gap-1">
                            <span className="text-xs color-weak user-select-none">
                                {c('collider_2025: Info').t`Slide ${slideNumber}`}
                            </span>
                            <DeckSlideEditor slide={slide} onEdit={handleEdit} />
                            {/* Notes are shown once per source slide (the first part only). */}
                            {slide.part === 1 && (
                                <EditableNotes
                                    notes={slide.notes}
                                    onBlur={(value) => {
                                        handleNotesEdit(slide.sourceSlide, value);
                                    }}
                                />
                            )}
                        </section>
                    );
                })}
            </div>
        </div>
    );
};
