import { BM25Index } from './bm25Index';

function buildIndex(docs: Record<string, string>): BM25Index {
    const index = new BM25Index();
    for (const [id, text] of Object.entries(docs)) {
        index.addDocument(id, text);
    }
    return index;
}

function candidates(docs: Record<string, string>) {
    return Object.entries(docs).map(([id, text]) => ({ id, text }));
}

describe('BM25Index.rankDocuments', () => {
    const corpus = {
        onTopic: 'chronoglyph calendar encoding explained in detail for the calendar team',
        passingMention: [
            'calendar calendar calendar calendar calendar calendar calendar',
            'calendar calendar calendar calendar calendar calendar calendar',
        ].join(' '),
        unrelated: 'quarterly travel expense policy and reimbursement forms',
    };

    it('reports how much of the query each document covers', () => {
        const index = buildIndex(corpus);
        const ranked = index.rankDocuments('chronoglyph calendar encoding', candidates(corpus));
        const byId = new Map(ranked.map((r) => [r.document.id, r]));

        expect(byId.get('onTopic')!.coverage).toBeGreaterThan(byId.get('passingMention')!.coverage);
        expect(byId.get('onTopic')!.coverage).toBeCloseTo(1, 5);
        expect(byId.has('unrelated')).toBe(false);
    });

    it('ignores query terms the corpus has never seen', () => {
        const index = buildIndex(corpus);
        const withNoise = index.rankDocuments('chronoglyph calendar encoding zzzznonexistent', candidates(corpus));
        const withoutNoise = index.rankDocuments('chronoglyph calendar encoding', candidates(corpus));

        // An unknown term carries no IDF, so it must not dilute anyone's coverage.
        expect(withNoise.find((r) => r.document.id === 'onTopic')!.coverage).toBeCloseTo(
            withoutNoise.find((r) => r.document.id === 'onTopic')!.coverage,
            5
        );
    });

    it('returns nothing for a query of only stopwords', () => {
        const index = buildIndex(corpus);

        expect(index.rankDocuments('and the for', candidates(corpus))).toEqual([]);
    });
});
