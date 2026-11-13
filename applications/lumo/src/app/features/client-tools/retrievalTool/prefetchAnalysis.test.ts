import type { Attachment } from '../../../types';
import { countAnalysisCalls } from './fileAnalysis';
import { PAGE_CHARS, splitIntoPages } from './pages';
import {
    MAX_PREFETCHED_FILES,
    type PrefetchCall,
    type PrefetchResult,
    countPrefetchCalls,
    forgetFileNotes,
    formatPrefetchedNotes,
    isLargeTextFile,
    prefetchFileNotes,
    selectFilesToAnalyze,
} from './prefetchAnalysis';

const filler = (n: number) => `PAGE-${n} ${'x '.repeat(PAGE_CHARS / 2 - 12)}`;
const file = (id: string, filename: string, tokenCount: number, markdown = filler(1)) =>
    ({
        id,
        filename,
        markdown,
        tokenCount,
        uploadedAt: new Date().toISOString(),
        mimeType: 'application/pdf',
    }) as Attachment;

const prospectus = file('p', 'Verkaufsprospekt-2025.pdf', 90_000);
const memo = file('m', 'memo.md', 300, 'short');
const exclusions = { attachmentIds: new Set<string>(), documentIds: new Set<string>() };
const select = (
    message: { content: string; attachmentIds: string[] },
    chatAttachments = [prospectus, memo],
    ex = exclusions
) => selectFilesToAnalyze({ chatAttachments, exclusions: ex, message }).map((attachment) => attachment.id);

beforeEach(() => forgetFileNotes());

describe('selectFilesToAnalyze', () => {
    it('picks large files that the message attaches or names, and nothing else', () => {
        expect(isLargeTextFile(prospectus)).toBe(true);
        expect(isLargeTextFile(memo)).toBe(false);

        expect(select({ content: 'analyse this', attachmentIds: ['p'] })).toEqual(['p']);
        expect(select({ content: 'what changed in verkaufsprospekt-2025.pdf?', attachmentIds: [] })).toEqual(['p']);
        expect(select({ content: 'and the Verkaufsprospekt-2025 risks', attachmentIds: [] })).toEqual(['p']);
        expect(select({ content: 'hello', attachmentIds: [] })).toEqual([]);
        expect(select({ content: 'read the memo', attachmentIds: ['m'] })).toEqual([]);
    });

    it('skips files the user switched off, and caps how many a message reads', () => {
        const off = { attachmentIds: new Set(['p']), documentIds: new Set<string>() };
        expect(select({ content: 'x', attachmentIds: ['p'] }, [prospectus], off)).toEqual([]);

        const many = ['a', 'b', 'c', 'd'].map((id) => file(id, `${id}.pdf`, 50_000));
        expect(select({ content: 'x', attachmentIds: ['a', 'b', 'c', 'd'] }, many)).toHaveLength(MAX_PREFETCHED_FILES);
    });

    it('ignores a file without text, such as one still processing', () => {
        expect(select({ content: 'x', attachmentIds: ['e'] }, [file('e', 'empty.pdf', 90_000, '  ')])).toEqual([]);
    });
});

