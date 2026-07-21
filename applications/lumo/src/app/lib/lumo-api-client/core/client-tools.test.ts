import {
    type PendingClientToolCall,
    filterClientToolCalls,
    mergePendingClientToolCalls,
    type ClientToolExecutor,
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
