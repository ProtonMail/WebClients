/**
 * BM25 Search Index
 * 
 * Relevance-based document ranking using the BM25 algorithm. Supports searching
 * with full sentences/paragraphs and ranks documents by semantic relevance.
 * 
 * How it works:
 * 1. Tokenization: Text is normalized (compound words joined), lowercased, and 
 *    split into words ≥3 chars, filtered against stopwords
 * 
 * 2. Indexing: Each document is tokenized and unique terms are tracked with their
 *    document frequency (df). Document lengths are stored for normalization.
 * 
 * 3. IDF Calculation: Terms that appear in fewer documents get higher weights
 *    Formula: log((N - df + 0.5) / (df + 0.5) + 1)
 * 
 * 4. BM25 Scoring: For each query term in a document, score combines:
 *    - IDF: term importance across corpus
 *    - TF saturation: diminishing returns for repeated terms (controlled by k1)
 *    - Length normalization: adjusts for document length (controlled by b)
 *    Formula: Σ IDF(term) × (tf × (k1+1)) / (tf + k1 × (1 - b + b × (docLen/avgLen)))
 * 
 * 5. Ranking: Documents scored against query, sorted by relevance
 * 
 * Parameters:
 * - k1 (default 1.5): controls TF saturation (higher = more weight to term frequency)
 * - b (default 0.75): controls length normalization (0 = no normalization, 1 = full)
 */

import { STOPWORDS } from "./stopwords";

function normalizeCompoundWords(text: string): string {
    return text
        .replace(/(\w+)\s*[-_]\s*(\w+)/g, '$1$2')
        .replace(/(\w{3,})\s+(\w{3,})/g, (match, p1, p2) => {
            return `${match} ${p1}${p2}`;
        });
}

function tokenize(text: string): string[] {
    const normalized = normalizeCompoundWords(text);
    return normalized
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length >= 3);
}

interface IDFIndex {
    df: Map<string, number>;
    totalDocs: number;
    avgDocLength: number;
    docLengths: Map<string, number>;
}

export interface BM25Document {
    id: string;
    text: string;
    [key: string]: any;
}

export interface ScoredDocument<T extends BM25Document = BM25Document> {
    document: T;
    score: number;
}

export class BM25Index {
    private idfIndex: IDFIndex;
    private k1: number;
    private b: number;

    constructor(k1: number = 1.5, b: number = 0.75) {
        this.k1 = k1;
        this.b = b;
        this.idfIndex = {
            df: new Map(),
            totalDocs: 0,
            avgDocLength: 0,
            docLengths: new Map(),
        };
    }

    addDocument(docId: string, text: string): void {
        if (this.idfIndex.docLengths.has(docId)) {
            return;
        }

        const tokens = tokenize(text);
        const uniqueTerms = new Set(tokens.filter((t) => !STOPWORDS.has(t)));

        uniqueTerms.forEach((term) => {
            this.idfIndex.df.set(term, (this.idfIndex.df.get(term) || 0) + 1);
        });

        this.idfIndex.docLengths.set(docId, tokens.length);
        this.idfIndex.totalDocs++;
        this.updateAvgDocLength();
    }

    removeDocument(docId: string, text: string): void {
        if (!this.idfIndex.docLengths.has(docId)) {
            return;
        }

        const tokens = tokenize(text);
        const uniqueTerms = new Set(tokens.filter((t) => !STOPWORDS.has(t)));

        uniqueTerms.forEach((term) => {
            const currentDf = this.idfIndex.df.get(term) || 0;
            if (currentDf > 1) {
                this.idfIndex.df.set(term, currentDf - 1);
            } else {
                this.idfIndex.df.delete(term);
            }
        });

        this.idfIndex.docLengths.delete(docId);
        this.idfIndex.totalDocs = Math.max(0, this.idfIndex.totalDocs - 1);
        this.updateAvgDocLength();
    }

    private updateAvgDocLength(): void {
        if (this.idfIndex.totalDocs === 0) {
            this.idfIndex.avgDocLength = 0;
            return;
        }

        let total = 0;
        this.idfIndex.docLengths.forEach((length) => (total += length));
        this.idfIndex.avgDocLength = total / this.idfIndex.totalDocs;
    }

    private computeIDF(term: string): number {
        const df = this.idfIndex.df.get(term);
        if (!df || this.idfIndex.totalDocs === 0) return 0;

        const N = this.idfIndex.totalDocs;
        return Math.log((N - df + 0.5) / (df + 0.5) + 1);
    }

