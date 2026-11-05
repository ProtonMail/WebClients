import type { Memory } from '../redux/slices/lumoUserSettings';

type DiffSegmentType = 'same' | 'removed' | 'added';

export interface DiffSegment {
    text: string;
    type: DiffSegmentType;
}

export interface MemoryChange {
    /** Memories that go away (several when entries are merged). Empty for a brand new memory. */
    before: Memory[];
    /** The replacement. Null when the memory is simply dropped. */
    after: Memory | null;
}

const SIMILARITY_THRESHOLD = 0.35;

const splitWords = (text: string) => text.trim().split(/\s+/).filter(Boolean);

/** Loose key used only to pair similar memories: ignores all surrounding punctuation. */
const wordKey = (word: string) => word.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');

/**
 * Key used to decide whether a diff token is unchanged. Only sentence punctuation is ignored,
 * so meaningful symbols survive ("C++" and "C#" must not collapse into "c").
 */
const diffKey = (word: string) => word.toLowerCase().replace(/^[.,;:!?"'()[\]]+|[.,;:!?"'()[\]]+$/g, '');

/** Word-level LCS diff of `from` against `to`. */
const lcsTable = (a: string[], b: string[]) => {
    const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
    for (let i = a.length - 1; i >= 0; i--) {
        for (let j = b.length - 1; j >= 0; j--) {
            table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
        }
    }
    return table;
};

const pushSegment = (segments: DiffSegment[], text: string, type: DiffSegmentType) => {
    const last = segments[segments.length - 1];
    if (last && last.type === type) {
        last.text += ` ${text}`;
    } else {
        segments.push({ text, type });
    }
};

/**
 * Returns the segments to render for the old and the new text: the old side marks removed words,
 * the new side marks added words.
 */
export const diffWords = (before: string, after: string): { before: DiffSegment[]; after: DiffSegment[] } => {
    const a = splitWords(before);
    const b = splitWords(after);
    const keysA = a.map(diffKey);
    const keysB = b.map(diffKey);
    const table = lcsTable(keysA, keysB);

    const beforeSegments: DiffSegment[] = [];
    const afterSegments: DiffSegment[] = [];
    let i = 0;
    let j = 0;

    while (i < a.length && j < b.length) {
        if (keysA[i] === keysB[j]) {
            pushSegment(beforeSegments, a[i], 'same');
            pushSegment(afterSegments, b[j], 'same');
            i++;
            j++;
        } else if (table[i + 1][j] >= table[i][j + 1]) {
            pushSegment(beforeSegments, a[i++], 'removed');
        } else {
            pushSegment(afterSegments, b[j++], 'added');
        }
    }
    while (i < a.length) {
        pushSegment(beforeSegments, a[i++], 'removed');
    }
    while (j < b.length) {
        pushSegment(afterSegments, b[j++], 'added');
    }

    return { before: beforeSegments, after: afterSegments };
};

const similarity = (a: string, b: string) => {
    const wordsA = new Set(splitWords(a).map(wordKey).filter(Boolean));
    const wordsB = new Set(splitWords(b).map(wordKey).filter(Boolean));
    if (wordsA.size === 0 || wordsB.size === 0) {
        return 0;
    }
    let shared = 0;
    wordsA.forEach((word) => {
        if (wordsB.has(word)) {
            shared++;
        }
    });
    return shared / (wordsA.size + wordsB.size - shared);
};

/**
 * Pairs each removed memory with the added memory it most resembles, so rewordings and merges
 * read as one change instead of an unrelated removal and addition.
 */
export const groupMemoryChanges = (removed: Memory[], added: Memory[]): MemoryChange[] => {
    const beforeByAfter = new Map<string, Memory[]>();
    const dropped: Memory[] = [];

    for (const memory of removed) {
        let best: Memory | null = null;
        let bestScore = 0;
        for (const candidate of added) {
            const score = similarity(memory.content, candidate.content);
            if (score > bestScore) {
                best = candidate;
                bestScore = score;
            }
        }
        if (best && bestScore >= SIMILARITY_THRESHOLD) {
            beforeByAfter.set(best.id, [...(beforeByAfter.get(best.id) ?? []), memory]);
        } else {
            dropped.push(memory);
        }
    }

    return [
        ...added
            .filter((memory) => beforeByAfter.has(memory.id))
            .map((after) => ({ before: beforeByAfter.get(after.id) ?? [], after })),
        ...dropped.map((before) => ({ before: [before], after: null })),
        ...added.filter((memory) => !beforeByAfter.has(memory.id)).map((after) => ({ before: [], after })),
    ];
};
