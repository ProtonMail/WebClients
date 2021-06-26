import React from 'react';
import { normalize } from '@proton/shared/lib/helpers/string';

/**
 *  Returns a formatted JSX with all matches wrapped with <b></b>
 */
export const getMatch = (
    input: string | undefined,
    match: string,
    getHighlightedText = (str: string) => <mark>{str}</mark>
) => {
    if (!input) {
        return input;
    }
    const parts = normalize(input, true).split(match);
    if (parts.length < 2) {
        return;
    }
    const { result } = parts.reduce(
        (acc, part, partIndex) => {
            const matchPart = (
                <>
                    {acc.result}
                    {input.substring(acc.currentIdx, acc.currentIdx + part.length)}
                    {partIndex !== parts.length - 1 && getHighlightedText(match)}
                </>
            );
            return { result: matchPart, currentIdx: acc.currentIdx + part.length + match.length };
        },
        { result: <></>, currentIdx: 0 }
    );
    return result;
};
