import type { ClientToolResult } from '@proton/lumo-api-client/core/client-tools';

import { generateMasterKeyBase64 } from '../../../crypto';
import { GenerationRecoveryDb } from '../../../indexedDb/generationRecoveryDb';
import type { LumoState } from '../../../redux/store';
import { SearchService } from '../../../services/search/searchService';
import { type Attachment, Role, SpaceType } from '../../../types';
import { captureRetrievalRecovery, restoreRetrievalContext } from './recovery';
import {
    MAX_ANALYSES_PER_REPLY,
    MAX_READS_PER_REPLY,
    MAX_READ_CHARS_PER_REPLY,
    MAX_RETRIEVAL_CALLS_PER_REPLY,
    type RetrievalContext,
    createRetrievalToolExecutor,
} from './retrievalTool';
import { ANALYZE_FILE_TOOL_NAME, READ_KNOWLEDGE_TOOL_NAME, SEARCH_KNOWLEDGE_TOOL_NAME } from './schema';

const file: Attachment = {
    id: 'report',
    filename: 'report.md',
    uploadedAt: '2026-11-09T00:00:00Z',
    mimeType: 'text/markdown',
    markdown: 'The budget is 42 euros.',
};

const makeState = () =>
    ({
        spaces: { space: { id: 'space', spaceType: SpaceType.Default } },
        conversations: { chat: { id: 'chat', spaceId: 'space' } },
        messages: {
            visible: {
                id: 'visible',
                conversationId: 'chat',
                role: Role.User,
                content: 'Visible budget question',
                createdAt: '2026-11-09T00:00:00Z',
            },
            earlier: {
                id: 'earlier',
                conversationId: 'chat',
                role: Role.User,
                content: 'Earlier budget question',
                createdAt: '2026-11-09T00:00:00Z',
            },
        },
        contextFilters: { filters: [] },
        lumoUserSettings: { conversationSearch: 'all', isCrossProjectSearchEnabled: true },
    }) as unknown as LumoState;

const makeContext = (getState: () => LumoState): RetrievalContext => ({
    conversationId: 'chat',
    spaceId: 'space',
    isProject: false,
    allowWideScopes: true,
    chatSearch: 'all',
    searchOtherSpaces: true,
    hasLumoPlus: true,
    chatAttachments: [file],
    exclusions: { attachmentIds: new Set(['excluded']), documentIds: new Set(['excluded-document']) },
    getVisibleMessageIds: () => new Set(['visible']),
    allowsSearchFromOutside: () => true,
    getState,
});

async function execute(
    executor: ReturnType<typeof createRetrievalToolExecutor>,
    name: string,
    args: Record<string, unknown>
) {
    const [result] = await executor.execute([{ id: 'lookup', name, arguments: JSON.stringify(args) }]);
    return JSON.parse((result as ClientToolResult).content);
}

afterEach(() => jest.restoreAllMocks());

it('restores lookup text, sets, callbacks and budgets through encrypted checkpoint storage', async () => {
    const state = makeState();
    const getState = () => state;
    const original = makeContext(getState);
    const snapshot = captureRetrievalRecovery(original, { calls: 2, reads: 1 });
    const masterKey = generateMasterKeyBase64();
    const database = new GenerationRecoveryDb('retrieval-roundtrip', () => ({
        primaryMasterKeyId: 'master',
        primaryMasterKey: masterKey,
        masterKeys: { master: masterKey },
    }));
    await database.save('retrieval-roundtrip', snapshot, Date.now() + 60_000);
    const recovered = await database.get<typeof snapshot>('retrieval-roundtrip');
    expect(recovered).toEqual(snapshot);
    expect(recovered).not.toHaveProperty('getState');
    const context = restoreRetrievalContext({
        recovery: recovered!,
        conversationId: 'chat',
        spaceId: 'space',
        getState,
    });
    expect(context.exclusions.attachmentIds).toEqual(new Set(['excluded']));
    expect(context.exclusions.documentIds).toEqual(new Set(['excluded-document']));
    expect(context.getVisibleMessageIds()).toEqual(new Set(['visible']));
    const executor = createRetrievalToolExecutor(context, recovered!.execution);
    expect(await execute(executor, READ_KNOWLEDGE_TOOL_NAME, { file_id: 'report' })).toMatchObject({
        ok: true,
        content: file.markdown,
        file_id: 'report',
    });
    expect(executor.getRecoveryState()).toEqual({ calls: 3, reads: 2, analyses: 0, readChars: file.markdown!.length });
    const search = await execute(executor, SEARCH_KNOWLEDGE_TOOL_NAME, {
        query: 'budget',
        scope: 'this_chat',
        sources: ['messages'],
    });
    expect(search.results).toEqual([expect.objectContaining({ message_id: 'earlier' })]);
    await database.clear();
});

it.each([
    { userId: undefined, ghost: false },
    { userId: 'account', ghost: true },
])('keeps guest and ghost recovery inside the current chat (%j)', async ({ userId, ghost }) => {
    const get = jest.spyOn(SearchService, 'get');
    const state = makeState();
    state.conversations.chat.ghost = ghost;
    const context = restoreRetrievalContext({
        recovery: captureRetrievalRecovery(makeContext(() => state)),
        conversationId: 'chat',
        spaceId: 'space',
        getState: () => state,
        userId,
    });
    expect(context.index).toBeUndefined();
    expect(get).not.toHaveBeenCalled();
    const executor = createRetrievalToolExecutor(context);
    expect(await execute(executor, SEARCH_KNOWLEDGE_TOOL_NAME, { query: 'budget', scope: 'all' })).toEqual({
        ok: false,
        error: 'Only this chat can be searched here. Use "this_chat".',
    });
});

