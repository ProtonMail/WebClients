import React, { ReactNode } from 'react';
import { normalize } from 'proton-shared/lib/helpers/string';

interface Props {
    children?: ReactNode;
    value?: string;
}

interface Chunk {
    start: number;
    end: number;
    highlight: boolean;
}

const findChunks = (searchWord: string, textToHighlight: string) => {
    const regex = new RegExp(searchWord, 'gi');
    const chunks = [];
    let match;

    do {
        match = regex.exec(textToHighlight);
        if (!match) {
            break;
        }
        const start = match.index;
        const end = regex.lastIndex;
        // We do not return zero-length matches
        if (end > start) {
            chunks.push({ start, end, highlight: false });
        }

        // Prevent browsers like Firefox from getting stuck in an infinite loop
        // See http://www.regexguru.com/2008/04/watch-out-for-zero-length-matches/
        if (match.index === regex.lastIndex) {
            regex.lastIndex++;
        }
    } while (match !== null);

    return chunks;
};

const combineChunks = (chunks: Chunk[]) => {
    return chunks
        .sort((first, second) => first.start - second.start)
        .reduce<Chunk[]>((processedChunks, nextChunk) => {
            // First chunk just goes straight in the array
            if (processedChunks.length === 0) {
                return [nextChunk];
            }
            // Subsequent chunks get checked to see if they overlap
            const prevChunk = processedChunks.pop();
            if (!prevChunk) {
                return processedChunks;
            }
            if (nextChunk.start <= prevChunk.end) {
                // It may be the case that prevChunk completely surrounds nextChunk, so take the largest of the end indeces.
                const endIndex = Math.max(prevChunk.end, nextChunk.end);
                processedChunks.push({ start: prevChunk.start, end: endIndex, highlight: false });
            } else {
                processedChunks.push(prevChunk, nextChunk);
            }
            return processedChunks;
        }, []);
};

const fillInChunks = (chunksToHighlight: Chunk[], totalLength: number) => {
    const allChunks = [] as Chunk[];
    const append = (start: number, end: number, highlight: boolean) => {
        if (end - start > 0) {
            allChunks.push({
                start,
                end,
                highlight,
            });
        }
    };

    if (chunksToHighlight.length === 0) {
        append(0, totalLength, false);
    } else {
        let lastIndex = 0;
        chunksToHighlight.forEach((chunk) => {
            append(lastIndex, chunk.start, false);
            append(chunk.start, chunk.end, true);
            lastIndex = chunk.end;
        });
        append(lastIndex, totalLength, false);
    }
    return allChunks;
};

const Mark = ({ children: textToHighlight, value: searchWord }: Props) => {
    if (!searchWord || typeof textToHighlight !== 'string') {
        return <>{textToHighlight}</>;
    }
    const normalizedSearchWord = normalize(searchWord, true);
    const normalizedTextToHighlight = normalize(textToHighlight, true);
    const chunks = findChunks(normalizedSearchWord, normalizedTextToHighlight);
    if (!chunks.length) {
        return <>{textToHighlight}</>;
    }
    const combinedChunks = combineChunks(chunks);
    const allChunks = fillInChunks(combinedChunks, textToHighlight.length);
    return (
        <>
            {allChunks.map(({ start, end, highlight }) => {
                const insert = textToHighlight.substring(start, end);
                if (highlight) {
                    return <mark>{insert}</mark>;
                }
                return insert;
            }, [])}
        </>
    );
};

export default React.memo(Mark);
