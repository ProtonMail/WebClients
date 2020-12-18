export const escapeRegex = (string: string) => {
    return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
};

export interface MatchChunk {
    start: number;
    end: number;
}

export const getMatches = (regex: RegExp, b: string): MatchChunk[] => {
    const chunks: MatchChunk[] = [];
    let match;

    do {
        match = regex.exec(b);
        if (!match) {
            break;
        }
        const start = match.index;
        const end = regex.lastIndex;
        // We do not return zero-length matches
        if (end > start) {
            chunks.push({ start, end });
        }

        // Prevent browsers like Firefox from getting stuck in an infinite loop
        // See http://www.regexguru.com/2008/04/watch-out-for-zero-length-matches/
        if (match.index === regex.lastIndex) {
            regex.lastIndex++;
        }
    } while (match !== null);

    return chunks;
};
