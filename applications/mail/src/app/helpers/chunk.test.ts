import { getFilteredUndoTokens, runParallelChunkedActions } from 'proton-mail/helpers/chunk';
import { clearAll } from 'proton-mail/helpers/test/helper';

const api = jest.fn((any) => any);
const items: number[] = [...Array(50).keys()];

describe('chunk', () => {
    beforeEach(() => clearAll());

    describe('runParallelChunkedActions', () => {
        const action = jest.fn(() => ({ UndoToken: { Token: 'fake' } }));

        it('should chunk actions with default size', async () => {
            const tokens = await runParallelChunkedActions({ api, items, action });

            expect(action).toHaveBeenCalledTimes(5);
            expect(tokens.length).toEqual(5);
        });

        it('should chunk actions with expected size', async () => {
            const tokens = await runParallelChunkedActions({ api, items, action, chunkSize: 25 });

            expect(action).toHaveBeenCalledTimes(2);
            expect(tokens.length).toEqual(2);
        });

        it('should rollback changes when a request on a chunk has failed', async () => {
            const action = jest.fn(() => {
                throw new Error('FAILS');
            });
            const handleChunkFailed = jest.fn();

            try {
                await runParallelChunkedActions({ api, items, action, optimisticAction: handleChunkFailed });
            } catch (e: any) {
                expect(e.message).toEqual('Something went wrong. Please try again.');
            }

            expect(action).toHaveBeenCalledTimes(5);
            expect(handleChunkFailed).toHaveBeenCalledTimes(5);

            expect(handleChunkFailed.mock.calls[0]).toEqual([items.slice(0, 10)]);
            expect(handleChunkFailed.mock.calls[1]).toEqual([items.slice(10, 20)]);
            expect(handleChunkFailed.mock.calls[2]).toEqual([items.slice(20, 30)]);
            expect(handleChunkFailed.mock.calls[3]).toEqual([items.slice(30, 40)]);
            expect(handleChunkFailed.mock.calls[4]).toEqual([items.slice(40, 50)]);
        });
    });

    describe('getFilteredUndoTokens', () => {
        const token1 = { status: 'fulfilled', value: 'ok1' } as PromiseFulfilledResult<string>;
        const token2 = { status: 'fulfilled', value: 'ok2' } as PromiseFulfilledResult<string>;

        const tokens: PromiseSettledResult<string>[] = [token1, token2, { status: 'rejected', reason: 'nok' }];

        it('should filter undo tokens', () => {
            const res = getFilteredUndoTokens(tokens);

            expect(res).toEqual([token1.value, token2.value]);
        });
    });
});
