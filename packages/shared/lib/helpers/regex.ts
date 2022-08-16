export const escapeRegex = (string: string) => {
    return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
};

export interface MatchChunk {
    start: number;
    end: number;
}

export const getMatches = (regex: RegExp, b: string): MatchChunk[] => {
    return [...b.matchAll(regex)].map((match) => {
        const { index = 0 } = match;
        return {
            start: index,
            end: index + match[0].length,
        };
    });
};
