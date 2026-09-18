import ChallengeFrameController from './ChallengeFrameController';
import type { ChallengeEvent } from './interface';

const ORIGIN = 'https://challenge.test';
const SRC = `${ORIGIN}/challenge/v5/html?Type=0&Name=email`;

const makeEvent = (overrides: Partial<ChallengeEvent> = {}): ChallengeEvent => ({
    type: 'keydown',
    id: 'email',
    time: 100,
    isTrusted: true,
    key: 'a',
    ...overrides,
});

describe('ChallengeFrameController', () => {
    let iframe: HTMLIFrameElement;
    let postMessage: jest.SpyInstance;
    let controller: ChallengeFrameController | undefined;
    let onSuccess: jest.Mock;
    let onError: jest.Mock;

    /** Simulates a message coming back from the frame. */
    const emit = (data: unknown, origin = ORIGIN) => {
        window.dispatchEvent(
            new MessageEvent('message', {
                data,
                origin,
                source: iframe.contentWindow,
            })
        );
    };

    const create = (options: Partial<ConstructorParameters<typeof ChallengeFrameController>[0]> = {}) => {
        controller = new ChallengeFrameController({ iframe, src: SRC, onSuccess, onError, ...options });
        return controller;
    };

    /** Walks the frame through the handshake up to `loaded`. */
    const load = () => {
        emit({ type: 'init' });
        emit({ type: 'onload' });
    };

    const postedMessages = () => postMessage.mock.calls.map(([message]) => message);

    beforeEach(() => {
        jest.useFakeTimers();
        onSuccess = jest.fn();
        onError = jest.fn();
        iframe = document.createElement('iframe');
        document.body.appendChild(iframe);
        postMessage = jest.spyOn(iframe.contentWindow!, 'postMessage').mockImplementation(() => {});
    });

    afterEach(() => {
        controller?.destroy();
        controller = undefined;
        iframe.remove();
        jest.useRealTimers();
    });

    describe('handshake', () => {
        it('asks the frame to load once it initializes, then reports success', () => {
            create();

            emit({ type: 'init' });
            expect(postMessage).toHaveBeenCalledWith({ type: 'load' }, ORIGIN);
            expect(onSuccess).not.toHaveBeenCalled();

            emit({ type: 'onload' });
            expect(onSuccess).toHaveBeenCalledTimes(1);
        });

        it('errors if the frame never initializes', () => {
            create({ errorTimeout: 1000 });

            jest.advanceTimersByTime(1000);

            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError.mock.calls[0][0]).toContainEqual(
                expect.objectContaining({ type: 'error', text: expect.stringContaining('Initial iframe timeout') })
            );
        });

        it('does not error once loaded', () => {
            create({ errorTimeout: 1000 });
            load();

            jest.advanceTimersByTime(5000);

            expect(onError).not.toHaveBeenCalled();
        });

        it('ignores messages from another origin', () => {
            create();

            emit({ type: 'init' }, 'https://evil.test');

            expect(postMessage).not.toHaveBeenCalled();
        });
    });

    describe('events', () => {
        it('batches the events it forwards', () => {
            create();
            load();
            postMessage.mockClear();

            controller!.sendEvent(makeEvent({ key: 'a' }));
            controller!.sendEvent(makeEvent({ key: 'b' }));
            expect(postMessage).not.toHaveBeenCalled();

            jest.advanceTimersByTime(0);

            expect(postMessage).toHaveBeenCalledTimes(1);
            expect(postMessage).toHaveBeenCalledWith(
                { type: 'events', payload: [makeEvent({ key: 'a' }), makeEvent({ key: 'b' })] },
                ORIGIN
            );
        });

        it('holds on to events sent before the frame loads and delivers them in one batch on load', () => {
            create();

            controller!.sendEvent(makeEvent({ key: 'a' }));
            controller!.sendEvent(makeEvent({ key: 'b' }));
            jest.advanceTimersByTime(0);
            expect(postMessage).not.toHaveBeenCalled();

            load();

            expect(postedMessages().filter((message) => message.type === 'events')).toEqual([
                { type: 'events', payload: [makeEvent({ key: 'a' }), makeEvent({ key: 'b' })] },
            ]);
        });

        it('discards what it buffered if the frame never loads', () => {
            create({ errorTimeout: 1000 });

            controller!.sendEvent(makeEvent({ key: 'a' }));
            jest.advanceTimersByTime(1000);
            expect(onError).toHaveBeenCalledTimes(1);

            // Nothing is delivered late, even if the frame turns up afterwards.
            load();
            jest.advanceTimersByTime(0);

            expect(postMessage).not.toHaveBeenCalled();
        });

        it('discards what it buffered when destroyed', () => {
            create();
            controller!.sendEvent(makeEvent({ key: 'a' }));
            controller!.destroy();

            controller!.sendEvent(makeEvent({ key: 'b' }));
            jest.advanceTimersByTime(0);

            expect(postMessage).not.toHaveBeenCalled();
        });
    });

    describe('observe', () => {
        let container: HTMLDivElement;
        let input: HTMLInputElement;

        const makeContainer = (id: string) => {
            const el = document.createElement('div');
            const field = document.createElement('input');
            field.id = id;
            el.appendChild(field);
            document.body.appendChild(el);
            return { el, field };
        };

        const type = (el: Element, key: string) => {
            el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
            jest.advanceTimersByTime(0);
        };

        const forwardedIds = () =>
            postedMessages()
                .filter((message) => message.type === 'events')
                .flatMap((message) => message.payload.map((event: ChallengeEvent) => event.id));

        beforeEach(() => {
            ({ el: container, field: input } = makeContainer('email'));
        });

        afterEach(() => container.remove());

        it('forwards interactions from anywhere below the observed element', () => {
            create();
            load();
            controller!.observe(container);
            postMessage.mockClear();

            type(input, 'a');

            expect(postMessage).toHaveBeenCalledWith(
                { type: 'events', payload: [expect.objectContaining({ type: 'keydown', id: 'email', key: 'a' })] },
                ORIGIN
            );
        });

        it('lets go of the previous element when handed a new one', () => {
            const { el: other, field: otherInput } = makeContainer('username');
            create();
            load();
            controller!.observe(container);
            controller!.observe(other);
            postMessage.mockClear();

            type(input, 'a');
            type(otherInput, 'b');

            expect(forwardedIds()).toEqual(['username']);

            other.remove();
        });

        it('is a no-op when handed the same element again', () => {
            create();
            load();
            controller!.observe(container);
            controller!.observe(container);
            postMessage.mockClear();

            type(input, 'a');

            expect(forwardedIds()).toEqual(['email']);
        });

        it('stops when handed null', () => {
            create();
            load();
            controller!.observe(container);
            controller!.observe(null);
            postMessage.mockClear();

            type(input, 'a');

            expect(postMessage).not.toHaveBeenCalled();
        });

        it('stops when destroyed', () => {
            create();
            load();
            controller!.observe(container);
            controller!.destroy();
            postMessage.mockClear();

            type(input, 'a');

            expect(postMessage).not.toHaveBeenCalled();
        });
    });

    describe('getChallenge', () => {
        it('delivers the buffered events before asking, not on the next task', () => {
            create();
            load();
            postMessage.mockClear();

            // Typing and submitting in the same task, the way pressing Enter in a field does.
            controller!.sendEvent(makeEvent({ key: 'Enter' }));
            void controller!.getChallenge().catch(() => {});

            expect(postedMessages().map((message) => message.type)).toEqual([
                'events',
                'env.loaded',
                'submit.broadcast',
            ]);
        });

        it('delivers the buffered events before asking when the request predates the load', () => {
            create();

            controller!.sendEvent(makeEvent({ key: 'Enter' }));
            void controller!.getChallenge().catch(() => {});
            load();

            expect(postedMessages().map((message) => message.type)).toEqual([
                'load',
                'events',
                'env.loaded',
                'submit.broadcast',
            ]);
        });

        it('does not flush an empty batch on top of the request', () => {
            create();
            load();
            postMessage.mockClear();

            void controller!.getChallenge().catch(() => {});

            expect(postedMessages().map((message) => message.type)).toEqual(['env.loaded', 'submit.broadcast']);
        });

        it('resolves with the fingerprint the frame reports', async () => {
            create();
            load();

            const promise = controller!.getChallenge();

            expect(postedMessages()).toContainEqual({ type: 'submit.broadcast' });

            emit({ type: 'child.message.data', data: { id: 'challenge-id', fingerprint: 'abc' } });

            await expect(promise).resolves.toEqual({ 'challenge-id': 'abc' });
        });

        it('waits for the frame to load before asking', () => {
            create();

            void controller!.getChallenge().catch(() => {});
            expect(postedMessages()).not.toContainEqual({ type: 'submit.broadcast' });

            load();
            expect(postedMessages()).toContainEqual({ type: 'submit.broadcast' });
        });

        it('rejects on timeout', async () => {
            create({ challengeTimeout: 1000 });
            load();

            const promise = controller!.getChallenge();
            jest.advanceTimersByTime(1000);

            await expect(promise).rejects.toThrow('Challenge timeout');
        });

        it('abandons an outstanding request when a new one comes in', async () => {
            create();
            load();

            const first = controller!.getChallenge();
            const second = controller!.getChallenge();

            await expect(first).rejects.toThrow('Challenge abandoned');

            emit({ type: 'child.message.data', data: { id: 'challenge-id', fingerprint: 'abc' } });
            await expect(second).resolves.toEqual({ 'challenge-id': 'abc' });
        });

        it('rejects when the controller is destroyed', async () => {
            create();
            load();

            const promise = controller!.getChallenge();
            controller!.destroy();

            await expect(promise).rejects.toThrow('Challenge unmounted');
        });

        it('fails immediately once destroyed, rather than after the timeout', async () => {
            create();
            load();
            controller!.destroy();

            // No timer advanced: a submit waiting on this has to hear back now, not in 24 seconds.
            await expect(controller!.getChallenge()).rejects.toThrow('Challenge unmounted');
        });

        it('rejects an outstanding request when the frame errors', async () => {
            create({ errorTimeout: 1000 });

            const promise = controller!.getChallenge();
            jest.advanceTimersByTime(1000);

            await expect(promise).rejects.toThrow('Challenge failed');
        });

        it('fails immediately once the frame has errored', async () => {
            create({ errorTimeout: 1000 });
            jest.advanceTimersByTime(1000);

            await expect(controller!.getChallenge()).rejects.toThrow('Challenge failed');
        });

        it('forgets a request that timed out', async () => {
            create({ challengeTimeout: 1000 });
            load();

            const promise = controller!.getChallenge();
            jest.advanceTimersByTime(1000);
            await expect(promise).rejects.toThrow('Challenge timeout');

            // The frame answering late must not be taken for an answer to anything.
            postMessage.mockClear();
            emit({ type: 'child.message.data', data: { id: 'challenge-id', fingerprint: 'abc' } });

            // And the next request is a clean one, not an abandoned continuation of the last.
            const next = controller!.getChallenge();
            emit({ type: 'child.message.data', data: { id: 'other-id', fingerprint: 'def' } });

            await expect(next).resolves.toEqual({ 'other-id': 'def' });
        });

        it('does not re-request on load for a request that already timed out', () => {
            create({ challengeTimeout: 1000 });

            void controller!.getChallenge().catch(() => {});
            jest.advanceTimersByTime(1000);

            load();

            expect(postedMessages().map((message) => message.type)).not.toContain('submit.broadcast');
        });
    });

    it('stops listening once destroyed', () => {
        create();
        controller!.destroy();

        emit({ type: 'init' });

        expect(postMessage).not.toHaveBeenCalled();
    });
});
