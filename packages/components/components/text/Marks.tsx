import React from 'react';
import { MatchChunk } from 'proton-shared/lib/helpers/regex';

interface Chunk {
    start: number;
    end: number;
    highlight: boolean;
}

const fillInChunks = (chunksToHighlight: Chunk[], totalLength: number) => {
    const allChunks: Chunk[] = [];
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

const combineChunks = (chunks: MatchChunk[]) => {
    return chunks
        .sort((first, second) => first.start - second.start)
        .reduce<Chunk[]>((processedChunks, nextChunk) => {
            // First chunk just goes straight in the array
            if (processedChunks.length === 0) {
                return [{ ...nextChunk, highlight: false }];
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
                processedChunks.push(prevChunk, { ...nextChunk, highlight: false });
            }
            return processedChunks;
        }, []);
};

interface Props {
    children: string;
    chunks: MatchChunk[];
}

const Marks = ({ children: text, chunks }: Props) => {
    if (!chunks.length) {
        return <>{text}</>;
    }
    const highlightedChunks = fillInChunks(combineChunks(chunks), text.length);
    return (
        <>
            {highlightedChunks.map(({ start, end, highlight }) => {
                const insert = text.substring(start, end);
                if (highlight) {
                    return <mark key={`${start}-${end}`}>{insert}</mark>;
                }
                return insert;
            }, [])}
        </>
    );
};

export default Marks;
