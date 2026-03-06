import { runBulkUpdate } from '.';
import type { IndexerContext } from '../../types';

jest.mock('../../../../../../Logger', () => ({
    Logger: { info: jest.fn(), debug: jest.fn() },
}));

async function* makeEntries(ids: string[]) {
    for (const id of ids) {
        yield { documentId: id, attributes: [] };
    }
}

function makeMockedWriteSession() {
    return {
        insert: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
        dispose: jest.fn(),
    };
}

const BRIDGE = {} as any;

function makeCtx(
    opts: {
        entryIds?: string[];
        session?: ReturnType<typeof makeMockedWriteSession>;
    } = {}
) {
    const { entryIds = [], session = makeMockedWriteSession() } = opts;

    const BulkUpdater = jest.fn().mockImplementation(() => ({
        visitAndProduceIndexEntries: jest.fn().mockReturnValue(makeEntries(entryIds)),
    }));

    const setEngineState = jest.fn().mockResolvedValue(undefined);
    const startWriteSession = jest.fn().mockReturnValue(session);

    const ctx = {
        config: { BulkUpdater },
        indexWriter: { startWriteSession },
        db: { setEngineState },
        requiredConfigKey: 'v1',
    } as unknown as IndexerContext;

    return { ctx, session, setEngineState };
}

describe('runBulkUpdate', () => {
    describe('happy path', () => {
        it('inserts every entry yielded by the bulk updater', async () => {
            const { ctx, session } = makeCtx({ entryIds: ['a', 'b', 'c'] });
            await runBulkUpdate(ctx, BRIDGE, new AbortController().signal);
            expect(session.insert).toHaveBeenCalledTimes(3);
        });

        it('commits the session after all entries are processed', async () => {
            const { ctx, session } = makeCtx({ entryIds: ['a'] });
            await runBulkUpdate(ctx, BRIDGE, new AbortController().signal);
            expect(session.commit).toHaveBeenCalledTimes(1);
        });

        it('works correctly with zero entries', async () => {
            const { ctx, session } = makeCtx({ entryIds: [] });
            await runBulkUpdate(ctx, BRIDGE, new AbortController().signal);
            expect(session.insert).not.toHaveBeenCalled();
            expect(session.commit).toHaveBeenCalledTimes(1);
        });

        it('persists the active config key to the DB after a successful commit', async () => {
            const { ctx, setEngineState } = makeCtx({ entryIds: ['a'] });
            await runBulkUpdate(ctx, BRIDGE, new AbortController().signal);
            expect(setEngineState).toHaveBeenCalledWith({ activeConfigKey: 'v1' });
        });

        it('calls dispose() after a successful commit', async () => {
            const { ctx, session } = makeCtx();
            await runBulkUpdate(ctx, BRIDGE, new AbortController().signal);
            expect(session.dispose).toHaveBeenCalledTimes(1);
        });
    });

    describe('abort signal', () => {
        it('throws AbortError when signal is already aborted and there are entries to process', async () => {
            const ac = new AbortController();
            ac.abort();
            const { ctx } = makeCtx({ entryIds: ['a'] });
            await expect(runBulkUpdate(ctx, BRIDGE, ac.signal)).rejects.toMatchObject({ name: 'AbortError' });
        });

        it('throws AbortError when signal is already aborted and there are no entries', async () => {
            const ac = new AbortController();
            ac.abort();
            const { ctx } = makeCtx({ entryIds: [] });
            await expect(runBulkUpdate(ctx, BRIDGE, ac.signal)).rejects.toMatchObject({ name: 'AbortError' });
        });

        it('does not commit when aborted', async () => {
            const ac = new AbortController();
            ac.abort();
            const { ctx, session } = makeCtx({ entryIds: ['a'] });
            await expect(runBulkUpdate(ctx, BRIDGE, ac.signal)).rejects.toThrow();
            expect(session.commit).not.toHaveBeenCalled();
        });

        it('calls dispose() even when aborted', async () => {
            const ac = new AbortController();
            ac.abort();
            const { ctx, session } = makeCtx({ entryIds: ['a'] });
            await expect(runBulkUpdate(ctx, BRIDGE, ac.signal)).rejects.toThrow();
            expect(session.dispose).toHaveBeenCalledTimes(1);
        });

        it('does not call db.setEngineState() when aborted', async () => {
            const ac = new AbortController();
            ac.abort();
            const { ctx, setEngineState } = makeCtx({ entryIds: ['a'] });
            await expect(runBulkUpdate(ctx, BRIDGE, ac.signal)).rejects.toThrow();
            expect(setEngineState).not.toHaveBeenCalled();
        });

        it('aborts mid-iteration: throws AbortError after processing the first entry', async () => {
            const ac = new AbortController();

            // Generator yields entry then aborts — the next iteration's check fires.
            async function* abortAfterFirst() {
                yield { documentId: 'a', attributes: [] };
                ac.abort();
                yield { documentId: 'b', attributes: [] };
            }

            const session = makeMockedWriteSession();
            const BulkUpdater = jest.fn().mockImplementation(() => ({
                visitAndProduceIndexEntries: jest.fn().mockReturnValue(abortAfterFirst()),
            }));
            const ctx = {
                config: { BulkUpdater },
                indexWriter: { startWriteSession: jest.fn().mockReturnValue(session) },
                db: { setEngineState: jest.fn() },
                requiredConfigKey: 'v1',
            } as unknown as IndexerContext;

            await expect(runBulkUpdate(ctx, BRIDGE, ac.signal)).rejects.toMatchObject({ name: 'AbortError' });
            expect(session.commit).not.toHaveBeenCalled();
            expect(session.dispose).toHaveBeenCalledTimes(1);
        });
    });

    describe('error handling', () => {
        it('calls dispose() when commit() throws', async () => {
            const session = makeMockedWriteSession();
            session.commit.mockRejectedValue(new Error('Search library WASM commit failed'));
            const { ctx } = makeCtx({ session });

            await expect(runBulkUpdate(ctx, BRIDGE, new AbortController().signal)).rejects.toThrow(
                'Search library WASM commit failed'
            );
            expect(session.dispose).toHaveBeenCalledTimes(1);
        });

        it('does not call db.setEngineState() when commit() throws', async () => {
            const session = makeMockedWriteSession();
            session.commit.mockRejectedValue(new Error('Search library WASM commit failed'));
            const { ctx, setEngineState } = makeCtx({ session });

            await expect(runBulkUpdate(ctx, BRIDGE, new AbortController().signal)).rejects.toThrow();
            expect(setEngineState).not.toHaveBeenCalled();
        });

        it('propagates errors thrown by session.insert()', async () => {
            const session = makeMockedWriteSession();
            session.insert.mockImplementation(() => {
                throw new Error('Search library insert failed');
            });
            const { ctx } = makeCtx({ entryIds: ['a'], session });

            await expect(runBulkUpdate(ctx, BRIDGE, new AbortController().signal)).rejects.toThrow(
                'Search library insert failed'
            );
        });

        it('calls dispose() when session.insert() throws', async () => {
            const session = makeMockedWriteSession();
            session.insert.mockImplementation(() => {
                throw new Error('insert failed');
            });
            const { ctx } = makeCtx({ entryIds: ['a'], session });

            await expect(runBulkUpdate(ctx, BRIDGE, new AbortController().signal)).rejects.toThrow();
            expect(session.dispose).toHaveBeenCalledTimes(1);
        });
    });
});
