import { BM25Index } from './bm25Index';
import { STOPWORDS } from './stopwords';

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

describe('BM25Index tokenizing large text', () => {
    /**
     * WEB-LUMO-8WE: joining hyphenated words used to be one global regex, which recurses in
     * the engine's matcher and threw `InternalError: too much recursion` on Firefox. The
     * corpus here is the shape that reached it — a whole Drive document below the chunker's
     * threshold, so it arrives unchunked.
     */
    const bigText = (unit: string, targetLength: number) => {
        let text = '';
        while (text.length < targetLength) {
            text += unit;
        }
        return text.slice(0, targetLength);
    };

    const shapes: [string, string][] = [
        ['prose with hyphens and underscores', bigText('the quick brown fox-jump lazy_dog. ', 600_000)],
        ['one word with no separators at all', bigText('a', 600_000)],
        ['alternating word and hyphen', bigText('a-', 600_000)],
        ['alternating word and underscore', bigText('a_', 600_000)],
        ['nothing but separators', bigText('_', 600_000)],
        ['dense identifiers', bigText('api_gateway-v2 ', 600_000)],
    ];

    it.each(shapes)('indexes %s without exhausting the stack', (_label, text) => {
        const index = new BM25Index();

        expect(() => index.addDocument('big', text)).not.toThrow();
        expect(index.getStats().totalDocs).toBe(1);
    });

    it('does not index terms past MAX_TOKENIZE_CHARS', () => {
        const index = new BM25Index();
        const text = `${bigText('filler ', 600_000)} chronoglyph`;

        index.addDocument('big', text);

        // Only the head of an oversized document is indexed, so the tail is not searchable.
        expect(index.hasTermInVocabulary('chronoglyph')).toBe(false);
        expect(index.hasTermInVocabulary('filler')).toBe(true);
    });
});

describe('BM25Index hyphenated and underscored terms', () => {
    const corpus = {
        hyphenated: 'The open-source licence covers every distribution channel.',
        separated: 'The source is open for anyone who wants the licence.',
        underscored: 'Configure api_gateway before the rollout.',
    };

    const build = () => {
        const index = buildIndex(corpus);
        return (query: string) => index.rankDocuments(query, candidates(corpus)).map((r) => r.document.id);
    };

    it('matches a hyphenated query against the hyphenated document', () => {
        expect(build()('open-source licence')).toContain('hyphenated');
    });

    it('matches an underscored identifier', () => {
        expect(build()('api_gateway rollout')).toContain('underscored');
    });

    /**
     * The old tokenizer: the same pipeline `bm25Index` runs, with the join left to the global
     * regex. Used as the oracle the new implementation is compared against.
     */
    function tokensFromOldRegex(text: string): string[] {
        const source = text.replace(/(\w+)\s*[-_]\s*(\w+)/g, '$1$2');
        const words = source
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter((t) => t.length >= 3);
        const tokens = [...words];
        for (let i = 0; i < words.length - 1; i++) {
            tokens.push(words[i] + words[i + 1]);
        }
        return tokens;
    }

    const inputs = [
        '',
        '-',
        '_',
        'a-',
        '-a',
        'a - b',
        'snake_case_word',
        'open-source software',
        'foo - bar - baz',
        'x__y',
        'x--y',
        'a-b-c',
        'a-b-c-d-e-f',
        '1-2-3',
        'A_B c-D',
        ' a _ b ',
        '___',
        'a_-b',
        '-_-',
        '_a_',
        'a_b_c',
        'note-v2_final draft',
        'T-800 is 1_000 ok',
        'The quick brown fox jumps over the lazy dog.',
        'e-mail address, self-contained module',
        'https://proton.me/drive/folder-name/file_v2.pdf',
        '日本語 テスト mixed テキスト',
        'trailing- lead- ing middle-of-word',
        'word\nnext-line tab\there',
        '__a  _aaa _',
        'a-__  _bb_   a-__',
    ];

    it.each(inputs.map((input) => [input]))('tokenizes %j exactly as the old regex did', (input) => {
        const index = new BM25Index();
        index.addDocument('doc', input);

        // The vocabulary is the tokenizer's output minus stopwords, so comparing it compares
        // the join itself: any drift in how a separator is absorbed shows up here.
        const expected = tokensFromOldRegex(input).filter((t) => !STOPWORDS.has(t));
        expect([...index.getVocabulary()].sort()).toEqual([...new Set(expected)].sort());
    });

    it('agrees with the old regex over randomly generated text', () => {
        const alphabet = 'abAB019 \t\n-_.,ü日x';
        const index = new BM25Index();
        let checked = 0;

        // Seeded (mulberry32) so the generated inputs are deterministic and a failure is reproducible.
        let seed = 0x5eed1234;
        const nextRandom = () => {
            seed = (seed + 0x6d2b79f5) | 0;
            let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };

        for (let i = 0; i < 400; i++) {
            let text = '';
            const length = 1 + Math.floor(nextRandom() * 40);
            for (let j = 0; j < length; j++) {
                text += alphabet[Math.floor(nextRandom() * alphabet.length)];
            }
            index.clear();
            index.addDocument('doc', text);

            const expected = tokensFromOldRegex(text).filter((t) => !STOPWORDS.has(t));
            expect([...index.getVocabulary()].sort()).toEqual([...new Set(expected)].sort());
            checked++;
        }

        expect(checked).toBe(400);
    });
});
