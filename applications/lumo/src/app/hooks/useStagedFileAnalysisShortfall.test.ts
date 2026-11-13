import { countAnalysisCalls } from '../features/client-tools/retrievalTool/fileAnalysis';
import { PAGE_CHARS, splitIntoPages } from '../features/client-tools/retrievalTool/pages';
import type { Attachment } from '../types';
import { findStagedFileAnalysisShortfall } from './useStagedFileAnalysisShortfall';

const filler = (n: number) => {
    return `PAGE-${n} ${'x '.repeat(PAGE_CHARS / 2 - 12)}`;
};
const pdf = (id: string, pages: number, overrides: Partial<Attachment> = {}) => {
    return {
        id,
        filename: `${id}.pdf`,
        markdown: Array.from({ length: pages }, (_, i) => filler(i + 1)).join('\n'),
        tokenCount: 90_000,
        uploadedAt: new Date().toISOString(),
        mimeType: 'application/pdf',
        ...overrides,
    } as Attachment;
};
const callsFor = (file: Attachment) => {
    return countAnalysisCalls(splitIntoPages(file.markdown!).length);
};

const run = (
    stagedAttachments: Attachment[],
    overrides: Partial<Parameters<typeof findStagedFileAnalysisShortfall>[0]> = {}
) => {
    return findStagedFileAnalysisShortfall({
        stagedAttachments,
        retrievalTools: true,
        hasLumoPlus: false,
        modelTier: 'lumo-max',
        limits: { lite: 3, max: 10 },
        ...overrides,
    });
};

describe('findStagedFileAnalysisShortfall', () => {
    it('reports a staged large file that needs more Lite questions than are left', () => {
        const report = pdf('report', 12);
        const needed = callsFor(report);
        expect(needed).toBeGreaterThan(3);

        expect(run([report])).toEqual({ fileNames: ['report.pdf'], needed, remaining: 3 });
    });

    it('adds the reply when it is sent on a Lite-pool model', () => {
        const report = pdf('report', 12);

        expect(run([report], { modelTier: 'lumo-lite', limits: { lite: callsFor(report), max: 10 } })?.needed).toBe(
            callsFor(report) + 1
        );
        expect(run([report], { modelTier: 'lumo-max', limits: { lite: callsFor(report), max: 10 } })).toBeUndefined();
    });

    it('ignores small files and files still being processed', () => {
        const small = pdf('memo', 1, { tokenCount: 300, markdown: 'short' });
        const processing = pdf('later', 12, { markdown: undefined, processing: true });

        expect(run([small, processing])).toBeUndefined();
    });

    it('counts only the files a send would read', () => {
        const files = [pdf('a', 12), pdf('b', 12), pdf('c', 12)];

        expect(run(files, { limits: { lite: 0, max: 10 } })).toEqual({
            fileNames: ['a.pdf', 'b.pdf'],
            needed: callsFor(files[0]!) + callsFor(files[1]!),
            remaining: 0,
        });
    });

    it('never holds the send for Lumo Plus, or when the limits are not known', () => {
        const report = pdf('report', 12);

        expect(run([report], { hasLumoPlus: true })).toBeUndefined();
        expect(run([report], { limits: null })).toBeUndefined();
    });

    it('never holds the send without the retrieval tools, since the send then reads nothing through', () => {
        expect(run([pdf('report', 12)], { retrievalTools: false })).toBeUndefined();
    });
});
