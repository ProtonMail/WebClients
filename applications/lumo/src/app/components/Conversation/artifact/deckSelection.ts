import type { DeckSelectionField, DeckSelectionPart } from '../../../types';

/**
 * Reads a selection on a JSON deck's canvas back as deck fields (D19), from the `data-deck-*`
 * attributes `DeckSlide` and `DeckPreview` put on each paragraph. The selected text alone doesn't
 * match the deck: lines are separate elements, a split slide's title ends in "(1/2)", and the same
 * words can be on several slides.
 */

const FIELD_SELECTOR = '[data-deck-field]';

const clampToNode = (range: Range, node: Node): Range => {
    const part = document.createRange();
    part.selectNodeContents(node);
    if (range.compareBoundaryPoints(Range.START_TO_START, part) > 0) {
        part.setStart(range.startContainer, range.startOffset);
    }
    if (range.compareBoundaryPoints(Range.END_TO_END, part) < 0) {
        part.setEnd(range.endContainer, range.endOffset);
    }
    return part;
};

/** The selected text of one field. Lines are joined with a space, where the layout broke them. */
const selectedText = (range: Range, field: Element): string => {
    const lines = Array.from(field.querySelectorAll('[data-deck-line]'));
    const pieces = (lines.length > 0 ? lines : [field])
        .filter((line) => {
            return range.intersectsNode(line);
        })
        .map((line) => {
            return clampToNode(range, line).toString();
        });
    return pieces.join(' ').replace(/\s+/g, ' ').trim();
};

const toPart = (range: Range, field: HTMLElement): DeckSelectionPart | null => {
    const { deckSlide, deckField, deckBullet, deckText } = field.dataset;
    const selected = selectedText(range, field);
    if (deckSlide === undefined || !deckField || deckText === undefined || !selected) {
        return null;
    }
    return {
        slide: Number(deckSlide) + 1,
        field: deckField as DeckSelectionField,
        ...(deckBullet !== undefined && { bullet: Number(deckBullet) + 1 }),
        text: deckText,
        selected,
    };
};

/** Every deck field the range touches, in document order; empty when it touches none (a chart, a label). */
export const readDeckSelection = (range: Range): DeckSelectionPart[] => {
    const common = range.commonAncestorContainer;
    const element = common instanceof Element ? common : common.parentElement;
    if (!element) {
        return [];
    }
    const enclosing = element.closest<HTMLElement>(FIELD_SELECTOR);
    const fields = enclosing
        ? [enclosing]
        : Array.from(element.querySelectorAll<HTMLElement>(FIELD_SELECTOR)).filter((field) => {
              return range.intersectsNode(field);
          });
    return fields
        .map((field) => {
            return toPart(range, field);
        })
        .filter((part): part is DeckSelectionPart => {
            return part !== null;
        });
};

/**
 * Selects a whole field on a plain click, for fields read as one piece: the "Data needed" box and
 * speaker notes. Runs on mouseup, before the panel's document listener reads the selection; a drag
 * or double-click that already selected text is left as it is.
 */
export const selectWholeField = (event: { currentTarget: HTMLElement }): void => {
    const selection = window.getSelection();
    if (!selection || !selection.isCollapsed) {
        return;
    }
    const target = event.currentTarget;
    const field = target.matches(FIELD_SELECTOR) ? target : target.querySelector(FIELD_SELECTOR);
    if (!field) {
        return;
    }
    selection.selectAllChildren(field);
};
