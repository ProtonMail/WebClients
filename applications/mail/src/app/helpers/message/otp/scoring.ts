/**
 * Tally candidate codes across the given extractors, weighting each extractor's
 * contribution by its configured weight. Only the extractors present in
 * `perExtractor` are tallied; the caller is responsible for excluding inactive
 * (weight-0) extractors upstream (see `ACTIVE_EXTRACTORS` in the facade), so this
 * is a pure weighted tally with no second weight gate.
 */
export function scoreCodes(
    perExtractor: Record<string, string[]>,
    weights: Record<string, number>
): Record<string, number> {
    const scores: Record<string, number> = {};
    for (const [name, codes] of Object.entries(perExtractor)) {
        const weight = weights[name];
        for (const code of codes) {
            scores[code] = (scores[code] || 0) + weight;
        }
    }
    return scores;
}

/**
 * Return the single strictly-highest-scoring code, or null if there is no unique
 * winner (no candidates, or a tie for the top score).
 */
export function predictStrict(scores: Record<string, number>): string | null {
    const entries = Object.entries(scores);
    if (entries.length === 0) {
        return null;
    }
    let top = -Infinity;
    for (const [, score] of entries) {
        if (score > top) {
            top = score;
        }
    }
    const winners = entries.filter(([, score]) => score === top).map(([code]) => code);
    return winners.length === 1 ? winners[0] : null;
}
