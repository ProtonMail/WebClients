import { getFilteredUndoTokens, runParallelChunkedActions } from 'proton-mail/helpers/chunk';
import { clearAll } from 'proton-mail/helpers/test/helper';

const api = jest.fn((any) => any);
const items: number[] = [...Array(50).keys()];

describe('chunk', () => {
    beforeEach(() => clearAll());

    describe('runParallelChunkedActions', () => {
        const action = jest.fn(() => ({ UndoToken: { Token: 'fake' } }));

        it('should chunk actions with expected size', async () => {
            const tokens = await runParallelChunkedActions({ api, items, chunkSize: 10, action });

            expect(action).toHaveBeenCalledTimes(5);
            expect(tokens.length).toEqual(5);
        });

        it('should chunk actions with default size', async () => {
            const tokens = await runParallelChunkedActions({ api, items, action });

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

            expect(action).toHaveBeenCalledTimes(2);
            expect(handleChunkFailed).toHaveBeenCalledTimes(2);
            expect(handleChunkFailed.mock.calls[0]).toEqual([items.slice(0, 25)]);
            expect(handleChunkFailed.mock.calls[1]).toEqual([items.splice(25, 49)]);
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
