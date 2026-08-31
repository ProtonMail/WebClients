// AsyncAbort turns one or more AbortSignals into a promise that can be raced against real work
// (see ImportHandle), so what matters is that it stays pending until an abort actually happens,
// rejects with the reason of the signal that aborted, and stops listening after dispose().
// Nothing here awaits the abort promise directly: a promise that never settles has to fail an
// assertion rather than hang the test, so it's observed through a settlement tracker instead.
import { AsyncAbort } from './AsyncAbort';

/** let pending microtasks _and_ timers run, so anything that can settle has settled */
const flush = async (turns = 3) => {
    for (let i = 0; i < turns; i++) {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }
};

/** observe a promise without awaiting it, so a promise that never settles fails an assertion instead of hanging the test */
const track = <T>(promise: Promise<T>) => {
    const state = { settled: false, rejected: false, error: undefined as unknown };
    promise.then(
        () => {
            state.settled = true;
        },
        (error) => {
            state.settled = true;
            state.rejected = true;
            state.error = error;
        }
    );
    return state;
};

describe('AsyncAbort', () => {
    it('stays pending while none of the signals abort', async () => {
        const a = new AbortController();
        const b = new AbortController();
        const asyncAbort = new AsyncAbort([a.signal, b.signal]);

        const state = track(asyncAbort.promise);
        await flush();

        expect(state.settled).toBe(false);
    });

    it('rejects with the abort reason once a signal aborts', async () => {
        const controller = new AbortController();
        const asyncAbort = new AsyncAbort([controller.signal]);
        const state = track(asyncAbort.promise);

        const reason = new Error('stopped');
        controller.abort(reason);
        await flush();

        expect(state.rejected).toBe(true);
        expect(state.error).toBe(reason);
    });

    it('defaults to the AbortError DOMException when no reason is given', async () => {
        const controller = new AbortController();
        const asyncAbort = new AsyncAbort([controller.signal]);
        const state = track(asyncAbort.promise);

        controller.abort();
        await flush();

        expect(state.rejected).toBe(true);
        expect(state.error).toBeInstanceOf(DOMException);
        expect((state.error as DOMException).name).toBe('AbortError');
    });

    it('rejects with the reason of whichever signal aborted', async () => {
        const dbLock = new AbortController();
        const stop = new AbortController();
        const asyncAbort = new AsyncAbort([dbLock.signal, stop.signal]);
        const state = track(asyncAbort.promise);

        // the second signal aborts, so its reason must come through and not the first one's
        const reason = new Error('stop() called');
        stop.abort(reason);
        await flush();

        expect(state.rejected).toBe(true);
        expect(state.error).toBe(reason);
    });

    it('reports the first abort and ignores later ones', async () => {
        const first = new AbortController();
        const second = new AbortController();
        const asyncAbort = new AsyncAbort([first.signal, second.signal]);
        const state = track(asyncAbort.promise);

        const firstReason = new Error('first');
        first.abort(firstReason);
        second.abort(new Error('second'));
        await flush();

        expect(state.error).toBe(firstReason);
    });

    it('does not reject after dispose', async () => {
        const controller = new AbortController();
        const asyncAbort = new AsyncAbort([controller.signal]);
        const state = track(asyncAbort.promise);

        asyncAbort.dispose();
        controller.abort(new Error('too late'));
        await flush();

        expect(state.settled).toBe(false);
    });

    it('stops listening to every signal on dispose', async () => {
        const a = new AbortController();
        const b = new AbortController();
        const asyncAbort = new AsyncAbort([a.signal, b.signal]);
        const state = track(asyncAbort.promise);

        asyncAbort.dispose();
        a.abort(new Error('a'));
        b.abort(new Error('b'));
        await flush();

        expect(state.settled).toBe(false);
    });

    it('can be disposed after aborting, and after being disposed already', async () => {
        const controller = new AbortController();
        const asyncAbort = new AsyncAbort([controller.signal]);
        const state = track(asyncAbort.promise);

        controller.abort(new Error('stopped'));
        await flush();
        // ImportHandle disposes in a finally block, so this runs on the abort path too
        asyncAbort.dispose();
        asyncAbort.dispose();

        expect(state.rejected).toBe(true);
    });

    it('stays pending with no signals at all', async () => {
        const asyncAbort = new AsyncAbort([]);

        const state = track(asyncAbort.promise);
        await flush();

        expect(state.settled).toBe(false);
        expect(() => asyncAbort.dispose()).not.toThrow();
    });

    it('rejects for a signal that was already aborted before construction', async () => {
        // addEventListener('abort') never fires for an already-aborted signal, so this case has to
        // be checked up front or the promise would stay pending forever
        const controller = new AbortController();
        const reason = new Error('aborted early');
        controller.abort(reason);
        const asyncAbort = new AsyncAbort([controller.signal]);

        const state = track(asyncAbort.promise);
        await flush();

        expect(state.rejected).toBe(true);
        expect(state.error).toBe(reason);
    });

    it('rejects when a later signal is the one already aborted', async () => {
        const live = new AbortController();
        const stop = new AbortController();
        const reason = new Error('stopped before start');
        stop.abort(reason);
        const asyncAbort = new AsyncAbort([live.signal, stop.signal]);

        const state = track(asyncAbort.promise);
        await flush();

        expect(state.error).toBe(reason);
    });

    it('does not listen to the live signals when one is already aborted', async () => {
        const live = new AbortController();
        const alreadyAborted = new AbortController();
        alreadyAborted.abort(new Error('aborted early'));
        const asyncAbort = new AsyncAbort([live.signal, alreadyAborted.signal]);
        const state = track(asyncAbort.promise);

        // dispose must stay safe even though there was nothing to unsubscribe
        expect(() => asyncAbort.dispose()).not.toThrow();
        live.abort(new Error('later'));
        await flush();

        expect((state.error as Error).message).toBe('aborted early');
    });
});