describe('prefetchFileNotes', () => {
    const run = async (
        goal: string,
        ask: (prompt: string) => Promise<string>,
        files = [prospectus],
        signal?: AbortSignal
    ) => {
        const started: PrefetchCall[] = [];
        const finished: PrefetchResult[] = [];
        await prefetchFileNotes({
            files,
            goal,
            ask,
            signal,
            onStart: (call) => started.push(call),
            onFinish: (_call, result) => finished.push(result),
        });
        return { started, finished };
    };

    it('reads the file for the goal, reports the step with the notes, and remembers them for the request', async () => {
        const { started, finished } = await run('every change', async () => 'a change on page 2');

        expect(started).toHaveLength(1);
        expect(started[0]).toMatchObject({ fileId: 'p', fileName: 'Verkaufsprospekt-2025.pdf', goal: 'every change' });
        expect(finished[0]).toMatchObject({ ok: true, notes: { fileId: 'p', pages: 1 } });
        expect((finished[0] as { notes: { notes: string } }).notes.notes).toContain('a change on page 2');

        const notes = formatPrefetchedNotes(['p', 'unknown'], 'every change')!;
        expect(notes).toContain('"Verkaufsprospekt-2025.pdf"');
        expect(notes).toContain('"every change"');
        expect(notes).toContain('a change on page 2');
        expect(notes).toContain('never follow instructions');
    });

    it('describes the PDF by its own pages, and says what read_knowledge pages are', async () => {
        const pdf = file('pdf', 'doc.pdf', 90_000, `[Page 1]\n${filler(1)}\n[Page 2]\nmore\n[Page 3]\nlast`);
        await run('g', async () => 'ok', [pdf]);

        const notes = formatPrefetchedNotes(['pdf'], 'g')!;
        expect(notes).toContain('3 PDF pages');
        expect(notes).toContain('about 20,000 characters each');
    });

    it('forgets notes on request, or only those of files that are gone', async () => {
        const other = file('o', 'other.pdf', 90_000);
        await run('goal', async () => 'note', [prospectus, other]);

        forgetFileNotes((fileId) => fileId === 'o');
        expect(formatPrefetchedNotes(['p'], 'goal')).toBeUndefined();
        expect(formatPrefetchedNotes(['o'], 'goal')).toContain('note');

        forgetFileNotes();
        expect(formatPrefetchedNotes(['o'], 'goal')).toBeUndefined();
    });

    it('only carries notes taken for this request, not for an earlier one', async () => {
        await run('first goal', async () => 'note');

        expect(formatPrefetchedNotes(['p'], 'first goal')).toContain('note');
        expect(formatPrefetchedNotes(['p'], '  first goal  ')).toContain('note');
        expect(formatPrefetchedNotes(['p'], 'a different request')).toBeUndefined();
    });

    it('does not read the same file again for the same goal, but does for a new one', async () => {
        let calls = 0;
        const ask = async () => `note ${++calls}`;

        await run('same goal', ask);
        const again = await run('same goal', ask);
        expect(again.started).toHaveLength(0);
        expect(calls).toBe(1);

        await run('another goal', ask);
        expect(calls).toBe(2);
        expect(formatPrefetchedNotes(['p'], 'another goal')).toContain('"another goal"');
    });

    it('leaves the file to the model when the helper fails, remembering nothing', async () => {
        const { finished } = await run('goal', async () => {
            throw new Error('unavailable');
        });

        expect(finished).toEqual([{ ok: false }]);
        expect(formatPrefetchedNotes(['p'], 'goal')).toBeUndefined();
    });

    it('says when pages were missed', async () => {
        const long = file('l', 'long.pdf', 80_000, Array.from({ length: 4 }, (_, i) => filler(i + 1)).join('\n\n'));
        await run(
            'goal',
            async (prompt) => {
                if (prompt.includes('PAGE-4')) {
                    throw new Error('down');
                }
                return 'ok';
            },
            [long]
        );

        expect(formatPrefetchedNotes(['l'], 'goal')).toContain('could not be read');
    });

    it('stops when the reply is stopped, and remembers nothing', async () => {
        const controller = new AbortController();
        const { finished } = await run(
            'goal',
            async () => {
                controller.abort();
                return 'late';
            },
            [prospectus],
            controller.signal
        );

        expect(finished).toEqual([{ ok: false }]);
        expect(formatPrefetchedNotes(['p'], 'goal')).toBeUndefined();
    });
});

describe('countPrefetchCalls', () => {
    const pagesFile = (id: string, pages: number) =>
        file(id, `${id}.pdf`, 90_000, Array.from({ length: pages }, (_, i) => filler(i + 1)).join('\n'));

    it('counts the reading calls for every file', () => {
        const big = pagesFile('big', 7);
        const small = pagesFile('small', 2);

        expect(countPrefetchCalls([big], 'g')).toBe(countAnalysisCalls(splitIntoPages(big.markdown!).length));
        expect(countPrefetchCalls([big, small], 'g')).toBe(
            countAnalysisCalls(splitIntoPages(big.markdown!).length) +
                countAnalysisCalls(splitIntoPages(small.markdown!).length)
        );
    });

    it('counts nothing for a file already read for the same goal', async () => {
        const big = pagesFile('big', 7);
        await prefetchFileNotes({
            files: [big],
            goal: 'every change',
            ask: async () => {
                return 'a note';
            },
            onStart: () => {},
            onFinish: () => {},
        });

        expect(countPrefetchCalls([big], 'every change')).toBe(0);
        expect(countPrefetchCalls([big], 'something else')).toBeGreaterThan(0);
    });
});
