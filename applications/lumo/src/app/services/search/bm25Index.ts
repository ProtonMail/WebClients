/**
 * BM25 Search Index for relevance-based document ranking
 * 
 * This enables searching with sentences/paragraphs instead of just keywords,
 * ranking documents by relevance using the BM25 algorithm.
 */

import { STOPWORDS } from "./stopwords";

// Simple tokenizer
function tokenize(text: string): string[] {
    return text
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
    // BM25 parameters
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

    /**
     * Add a document to the index
     */
    addDocument(docId: string, text: string): void {
        // If document already exists, remove it first to avoid double-counting
        if (this.idfIndex.docLengths.has(docId)) {
            // We'd need the original text to properly remove, so just skip
            // The index will be slightly off but will self-correct on rebuild
            return;
        }

        const tokens = tokenize(text);
        const uniqueTerms = new Set(tokens.filter((t) => !STOPWORDS.has(t)));

        // Update document frequency for each unique term
        uniqueTerms.forEach((term) => {
            this.idfIndex.df.set(term, (this.idfIndex.df.get(term) || 0) + 1);
        });

        // Store document length
        this.idfIndex.docLengths.set(docId, tokens.length);

        // Update stats
        this.idfIndex.totalDocs++;
        this.updateAvgDocLength();
    }

    /**
     * Remove a document from the index
     */
    removeDocument(docId: string, text: string): void {
        if (!this.idfIndex.docLengths.has(docId)) {
            return; // Document not in index
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

    /**
     * Compute IDF for a term
     */
    private computeIDF(term: string): number {
        const df = this.idfIndex.df.get(term);
        if (!df || this.idfIndex.totalDocs === 0) return 0;

        // BM25 IDF: log((N - df + 0.5) / (df + 0.5) + 1)
        const N = this.idfIndex.totalDocs;
        return Math.log((N - df + 0.5) / (df + 0.5) + 1);
    }

    /**
     * Extract top-k terms from a query using TF-IDF
     * Useful for reformulating long queries into key terms
     */
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

    /**
     * Compute BM25 score for a single document against query terms
     */
    private computeBM25Score(docId: string, docText: string, queryTermFreqs: Map<string, number>): number {
        const docTokens = tokenize(docText).filter((t) => !STOPWORDS.has(t));
        const docLength = this.idfIndex.docLengths.get(docId) || docTokens.length;

        // Compute term frequencies in document
        const docTermFreqs = new Map<string, number>();
        docTokens.forEach((token) => {
            docTermFreqs.set(token, (docTermFreqs.get(token) || 0) + 1);
        });

        let score = 0;

        queryTermFreqs.forEach((_, queryTerm) => {
            const tf = docTermFreqs.get(queryTerm) || 0;
            if (tf === 0) return; // Term not in document

            const idf = this.computeIDF(queryTerm);

            // BM25 formula
            const numerator = tf * (this.k1 + 1);
            const denominator = tf + this.k1 * (1 - this.b + this.b * (docLength / this.idfIndex.avgDocLength));

            score += idf * (numerator / denominator);
        });

        return score;
    }

    /**
     * Rank candidate documents using BM25
     * 
     * @param queryText - The user's search query (can be a sentence or paragraph)
     * @param candidates - Documents to rank
     * @param topK - Number of results to return (undefined = all)
     * @param minScore - Minimum score threshold (default 0)
     */
    rankDocuments<T extends BM25Document>(
        queryText: string,
        candidates: T[],
        topK?: number,
        minScore: number = 0
    ): ScoredDocument<T>[] {
        const queryTokens = tokenize(queryText).filter((t) => !STOPWORDS.has(t));

        if (queryTokens.length === 0) {
            // No meaningful query terms - return all with score 0
            return candidates.map((doc) => ({ document: doc, score: 0 }));
        }

        // Compute query term frequencies
        const queryTermFreqs = new Map<string, number>();
        queryTokens.forEach((token) => {
            queryTermFreqs.set(token, (queryTermFreqs.get(token) || 0) + 1);
        });

        // Score all candidates
        const scored: ScoredDocument<T>[] = candidates
            .map((doc) => ({
                document: doc,
                score: this.computeBM25Score(doc.id, doc.text, queryTermFreqs),
            }))
            .filter((result) => result.score >= minScore);

        // Sort by score descending
        scored.sort((a, b) => b.score - a.score);

        // Return top-k if specified
        return topK ? scored.slice(0, topK) : scored;
    }

    /**
     * Check if a term exists in the index vocabulary
     */
    hasTermInVocabulary(term: string): boolean {
        return this.idfIndex.df.has(term.toLowerCase());
    }

    /**
     * Get terms from query that exist in the index
     */
    getMatchingTerms(queryText: string): string[] {
        const tokens = tokenize(queryText).filter((t) => !STOPWORDS.has(t));
        return tokens.filter((t) => this.idfIndex.df.has(t));
    }

    /**
     * Clear the entire index
     */
    clear(): void {
        this.idfIndex = {
            df: new Map(),
            totalDocs: 0,
            avgDocLength: 0,
            docLengths: new Map(),
        };
    }

    /**
     * Tune BM25 parameters
     */
    setBM25Params(k1: number, b: number): void {
        this.k1 = k1;
        this.b = b;
    }

    /**
     * Serialize the index for storage
     */
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

    /**
     * Deserialize the index from storage
     */
    static deserialize(data: string): BM25Index {
        const parsed = JSON.parse(data);
        const index = new BM25Index(parsed.k1, parsed.b);
        index.idfIndex.df = new Map(parsed.df);
        index.idfIndex.totalDocs = parsed.totalDocs;
        index.idfIndex.avgDocLength = parsed.avgDocLength;
        index.idfIndex.docLengths = new Map(parsed.docLengths);
        return index;
    }

    /**
     * Get index statistics
     */
    getStats() {
        return {
            totalDocs: this.idfIndex.totalDocs,
            vocabularySize: this.idfIndex.df.size,
            avgDocLength: Math.round(this.idfIndex.avgDocLength),
            bm25Params: { k1: this.k1, b: this.b },
        };
    }
}

