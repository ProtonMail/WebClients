import {
    type ClientToolExecutor,
    type PendingClientToolCall,
    composeClientToolExecutors,
    filterClientToolCalls,
    mergePendingClientToolCalls,
} from './client-tools';

const decryptedSearchCall: PendingClientToolCall = {
    id: 'call_1',
    name: 'filesystem__fs_search',
    arguments: '{"query":"invoices"}',
};

describe('mergePendingClientToolCalls', () => {
    it('keeps a single well-formed tool call', () => {
        expect(mergePendingClientToolCalls([decryptedSearchCall])).toEqual([decryptedSearchCall]);
    });

    it('drops tool calls whose arguments are still encrypted / unparseable', () => {
        const encryptedCall: PendingClientToolCall = {
            id: 'call_1',
            name: 'filesystem__fs_search',
            arguments: 'q83n2b9fWk=',
        };
        expect(mergePendingClientToolCalls([encryptedCall])).toEqual([]);
    });

    it('prefers the entry with real arguments when the same call_id appears on both channels', () => {
        const emptyDeltaStub: PendingClientToolCall = {
            id: 'call_1',
            name: 'filesystem__fs_search',
            arguments: '{}',
        };
        expect(mergePendingClientToolCalls([emptyDeltaStub], [decryptedSearchCall])).toEqual([decryptedSearchCall]);
        expect(mergePendingClientToolCalls([decryptedSearchCall], [emptyDeltaStub])).toEqual([decryptedSearchCall]);
    });

    it('collapses an identical call that arrives under different ids so it runs once', () => {
        const sameCallOtherId: PendingClientToolCall = { ...decryptedSearchCall, id: 'call_2' };
        expect(mergePendingClientToolCalls([decryptedSearchCall], [sameCallOtherId])).toEqual([decryptedSearchCall]);
    });

    it('ignores tool calls with no name', () => {
        const nameless: PendingClientToolCall = { id: 'call_1', name: '', arguments: '{}' };
        expect(mergePendingClientToolCalls([nameless])).toEqual([]);
    });
});

describe('composeClientToolExecutors', () => {
    const artifactExecutor: ClientToolExecutor = {
        getClientTools: async () => [
            {
                type: 'function',
                function: { name: 'create_artifact', description: 'Create artifact', parameters: {} },
            },
        ],
        canExecute: (name) => name === 'create_artifact',
        execute: async (calls) => {
            return calls.map(() => {
                return { content: 'artifact-ok' };
            });
        },
    };

    const desktopExecutor: ClientToolExecutor = {
        getClientTools: async () => [
            {
                type: 'function',
                function: { name: 'filesystem__fs_search', description: 'Search files', parameters: {} },
            },
        ],
        canExecute: (name) => name.startsWith('filesystem__'),
        execute: async (calls) => {
            return calls.map(() => {
                return { content: 'desktop-ok' };
            });
        },
    };

    it('merges advertised tools from every executor', async () => {
        const composed = composeClientToolExecutors(artifactExecutor, desktopExecutor);
        const tools = (await composed.getClientTools?.()) ?? [];
        expect(tools.map((tool) => tool.function.name)).toEqual(['create_artifact', 'filesystem__fs_search']);
    });

    it('routes execution to the executor that owns each tool', async () => {
        const composed = composeClientToolExecutors(artifactExecutor, desktopExecutor);
        const calls: PendingClientToolCall[] = [
            { id: '1', name: 'filesystem__fs_search', arguments: '{}' },
            { id: '2', name: 'create_artifact', arguments: '{}' },
            { id: '3', name: 'filesystem__fs_read', arguments: '{}' },
        ];

        const results = await composed.execute(calls);
        expect(results).toEqual([{ content: 'desktop-ok' }, { content: 'artifact-ok' }, { content: 'desktop-ok' }]);
    });

    it('keeps filterClientToolCalls working for both tool families', () => {
        const composed = composeClientToolExecutors(artifactExecutor, desktopExecutor);
        const calls: PendingClientToolCall[] = [
            { id: '1', name: 'filesystem__fs_search', arguments: '{}' },
            { id: '2', name: 'create_artifact', arguments: '{}' },
            { id: '3', name: 'web_search', arguments: '{}' },
        ];

        expect(filterClientToolCalls(calls, composed)).toEqual([calls[0], calls[1]]);
    });
});

describe('filterClientToolCalls', () => {
    const executor: ClientToolExecutor = {
        canExecute: (name) => name.startsWith('mail__'),
        execute: async (calls) => calls.map(() => ({ content: 'ok' })),
    };

    it('keeps only calls the executor accepts', () => {
        const calls: PendingClientToolCall[] = [
            { id: '1', name: 'mail__view_emails', arguments: '{}' },
            { id: '2', name: 'filesystem__fs_read', arguments: '{}' },
        ];
        expect(filterClientToolCalls(calls, executor)).toEqual([calls[0]]);
    });
});
