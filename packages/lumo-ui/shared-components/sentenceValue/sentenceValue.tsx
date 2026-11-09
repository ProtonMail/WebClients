import type { ReactNode } from 'react';

/**
 * One emphasised value inside a confirm card's sentence — the count, the destination, the name. The
 * sentence itself is a single translated string with these as placeholders, so a locale is free to
 * reorder them; the emphasis is presentation and never part of the copy.
 *
 * `key` is derived from the text because a sentence is built as an array of nodes, and React wants
 * every child of one keyed.
 */
const sentenceValue = (text: string): ReactNode => (
    <span key={text} className="text-semibold">
        {text}
    </span>
);

export default sentenceValue;
