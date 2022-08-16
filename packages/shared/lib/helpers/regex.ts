export const escapeRegex = (string: string) => {
    return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
};

export interface MatchChunk {
    start: number;
    end: number;
}

export const getMatches = (regex: RegExp, b: string): MatchChunk[] => {
    return [...b.matchAll(regex)].map((match) => ({
        start: match.index || 0,
        end: (match.index || 0) + match[0].length,
    }));
};
