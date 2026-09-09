import type { ReactNode } from 'react';
import { isValidElement } from 'react';

/**
 * A card's sentence flattened back to plain text, for the one place a node cannot go: the `title` a
 * clipped line has to carry. Read off the sentence rather than asked of every renderer as a second
 * string, so the two can never drift and the copy stays translated once.
 */
const sentenceText = (sentence: ReactNode): string => {
    if (typeof sentence === 'string' || typeof sentence === 'number') {
        return String(sentence);
    }
    if (Array.isArray(sentence)) {
        return sentence.map(sentenceText).join('');
    }
    if (isValidElement(sentence)) {
        return sentenceText((sentence.props as { children?: ReactNode }).children);
    }

    return '';
};

export default sentenceText;
