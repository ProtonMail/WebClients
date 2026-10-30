import type { ClientToolResult } from '@proton/lumo-api-client/core/client-tools';

import { type Attachment, type Conversation, type Message, Role } from '../../../types';
import { formatFileCard, formatRetrievalInstructions } from './instructions';
import { PAGE_CHARS, splitIntoPages } from './pages';
import {
    MAX_READS_PER_REPLY,
    MAX_RETRIEVAL_CALLS_PER_REPLY,
    type RetrievalContext,
    type RetrievalIndex,
    createRetrievalToolExecutor,
} from './retrievalTool';
import { READ_KNOWLEDGE_TOOL_NAME, SEARCH_KNOWLEDGE_TOOL_NAME } from './schema';

const now = new Date().toISOString();

const conversation = (id: string, overrides: Partial<Conversation> = {}): Conversation =>
    ({ id, spaceId: 'space', title: `Chat ${id}`, createdAt: now, updatedAt: now, ...overrides }) as Conversation;

const message = (id: string, conversationId: string, content: string, role = Role.User): Message => ({
    id,
    conversationId,
    role,
    createdAt: now,
    blocks: [{ type: 'text', content }],
});

const attachment = (id: string, filename: string, markdown: string): Attachment =>
    ({ id, filename, markdown, uploadedAt: now, mimeType: 'text/markdown' }) as Attachment;

const report = attachment('report', 'report.md', '# Budget\nThe marketing budget for 2027 is 40,000 euros.');

function makeContext(overrides: Partial<RetrievalContext> = {}): RetrievalContext {
    const conversations = {
        current: conversation('current'),
        other: conversation('other', { spaceId: 'elsewhere' }),
        ghost: conversation('ghost', { ghost: true }),
    };
    const messages = {
        visible: message('visible', 'current', 'The marketing budget question I am asking now'),
        earlier: message('earlier', 'current', 'We agreed the launch slips to March', Role.Assistant),
        otherChat: message('otherChat', 'other', 'Supplier invoice for the marketing budget'),
        ghostChat: message('ghostChat', 'ghost', 'Secret marketing budget notes'),
    };
    return {
        conversationId: 'current',
        spaceId: 'space',
        isProject: false,
        allowWideScopes: true,
        chatSearch: 'all',
        searchOtherSpaces: true,
        hasLumoPlus: true,
        getVisibleMessageIds: () => new Set(['visible']),
        chatAttachments: [report],
        getState: () => ({ conversations, messages }) as unknown as ReturnType<RetrievalContext['getState']>,
        ...overrides,
    };
}

async function call(
    context: RetrievalContext | ReturnType<typeof createRetrievalToolExecutor>,
    name: string,
    args: unknown
) {
    const executor = 'execute' in context ? context : createRetrievalToolExecutor(context);
    const [result] = await executor.execute([{ id: 'call', name, arguments: JSON.stringify(args) }]);
    return { result: result as ClientToolResult, body: JSON.parse((result as ClientToolResult).content) };
}