it('rebuilds the account index and enforces tighter current search settings and file exclusions', async () => {
    const index = { getIndexedDocument: jest.fn() } as unknown as SearchService;
    jest.spyOn(SearchService, 'get').mockReturnValue(index);
    const state = makeState();
    const snapshot = captureRetrievalRecovery(makeContext(() => state));
    state.lumoUserSettings.conversationSearch = 'none';
    state.lumoUserSettings.isCrossProjectSearchEnabled = false;
    state.messages.visible.attachments = [{ ...file, driveNodeId: 'drive-report' }];
    state.contextFilters.filters = [{ messageId: 'visible', excludedFiles: ['report.md'] }];
    const context = restoreRetrievalContext({
        recovery: snapshot,
        conversationId: 'chat',
        spaceId: 'space',
        getState: () => state,
        userId: 'account',
    });
    expect(SearchService.get).toHaveBeenCalledWith('account');
    expect(context.index).toBe(index);
    expect(context.chatSearch).toBe('none');
    expect(context.searchOtherSpaces).toBe(false);
    expect(context.exclusions.attachmentIds).toEqual(new Set(['excluded', 'report']));
    expect(context.exclusions.documentIds).toEqual(new Set(['excluded-document', 'drive-report']));
    const executor = createRetrievalToolExecutor(context);
    expect(await execute(executor, READ_KNOWLEDGE_TOOL_NAME, { file_id: 'report' })).toMatchObject({ ok: false });
    state.spaces.space = {
        ...state.spaces.space,
        spaceType: SpaceType.Project,
        isPrivate: true,
    } as typeof state.spaces.space;
    expect(context.allowsSearchFromOutside('space')).toBe(false);
});

it('does not widen the saved search scope when current settings become more permissive', () => {
    const state = makeState();
    const snapshot = captureRetrievalRecovery({
        ...makeContext(() => state),
        chatSearch: 'none',
        searchOtherSpaces: false,
    });
    const context = restoreRetrievalContext({
        recovery: snapshot,
        conversationId: 'chat',
        spaceId: 'space',
        getState: () => state,
    });
    expect(context.chatSearch).toBe('none');
    expect(context.searchOtherSpaces).toBe(false);
});

it.each([
    { calls: MAX_RETRIEVAL_CALLS_PER_REPLY, reads: 0, expected: 'Retrieval limit' },
    { calls: MAX_READS_PER_REPLY, reads: MAX_READS_PER_REPLY, expected: 'Read limit' },
])('retains per-reply lookup limits after recovery (%j)', async ({ calls, reads, expected }) => {
    const state = makeState();
    const executor = createRetrievalToolExecutor(
        makeContext(() => state),
        { calls, reads }
    );
    const result = await execute(executor, READ_KNOWLEDGE_TOOL_NAME, { file_id: 'report' });
    expect(result.ok).toBe(false);
    expect(result.error).toContain(expected);
    expect(executor.getRecoveryState()).toEqual({ calls: calls + 1, reads, analyses: 0, readChars: 0 });
});

it('restores file analysis with a fresh callback and retains the new reply budgets', async () => {
    const state = makeState();
    const oldAnalysis = jest.fn();
    const snapshot = captureRetrievalRecovery({ ...makeContext(() => state), analyze: oldAnalysis });
    expect(snapshot.analyzeEnabled).toBe(true);
    expect(snapshot).not.toHaveProperty('analyze');
    const analyze = jest.fn(async () => 'The budget is 42 euros.');
    const controller = new AbortController();
    const context = restoreRetrievalContext({
        recovery: snapshot,
        conversationId: 'chat',
        spaceId: 'space',
        getState: () => state,
        analysis: { analyze, signal: controller.signal },
    });
    expect(context.signal).toBe(controller.signal);
    const executor = createRetrievalToolExecutor(context, snapshot.execution);
    const result = await execute(executor, ANALYZE_FILE_TOOL_NAME, { file_id: 'report', goal: 'Find the budget' });
    expect(result).toMatchObject({ ok: true, file_id: 'report', notes: expect.stringContaining('42 euros') });
    expect(analyze).toHaveBeenCalledWith(expect.stringContaining('The budget is 42 euros.'));
    expect(oldAnalysis).not.toHaveBeenCalled();
    const next = createRetrievalToolExecutor(context, {
        ...executor.getRecoveryState(),
        analyses: MAX_ANALYSES_PER_REPLY,
        readChars: MAX_READ_CHARS_PER_REPLY,
    });
    expect(await execute(next, ANALYZE_FILE_TOOL_NAME, { file_id: 'report', goal: 'Find the budget' })).toMatchObject({
        ok: false,
        error: expect.stringContaining('Analysis limit'),
    });
    expect(await execute(next, READ_KNOWLEDGE_TOOL_NAME, { file_id: 'report' })).toMatchObject({
        ok: false,
        error: expect.stringContaining('Read limit'),
    });
    expect(analyze).toHaveBeenCalledTimes(1);
});

it('keeps analysis disabled when the saved generation did not offer it', () => {
    const state = makeState();
    const context = restoreRetrievalContext({
        recovery: captureRetrievalRecovery(makeContext(() => state)),
        conversationId: 'chat',
        spaceId: 'space',
        getState: () => state,
        analysis: { analyze: jest.fn() },
    });
    expect(createRetrievalToolExecutor(context).canExecute(ANALYZE_FILE_TOOL_NAME)).toBe(false);
});
