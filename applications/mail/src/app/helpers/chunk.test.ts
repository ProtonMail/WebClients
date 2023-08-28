import {
    getFilteredUndoTokens,
    runParallelChunkedActions,
    runParallelUndoableChunkedActions,
} from 'proton-mail/helpers/chunk';
import { clearAll } from 'proton-mail/helpers/test/helper';

const api = jest.fn();
const items: number[] = [...Array(50).keys()];

describe('chunk', () => {
    beforeEach(() => clearAll());

    describe('runParallelChunkedActions', () => {
        const action = jest.fn();

        it('should chunk actions with expected size', async () => {
            await runParallelChunkedActions({ api, items, chunkSize: 10, action });

            expect(action).toHaveBeenCalledTimes(5);
        });

        it('should chunk actions with default size', async () => {
            await runParallelChunkedActions({ api, items, action });

            expect(action).toHaveBeenCalledTimes(2);
        });
    });

    describe('runParallelUndoableChunkedActions', () => {
        const action = jest.fn(() => ({ Undo: 'fake' }));

        it('should chunk actions with expected size', async () => {
            const tokens = await runParallelUndoableChunkedActions({ api, items, chunkSize: 10, action });

            expect(action).toHaveBeenCalledTimes(5);
            expect(tokens.length).toEqual(5);
        });

        it('should chunk actions with default size', async () => {
            const tokens = await runParallelUndoableChunkedActions({ api, items, action });

            expect(action).toHaveBeenCalledTimes(2);
            expect(tokens.length).toEqual(2);
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