describe('search_knowledge', () => {
    it("searches this chat's files and earlier messages, skipping what the request already carries", async () => {
        const { body } = await call(makeContext(), SEARCH_KNOWLEDGE_TOOL_NAME, { query: 'marketing budget' });

        expect(body.ok).toBe(true);
        expect(body.scope).toBe('this_chat');
        expect(body.results).toEqual([
            expect.objectContaining({ type: 'file', file_id: 'report', file_name: 'report.md', page: 1, pages: 1 }),
        ]);
    });

    it('finds messages of earlier chats with scope "all", never ghost chats', async () => {
        const { body } = await call(makeContext(), SEARCH_KNOWLEDGE_TOOL_NAME, {
            query: 'marketing budget',
            scope: 'all',
            sources: ['messages'],
        });

        expect(body.results.map((result: { message_id: string }) => result.message_id)).toEqual(['otherChat']);
        expect(body.results[0]).toMatchObject({ chat_title: 'Chat other', in_this_chat: false });
    });

    describe('with conversation search off', () => {
        const off = () => makeContext({ chatSearch: 'none' });

        it("still finds this chat's earlier messages", async () => {
            const { body } = await call(off(), SEARCH_KNOWLEDGE_TOOL_NAME, {
                query: 'launch March',
                sources: ['messages'],
            });

            expect(body.results.map((result: { message_id: string }) => result.message_id)).toEqual(['earlier']);
        });

        it('never searches or reads other chats, whatever the scope', async () => {
            const { body } = await call(off(), SEARCH_KNOWLEDGE_TOOL_NAME, {
                query: 'supplier invoice marketing budget',
                scope: 'all',
                sources: ['messages'],
            });
            const read = await call(off(), READ_KNOWLEDGE_TOOL_NAME, { message_id: 'otherChat' });

            expect(body.results).toEqual([]);
            expect(read.result.is_error).toBe(true);
        });

        it('keeps file search across scopes', async () => {
            const { body } = await call(off(), SEARCH_KNOWLEDGE_TOOL_NAME, { query: 'marketing budget', scope: 'all' });

            expect(body.results.map((result: { file_id?: string }) => result.file_id)).toEqual(['report']);
        });

        it('tells the model other chats are not searchable', () => {
            const instructions = formatRetrievalInstructions({
                isProject: true,
                allowWideScopes: true,
                chatSearch: 'none',
                searchOtherSpaces: false,
                projectFiles: [],
            });

            expect(instructions).toContain('"project" (all files of this project)');
            expect(instructions).not.toContain('"all"');
            expect(instructions).toContain("Other chats can't be searched");
            expect(instructions).toContain("Files outside this project can't be searched");
        });
    });

    describe("with search limited to this project's chats", () => {
        const projectOnly = () => {
            const conversations = {
                current: conversation('current'),
                sibling: conversation('sibling'),
                other: conversation('other', { spaceId: 'elsewhere' }),
            };
            const messages = {
                siblingChat: message('siblingChat', 'sibling', 'Marketing budget agreed at the project kickoff'),
                otherChat: message('otherChat', 'other', 'Supplier invoice for the marketing budget'),
            };
            return makeContext({
                isProject: true,
                chatSearch: 'project',
                searchOtherSpaces: false,
                getState: () => ({ conversations, messages }) as unknown as ReturnType<RetrievalContext['getState']>,
            });
        };
        const messageIds = (body: { results: { message_id?: string }[] }) =>
            body.results.map((result) => result.message_id).filter(Boolean);

        it("finds the project's other chats but not chats elsewhere, whatever the scope", async () => {
            const project = await call(projectOnly(), SEARCH_KNOWLEDGE_TOOL_NAME, {
                query: 'marketing budget',
                scope: 'project',
                sources: ['messages'],
            });

            expect(messageIds(project.body)).toEqual(['siblingChat']);
            expect((await call(projectOnly(), READ_KNOWLEDGE_TOOL_NAME, { message_id: 'siblingChat' })).body.ok).toBe(
                true
            );
            expect(
                (await call(projectOnly(), READ_KNOWLEDGE_TOOL_NAME, { message_id: 'otherChat' })).result.is_error
            ).toBe(true);
        });

        it('rejects scope "all" when nothing outside the project is searchable', async () => {
            const { result, body } = await call(projectOnly(), SEARCH_KNOWLEDGE_TOOL_NAME, {
                query: 'marketing budget',
                scope: 'all',
            });

            expect(result.is_error).toBe(true);
            expect(body.error).toContain('outside this project is turned off');
        });

        it('keeps "all" to the project\'s chats when only other projects\' files are allowed', async () => {
            const { body } = await call({ ...projectOnly(), searchOtherSpaces: true }, SEARCH_KNOWLEDGE_TOOL_NAME, {
                query: 'marketing budget',
                scope: 'all',
                sources: ['messages'],
            });

            expect(messageIds(body)).toEqual(['siblingChat']);
        });

        it("tells the model only the project's chats can be searched", () => {
            const instructions = formatRetrievalInstructions({
                isProject: true,
                allowWideScopes: true,
                chatSearch: 'project',
                searchOtherSpaces: false,
                projectFiles: [],
            });

            expect(instructions).toContain('"project" (all files and chats of this project)');
            expect(instructions).not.toContain('"all"');
            expect(instructions).toContain("Only this project's chats can be searched");
        });
    });

    it('reads which messages the request carries at call time, not when the tools were set up', async () => {
        const visible = new Set(['visible', 'earlier']);
        const executor = createRetrievalToolExecutor(makeContext({ getVisibleMessageIds: () => visible }));
        const search = async () =>
            (await call(executor, SEARCH_KNOWLEDGE_TOOL_NAME, { query: 'launch March', sources: ['messages'] })).body
                .results;

        expect(await search()).toEqual([]);
        visible.delete('earlier');
        expect(await search()).toEqual([expect.objectContaining({ message_id: 'earlier' })]);
    });

    it('only allows this chat in ghost chats and for guests', async () => {
        const { result, body } = await call(makeContext({ allowWideScopes: false }), SEARCH_KNOWLEDGE_TOOL_NAME, {
            query: 'budget',
            scope: 'all',
        });

        expect(result.is_error).toBe(true);
        expect(body.error).toContain('this_chat');
    });

    it('refuses the project scope outside a project', async () => {
        const { result } = await call(makeContext(), SEARCH_KNOWLEDGE_TOOL_NAME, { query: 'budget', scope: 'project' });

        expect(result.is_error).toBe(true);
    });

    it('rejects malformed arguments', async () => {
        const executor = createRetrievalToolExecutor(makeContext());
        for (const args of [
            {},
            { query: 'x', sources: ['web'] },
            { query: 'x', limit: 50 },
            { query: 'x', file_ids: [] },
        ]) {
            const { result } = await call(executor, SEARCH_KNOWLEDGE_TOOL_NAME, args);
            expect(result.is_error).toBe(true);
        }
    });

    it('ranks pages of indexed project files, scoped to the project', async () => {
        const index: RetrievalIndex = {
            rankDocumentsInScope: jest.fn(async () => [
                { id: 'drive-1', name: 'plan.pdf', content: '', score: 1, coverage: 1 },
            ]),
            getIndexedDocument: jest.fn(async (id: string) => ({
                id,
                name: 'plan.pdf',
                spaceId: 'space',
                text: 'Hiring plan: two engineers join in April.',
            })),
            listDocuments: jest.fn(async () => []),
        };
        const { body } = await call(
            makeContext({ isProject: true, index, chatAttachments: [] }),
            SEARCH_KNOWLEDGE_TOOL_NAME,
            { query: 'hiring engineers', sources: ['files'] }
        );

        expect(index.rankDocumentsInScope).toHaveBeenCalledWith(
            'hiring engineers',
            { spaceId: 'space', documentIds: undefined },
            expect.any(Number)
        );
        expect(body.scope).toBe('project');
        expect(body.results[0]).toMatchObject({ file_id: 'drive-1', file_name: 'plan.pdf' });
    });
});

