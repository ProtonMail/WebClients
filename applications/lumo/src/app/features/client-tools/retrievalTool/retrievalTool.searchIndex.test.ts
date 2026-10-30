import type { ClientToolExecutor } from '@proton/lumo-api-client/core/client-tools';

import { SearchService } from '../../../services/search/searchService';
import { CASES, CORPUS, OTHER_SPACE, PROJECT_SPACE, toDriveDocuments } from './__fixtures__/retrievalCorpus';
import { type RetrievalContext, createRetrievalToolExecutor } from './retrievalTool';
import { READ_KNOWLEDGE_TOOL_NAME, SEARCH_KNOWLEDGE_TOOL_NAME } from './schema';

/*
 * The retrieval tools against the real search index (in memory: no user id, so nothing is
 * persisted), rather than a stand-in: real chunking, ranking, folder paths and space filters.
 */

const index = SearchService.get();

beforeAll(async () => {
    await index.clearDriveDocuments();
    await index.indexDocuments(toDriveDocuments());
});

afterAll(() => index.clearDriveDocuments());

const executorFor = (overrides: Partial<RetrievalContext> = {}) =>
    createRetrievalToolExecutor({
        conversationId: 'conversation',
        spaceId: PROJECT_SPACE,
        isProject: true,
        allowWideScopes: true,
        chatSearch: 'none',
        searchOtherSpaces: false,
        hasLumoPlus: true,
        getVisibleMessageIds: () => new Set(),
        chatAttachments: [],
        getState: () => ({ conversations: {}, messages: {} }),
        index,
        ...overrides,
    });

async function call(executor: ClientToolExecutor, name: string, args: unknown) {
    const [result] = await executor.execute([{ id: 'call', name, arguments: JSON.stringify(args) }]);
    return { isError: !!result!.is_error, body: JSON.parse(result!.content) };
}

const fileIds = (body: { results: { file_id: string }[] }) => body.results.map((result) => result.file_id);

const projectFileIds = new Set(CORPUS.filter((file) => !file.spaceId).map((file) => file.id));

describe('search_knowledge on the real index', () => {
    it('chunks the large handbook in the index', async () => {
        const handbookChunks = (await index.getDriveDocuments()).filter((doc) => doc.parentDocumentId === 'handbook');

        expect(handbookChunks.length).toBeGreaterThan(1);
    });

    it.each(CASES.map((testCase) => [testCase.query, testCase] as const))(
        'never returns another project\'s files in project scope ("%s")',
        async (_query, { query }) => {
            const { body } = await call(executorFor(), SEARCH_KNOWLEDGE_TOOL_NAME, { query, limit: 10 });

            fileIds(body).forEach((id) => expect(projectFileIds).toContain(id));
        }
    );

    it('finds the other project\'s files only with scope "all", when that is turned on', async () => {
        const executor = executorFor({ searchOtherSpaces: true });
        const project = await call(executor, SEARCH_KNOWLEDGE_TOOL_NAME, { query: 'Initech payment', limit: 10 });
        const all = await call(executor, SEARCH_KNOWLEDGE_TOOL_NAME, {
            query: 'Initech payment',
            scope: 'all',
            limit: 10,
        });

        expect(fileIds(project.body)).not.toContain('other-contracts');
        expect(fileIds(all.body)[0]).toBe('other-contracts');
    });

    it('points at the page of a large file that holds the answer', async () => {
        const executor = executorFor();
        const { body } = await call(executor, SEARCH_KNOWLEDGE_TOOL_NAME, { query: 'parental leave weeks' });
        const hit = body.results[0];

        expect(hit).toMatchObject({ file_id: 'handbook' });
        expect(hit.pages).toBeGreaterThan(1);
        expect(hit.page).toBeGreaterThan(1);

        const page = await call(executor, READ_KNOWLEDGE_TOOL_NAME, { file_id: 'handbook', page: hit.page });
        expect(page.body.content).toContain('Parental leave is 16 weeks');
    });

    it('restricts a search to the given files', async () => {
        const { body } = await call(executorFor({ searchOtherSpaces: true }), SEARCH_KNOWLEDGE_TOOL_NAME, {
            query: 'payment renewal',
            file_ids: ['other-contracts'],
            scope: 'all',
        });

        expect(fileIds(body)).toEqual(['other-contracts']);
    });
});