    reformulateQuery(queryText: string, topK: number = 10): string[] {
        const tokens = tokenize(queryText).filter((t) => !STOPWORDS.has(t));
        if (tokens.length === 0) return [];

        const tf = new Map<string, number>();
        tokens.forEach((token) => {
            tf.set(token, (tf.get(token) || 0) + 1);
        });

        const scores: [string, number][] = [];
        tf.forEach((count, term) => {
            const idf = this.computeIDF(term);
            if (idf > 0) {
                const normalizedTf = count / tokens.length;
                scores.push([term, normalizedTf * idf]);
            }
        });

        return scores
            .sort((a, b) => b[1] - a[1])
            .slice(0, Math.min(topK, scores.length))
            .map(([term]) => term);
    }

    private computeBM25Score(docId: string, docText: string, queryTermFreqs: Map<string, number>): number {
        const docTokens = tokenize(docText).filter((t) => !STOPWORDS.has(t));
        const docLength = this.idfIndex.docLengths.get(docId) || docTokens.length;

        const docTermFreqs = new Map<string, number>();
        docTokens.forEach((token) => {
            docTermFreqs.set(token, (docTermFreqs.get(token) || 0) + 1);
        });

        let score = 0;

        queryTermFreqs.forEach((_, queryTerm) => {
            const tf = docTermFreqs.get(queryTerm) || 0;
            if (tf === 0) return;

            const idf = this.computeIDF(queryTerm);
            const numerator = tf * (this.k1 + 1);
            const denominator = tf + this.k1 * (1 - this.b + this.b * (docLength / this.idfIndex.avgDocLength));

            score += idf * (numerator / denominator);
        });

        return score;
    }

    rankDocuments<T extends BM25Document>(
        queryText: string,
        candidates: T[],
        topK?: number,
        minScore: number = 0
    ): ScoredDocument<T>[] {
        const queryTokens = tokenize(queryText).filter((t) => !STOPWORDS.has(t));

        if (queryTokens.length === 0) {
            return [];
        }

        const queryTermFreqs = new Map<string, number>();
        queryTokens.forEach((token) => {
            queryTermFreqs.set(token, (queryTermFreqs.get(token) || 0) + 1);
        });

        const scored: ScoredDocument<T>[] = candidates
            .map((doc) => ({
                document: doc,
                score: this.computeBM25Score(doc.id, doc.text, queryTermFreqs),
            }))
            .filter((result) => result.score > minScore);

        scored.sort((a, b) => b.score - a.score);

        return topK ? scored.slice(0, topK) : scored;
    }

    hasTermInVocabulary(term: string): boolean {
        return this.idfIndex.df.has(term.toLowerCase());
    }

    getMatchingTerms(queryText: string): string[] {
        const tokens = tokenize(queryText).filter((t) => !STOPWORDS.has(t));
        return tokens.filter((t) => this.idfIndex.df.has(t));
    }

    clear(): void {
        this.idfIndex = {
            df: new Map(),
            totalDocs: 0,
            avgDocLength: 0,
            docLengths: new Map(),
        };
    }

    setBM25Params(k1: number, b: number): void {
        this.k1 = k1;
        this.b = b;
    }

    serialize(): string {
        return JSON.stringify({
            df: Array.from(this.idfIndex.df.entries()),
            totalDocs: this.idfIndex.totalDocs,
            avgDocLength: this.idfIndex.avgDocLength,
            docLengths: Array.from(this.idfIndex.docLengths.entries()),
            k1: this.k1,
            b: this.b,
        });
    }

    static deserialize(data: string): BM25Index {
        const parsed = JSON.parse(data);
        const index = new BM25Index(parsed.k1, parsed.b);
        index.idfIndex.df = new Map(parsed.df);
        index.idfIndex.totalDocs = parsed.totalDocs;
        index.idfIndex.avgDocLength = parsed.avgDocLength;
        index.idfIndex.docLengths = new Map(parsed.docLengths);
        return index;
    }

    getStats() {
        return {
            totalDocs: this.idfIndex.totalDocs,
            vocabularySize: this.idfIndex.df.size,
            avgDocLength: Math.round(this.idfIndex.avgDocLength),
            bm25Params: { k1: this.k1, b: this.b },
        };
    }
}