describe('read_knowledge', () => {
    it('reads a page of a chat file', async () => {
        const { body } = await call(makeContext(), READ_KNOWLEDGE_TOOL_NAME, { file_id: 'report' });

        expect(body).toMatchObject({ ok: true, file_name: 'report.md', page: 1, pages: 1 });
        expect(body.content).toContain('40,000 euros');
    });

    it('refuses files and messages outside what this chat may see', async () => {
        const narrow = makeContext({ allowWideScopes: false });
        for (const args of [{ file_id: 'unknown' }, { message_id: 'otherChat' }, { message_id: 'ghostChat' }]) {
            const { result } = await call(narrow, READ_KNOWLEDGE_TOOL_NAME, args);
            expect(result.is_error).toBe(true);
        }
        const { result } = await call(makeContext(), READ_KNOWLEDGE_TOOL_NAME, { message_id: 'ghostChat' });
        expect(result.is_error).toBe(true);
    });

    it('reads a message of another chat when wide scopes are allowed', async () => {
        const { body } = await call(makeContext(), READ_KNOWLEDGE_TOOL_NAME, { message_id: 'otherChat' });

        expect(body).toMatchObject({
            ok: true,
            message_id: 'otherChat',
            content: 'Supplier invoice for the marketing budget',
        });
    });

    it('rejects a page past the end and ambiguous ids', async () => {
        const executor = createRetrievalToolExecutor(makeContext());
        for (const args of [
            { file_id: 'report', page: 2 },
            { file_id: 'report', message_id: 'earlier' },
            { page: 0 },
        ]) {
            const { result } = await call(executor, READ_KNOWLEDGE_TOOL_NAME, args);
            expect(result.is_error).toBe(true);
        }
    });
});