describe('files of other projects, when searching them is off', () => {
    it('rejects scope "all", in a project and outside one', async () => {
        for (const isProject of [true, false]) {
            const { isError, body } = await call(executorFor({ isProject }), SEARCH_KNOWLEDGE_TOOL_NAME, {
                query: 'Initech payment',
                scope: 'all',
            });

            expect(isError).toBe(true);
            expect(body.error).toContain('turned off');
        }
    });

    it('cannot read them by id or by name', async () => {
        const executor = executorFor();

        expect((await call(executor, READ_KNOWLEDGE_TOOL_NAME, { file_id: 'other-contracts' })).isError).toBe(true);
        const byName = await call(executor, READ_KNOWLEDGE_TOOL_NAME, { file_name: 'Initech partnership.md' });
        expect(byName.isError).toBe(true);
        expect(JSON.stringify(byName.body)).not.toContain('other-partnership');

        const allowed = executorFor({ searchOtherSpaces: true });
        expect(
            (await call(allowed, READ_KNOWLEDGE_TOOL_NAME, { file_name: 'Initech partnership.md' })).body
        ).toMatchObject({ ok: true, file_id: 'other-partnership' });
    });

    it('never lists them as mentioned files', async () => {
        const { body } = await call(executorFor(), READ_KNOWLEDGE_TOOL_NAME, { file_id: 'readme' });

        expect(JSON.stringify(body)).not.toContain('other-');
    });
});

describe('read_knowledge on the real index', () => {
    it('lists the files a manifest mentions, with ids, and nothing it only uses as a word', async () => {
        const { body } = await call(executorFor(), READ_KNOWLEDGE_TOOL_NAME, { file_id: 'vendor-index' });
        const mentioned = body.mentioned_files.map((file: { file_id: string }) => file.file_id);

        expect(mentioned.sort()).toEqual(['contracts', 'onboarding', 'pricing']);
    });

    it('resolves names with folders, case and missing extensions, nearest space first', async () => {
        const executor = executorFor();
        const read = async (file_name: string) =>
            (await call(executor, READ_KNOWLEDGE_TOOL_NAME, { file_name })).body as {
                file_id?: string;
                matches?: unknown[];
            };

        expect((await read('Supplier contracts 2026.pdf')).file_id).toBe('contracts');
        expect((await read('Finance/Q3 Budget_final.xlsx')).file_id).toBe('budget');
        expect((await read('Archive/q3 budget final')).file_id).toBe('budget-old');
        expect((await read('q3 budget final')).matches).toHaveLength(2);
        expect((await read('pricing sheet v2')).file_id).toBe('pricing');
    });

    it('rebuilds a chunked file exactly, without repeating the overlap between chunks', async () => {
        const original = CORPUS.find((file) => file.id === 'handbook')!.content;
        const rebuilt = (await index.getIndexedDocument('handbook'))!.text;
        const words = (text: string) => text.split(/\s+/).filter(Boolean).join(' ');

        expect(words(rebuilt)).toBe(words(original));
    });

    it('cannot reach the index from a ghost chat', async () => {
        const ghost = executorFor({ allowWideScopes: false, index: undefined, isProject: false });

        expect((await call(ghost, READ_KNOWLEDGE_TOOL_NAME, { file_id: 'contracts' })).isError).toBe(true);
        expect((await call(ghost, READ_KNOWLEDGE_TOOL_NAME, { file_name: 'Travel policy' })).isError).toBe(true);
    });
});

it('keeps the other project out of an unscoped name lookup when the current space has a match', async () => {
    const { body } = await call(executorFor({ spaceId: OTHER_SPACE }), READ_KNOWLEDGE_TOOL_NAME, {
        file_name: 'Travel policy.md',
    });

    expect(body.file_id).toBe('other-travel');
});