type IndexedDoc = { id: string; name: string; spaceId: string; folderPath?: string; text: string };

/** Ranks documents by how many query words their name or text contains, like a tiny search index. */
function memoryIndex(docs: IndexedDoc[]): RetrievalIndex {
    const words = (text: string) =>
        text
            .toLowerCase()
            .split(/\W+/)
            .filter((word) => word.length > 2);
    return {
        rankDocumentsInScope: async (query, scope = {}) =>
            docs
                .filter((doc) => !scope.spaceId || doc.spaceId === scope.spaceId)
                .map((doc) => ({
                    doc,
                    score: words(query).filter((word) => words(`${doc.name} ${doc.text}`).includes(word)).length,
                }))
                .filter(({ score }) => score > 0)
                .sort((a, b) => b.score - a.score)
                .map(({ doc, score }) => ({ id: doc.id, name: doc.name, content: doc.text, score, coverage: 1 })),
        getIndexedDocument: async (id) => docs.find((doc) => doc.id === id),
        listDocuments: async (scope = {}) =>
            docs
                .filter((doc) => !scope.spaceId || doc.spaceId === scope.spaceId)
                .map(({ id, name, folderPath }) => ({ id, name, folderPath })),
    };
}

describe('following references between files', () => {
    const docs: IndexedDoc[] = [
        {
            id: 'manifest',
            name: 'Vendor index.md',
            spaceId: 'space',
            text: 'Vendor index. The signed terms for every supplier are in "Supplier contracts 2026.pdf"; prices are in pricing_sheet.xlsx.',
        },
        {
            id: 'contracts',
            name: 'Supplier contracts 2026.pdf',
            spaceId: 'space',
            folderPath: 'Drive/Legal',
            text: 'Acme Ltd: net 60 payment terms, renewal on 1 March.',
        },
        { id: 'pricing', name: 'pricing_sheet.xlsx', spaceId: 'space', text: 'Widgets: 4 euros each.' },
        { id: 'draft', name: 'Supplier contracts draft.docx', spaceId: 'space', text: 'Unsigned draft.' },
        { id: 'elsewhere', name: 'Supplier contracts 2025.pdf', spaceId: 'other', text: 'Old terms.' },
    ];
    const projectContext = () => makeContext({ isProject: true, chatAttachments: [], index: memoryIndex(docs) });

    it('finds the manifest, lists the files it mentions, and reads the one the question needs by name', async () => {
        const executor = createRetrievalToolExecutor(projectContext());

        const search = await call(executor, SEARCH_KNOWLEDGE_TOOL_NAME, { query: 'vendor overview' });
        expect(search.body.results.map((result: { file_id: string }) => result.file_id)).toEqual(['manifest']);

        const manifest = await call(executor, READ_KNOWLEDGE_TOOL_NAME, { file_id: 'manifest' });
        expect(manifest.body.mentioned_files).toEqual([
            { file_id: 'contracts', file_name: 'Supplier contracts 2026.pdf', folder: 'Drive/Legal' },
            { file_id: 'pricing', file_name: 'pricing_sheet.xlsx' },
        ]);

        const contracts = await call(executor, READ_KNOWLEDGE_TOOL_NAME, { file_name: 'supplier contracts 2026' });
        expect(contracts.body).toMatchObject({
            ok: true,
            file_id: 'contracts',
            content: expect.stringContaining('net 60'),
        });
    });

    it('resolves names by path, case and missing extension, preferring the current space', async () => {
        const executor = createRetrievalToolExecutor(projectContext());

        for (const fileName of ['Legal/Supplier contracts 2026.pdf', 'SUPPLIER_CONTRACTS_2026', 'pricing sheet']) {
            const { body } = await call(executor, READ_KNOWLEDGE_TOOL_NAME, { file_name: fileName });
            expect(body.ok).toBe(true);
        }
    });

    it('asks the model to pick when a name is ambiguous, without using up a read', async () => {
        const executor = createRetrievalToolExecutor(projectContext());

        const ambiguous = await call(executor, READ_KNOWLEDGE_TOOL_NAME, { file_name: 'supplier' });
        expect(ambiguous.result.is_error).toBe(true);
        expect(ambiguous.body.matches.map((match: { file_id: string }) => match.file_id)).toEqual([
            'contracts',
            'draft',
        ]);

        for (let i = 0; i < MAX_READS_PER_REPLY; i++) {
            expect((await call(executor, READ_KNOWLEDGE_TOOL_NAME, { file_id: 'pricing' })).body.ok).toBe(true);
        }
    });

    it("only resolves names among the chat's own files in ghost chats", async () => {
        const executor = createRetrievalToolExecutor(
            makeContext({ allowWideScopes: false, index: undefined, chatAttachments: [report] })
        );

        expect((await call(executor, READ_KNOWLEDGE_TOOL_NAME, { file_name: 'report' })).body.ok).toBe(true);
        expect((await call(executor, READ_KNOWLEDGE_TOOL_NAME, { file_name: 'pricing sheet' })).result.is_error).toBe(
            true
        );
    });
});

describe('per-reply limits', () => {
    it(`stops reads after ${MAX_READS_PER_REPLY} and all calls after ${MAX_RETRIEVAL_CALLS_PER_REPLY}`, async () => {
        const executor = createRetrievalToolExecutor(makeContext());
        for (let i = 0; i < MAX_READS_PER_REPLY; i++) {
            expect((await call(executor, READ_KNOWLEDGE_TOOL_NAME, { file_id: 'report' })).body.ok).toBe(true);
        }
        const overRead = await call(executor, READ_KNOWLEDGE_TOOL_NAME, { file_id: 'report' });
        expect(overRead.body.error).toContain('Read limit');

        for (let i = MAX_READS_PER_REPLY + 1; i < MAX_RETRIEVAL_CALLS_PER_REPLY; i++) {
            expect((await call(executor, SEARCH_KNOWLEDGE_TOOL_NAME, { query: 'budget' })).body.ok).toBe(true);
        }
        const overCall = await call(executor, SEARCH_KNOWLEDGE_TOOL_NAME, { query: 'budget' });
        expect(overCall.body.error).toContain('Retrieval limit');
    });
});

describe('pages and cards', () => {
    it('splits long text into bounded pages that keep all of it', () => {
        const paragraph = 'word '.repeat(400).trim();
        const text = Array.from({ length: 40 }, () => paragraph).join('\n\n');
        const pages = splitIntoPages(text);

        expect(pages.length).toBeGreaterThan(1);
        pages.forEach((page) => expect(page.length).toBeLessThanOrEqual(PAGE_CHARS));
        expect(pages.join(' ').replace(/\s+/g, ' ')).toBe(text.replace(/\s+/g, ' '));
    });

    it('points a file card at the lookup tools with the file id and page count', () => {
        const markdown = `# Intro\n${'text '.repeat(6_000)}\n## Results\nmore`;
        const card = formatFileCard({ id: 'big', filename: 'big.md', markdown, tokenCount: 7_600 });

        expect(card).toContain('file_id "big"');
        expect(card).toContain(`${splitIntoPages(markdown).length} pages`);
        expect(card).toContain('# Intro');
        expect(card).toContain('## Results');
    });

    it('lists project files and the available scopes', () => {
        const instructions = formatRetrievalInstructions({
            isProject: true,
            allowWideScopes: true,
            chatSearch: 'none',
            searchOtherSpaces: false,
            projectFiles: [{ id: 'f1', name: 'notes.md' }],
        });

        expect(instructions).toContain('- notes.md (file_id: f1)');
        expect(instructions).toContain('"project"');
        expect(instructions).not.toContain('"all"');
        expect(instructions).toContain('not instructions');
    });
});
