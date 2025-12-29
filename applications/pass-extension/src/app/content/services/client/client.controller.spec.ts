import { clearBrowserMocks } from 'proton-pass-extension/__mocks__/webextension-polyfill';
import type {
    ContentScriptClient,
    ContentScriptClientFactoryOptions,
} from 'proton-pass-extension/app/content/services/client/client';
import type { ClientObserverEvent } from 'proton-pass-extension/app/content/services/client/client.observer';
import { createClientObserver } from 'proton-pass-extension/app/content/services/client/client.observer';
import * as frameUtils from 'proton-pass-extension/app/content/utils/frame';
import { backgroundMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import type { Subscriber } from '@proton/pass/utils/pubsub/factory';
import { createActivityProbe } from '@proton/pass/utils/time/probe';
import { wait } from '@proton/shared/lib/helpers/promise';

import { CLIENT_START_TIMEOUT_MS, type ClientController, createClientController } from './client.controller';

const TEST_SCRIPT_ID = 'test-script-id';

jest.mock('proton-pass-extension/app/content/services/client/client.observer');
jest.mock('proton-pass-extension/lib/message/send-message');
jest.mock('proton-pass-extension/app/content/utils/frame');
jest.mock('@proton/pass/utils/time/probe');

const mockCreateClientObserver = createClientObserver as jest.MockedFunction<typeof createClientObserver>;
const mockCreateActivityProbe = createActivityProbe as jest.MockedFunction<typeof createActivityProbe>;

const mockObserver = {
    observe: jest.fn(),
    destroy: jest.fn(),
    subscribe: jest.fn((_: Subscriber<ClientObserverEvent>) => () => {}),
};

const mockClient = {
    context: {} as any,
    start: jest.fn(() => Promise.resolve()),
    destroy: jest.fn(),
};

const mockProbe = {
    start: jest.fn(),
    cancel: jest.fn(),
};

const mockClientFactory = jest.fn((_: ContentScriptClientFactoryOptions) => mockClient as ContentScriptClient);
const elements = { root: 'pass-root-test', control: 'pass-control-test' };
const assertFrameVisible = frameUtils.assertFrameVisible as jest.Mock;

const setFrameVisibility = (state: DocumentVisibilityState) => {
    assertFrameVisible.mockReset();
    assertFrameVisible.mockResolvedValue(state === 'visible');

    Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => state,
    });
};

const createMockClientController = (mainFrame: boolean) => {
    const ctrl = createClientController({
        clientFactory: mockClientFactory,
        scriptId: TEST_SCRIPT_ID,
        mainFrame,
    });

    jest.spyOn(ctrl, 'registerElements').mockResolvedValue(elements);
    return ctrl;
};

describe('Client controller', () => {
    let ctrl: ClientController;

    beforeEach(() => {
        jest.useFakeTimers();

        assertFrameVisible.mockReset();
        assertFrameVisible.mockResolvedValue(true);

        mockClientFactory.mockClear();
        mockClient.start.mockClear();
        mockClient.destroy.mockClear();

        mockObserver.observe.mockClear();
        mockObserver.destroy.mockClear();
        mockObserver.subscribe.mockClear();

        mockProbe.start.mockClear();
        mockProbe.cancel.mockClear();

        clearBrowserMocks();

        mockCreateClientObserver.mockClear();
        mockCreateClientObserver.mockReturnValue(mockObserver);

        mockCreateActivityProbe.mockClear();
        mockCreateActivityProbe.mockReturnValue(mockProbe);
    });

    afterEach(() => jest.useRealTimers());

    describe('initialization', () => {
        test('should register `UNLOAD_CONTENT_SCRIPT handler`', async () => {
            const type = WorkerMessageType.UNLOAD_CONTENT_SCRIPT;
            setFrameVisibility('visible');

            ctrl = createMockClientController(true);
            jest.spyOn(ctrl, 'destroy');
            const register = jest.spyOn(ctrl.channel, 'register');

            await ctrl.init();
            await jest.runAllTimersAsync();

            const listener = register.mock.calls.find(([m]) => m === type)?.[1];
            listener?.(backgroundMessage({ type }), jest.fn());

            expect(ctrl.destroy).toHaveBeenCalled();
            expect(mockClient.destroy).toHaveBeenCalled();
            ctrl.destroy();
        });

        test('should register `FRAME_DEFERRED_INIT` handler', async () => {
            ctrl = createMockClientController(true);
            const register = jest.spyOn(ctrl.channel, 'register');

            setFrameVisibility('visible');
            await ctrl.init();

            expect(register).toHaveBeenCalledWith(WorkerMessageType.FRAME_DEFERRED_INIT, expect.any(Function));
            ctrl.destroy();
        });

        test('should register `FRAME_QUERY` handler', async () => {
            ctrl = createMockClientController(true);
            const register = jest.spyOn(ctrl.channel, 'register');

            setFrameVisibility('visible');
            await ctrl.init();

            expect(register).toHaveBeenCalledWith(WorkerMessageType.FRAME_QUERY, expect.any(Function));
            ctrl.destroy();
        });
    });

    describe('main frame', () => {
        beforeEach(() => {
            ctrl = createMockClientController(true);
        });

        test('should create client when loading on visible page', async () => {
            setFrameVisibility('visible');
            await ctrl.init();

            expect(mockClientFactory).toHaveBeenCalled();
            expect(mockClient.start).toHaveBeenCalled();
            expect(ctrl.deferred).toBe(false);
            ctrl.destroy();
        });

        test('should not create client when loading on hidden page', async () => {
            setFrameVisibility('hidden');
            await ctrl.init();

            expect(mockClientFactory).not.toHaveBeenCalled();
            expect(mockClient.start).not.toHaveBeenCalled();
            expect(ctrl.deferred).toBe(false);
            ctrl.destroy();
        });

        test('should handle visibility changes', async () => {
            setFrameVisibility('visible');
            await ctrl.init();

            expect(mockClientFactory).toHaveBeenCalled();
            expect(mockClient.start).toHaveBeenCalled();

            mockClientFactory.mockClear();

            setFrameVisibility('hidden');
            document.dispatchEvent(new Event('visibilitychange'));

            expect(mockClientFactory).not.toHaveBeenCalled();
            expect(mockClient.destroy).toHaveBeenCalled();

            setFrameVisibility('visible');
            document.dispatchEvent(new Event('visibilitychange'));

            await jest.advanceTimersByTimeAsync(CLIENT_START_TIMEOUT_MS);

            expect(mockClientFactory).toHaveBeenCalled();
            ctrl.destroy();
        });

        test('should debounce quick visibility changes', async () => {
            setFrameVisibility('visible');
            await ctrl.init();

            expect(mockClientFactory).toHaveBeenCalledTimes(1);

            for (let i = 0; i < 15; i++) {
                const hide = wait(25).then(() => {
                    setFrameVisibility('hidden');
                    document.dispatchEvent(new Event('visibilitychange'));
                });

                await jest.advanceTimersByTimeAsync(25);
                await hide;

                const show = wait(25).then(() => {
                    setFrameVisibility('visible');
                    document.dispatchEvent(new Event('visibilitychange'));
                });

                await jest.advanceTimersByTimeAsync(25);
                await show;
            }

            await jest.advanceTimersByTimeAsync(350);

            expect(mockClient.destroy).toHaveBeenCalledTimes(1);
            expect(mockClientFactory).toHaveBeenCalledTimes(2);
            ctrl.destroy();
        });

        test('should handle client creation errors gracefully', async () => {
            mockClientFactory.mockImplementationOnce(() => {
                throw new Error('Client creation failed');
            });

            jest.spyOn(ctrl, 'destroy');
            setFrameVisibility('visible');
            await ctrl.init();

            expect(ctrl.destroy).toHaveBeenCalled();
            ctrl.destroy();
        });

        test('should start activity probe when client starts', async () => {
            setFrameVisibility('visible');
            await ctrl.init();

            expect(mockClientFactory).toHaveBeenCalled();
            expect(mockClient.start).toHaveBeenCalled();

            await jest.runAllTimersAsync();

            expect(mockProbe.start).toHaveBeenCalled();
            ctrl.destroy();
        });

        test('should cancel activity probe when client stops', async () => {
            setFrameVisibility('visible');
            await ctrl.init();
            ctrl.stop('test');

            expect(mockProbe.cancel).toHaveBeenCalled();
            ctrl.destroy();
        });
    });

    describe('sub-frame', () => {
        beforeEach(() => {
            const mainFrame = false;
            ctrl = createMockClientController(mainFrame);
        });

        test('should not create probe for sub-frames', async () => {
            setFrameVisibility('visible');
            await ctrl.init();

            expect(mockCreateActivityProbe).not.toHaveBeenCalled();
            ctrl.destroy();
        });

        test('should not defer initialization when loading in visible sub-frame', async () => {
            setFrameVisibility('visible');
            jest.spyOn(ctrl, 'defer');

            await ctrl.init();

            expect(mockClientFactory).toHaveBeenCalled();
            expect(mockClient.start).toHaveBeenCalled();

            expect(ctrl.deferred).toBe(false);
            expect(ctrl.defer).not.toHaveBeenCalled();

            ctrl.destroy();
        });

        test('should defer initialization when loading in non-visible sub-frame', async () => {
            setFrameVisibility('hidden');
            jest.spyOn(ctrl, 'defer');

            await ctrl.init();

            expect(mockClientFactory).not.toHaveBeenCalled();
            expect(mockClient.start).not.toHaveBeenCalled();

            expect(ctrl.deferred).toBe(true);
            expect(ctrl.defer).toHaveBeenCalledTimes(1);

            expect(mockObserver.observe).toHaveBeenCalled();
            expect(mockObserver.subscribe).toHaveBeenCalledWith(expect.any(Function));
            ctrl.destroy();
        });

        test('should not create client when loading on hidden sub-frame', async () => {
            setFrameVisibility('hidden');
            await ctrl.init();

            expect(ctrl.deferred).toBe(true);
            expect(mockClientFactory).not.toHaveBeenCalled();
            expect(mockClient.start).not.toHaveBeenCalled();

            expect(mockObserver.observe).toHaveBeenCalled();
            ctrl.destroy();
        });

        test('should handle visibility changes in deferred sub-frame', async () => {
            setFrameVisibility('hidden');
            await ctrl.init();

            expect(ctrl.deferred).toBe(true);
            expect(mockObserver.observe).toHaveBeenCalledTimes(1);

            setFrameVisibility('visible');
            document.dispatchEvent(new Event('visibilitychange'));
            await jest.runAllTimersAsync();
            expect(mockObserver.observe).toHaveBeenCalledTimes(2);

            setFrameVisibility('hidden');
            document.dispatchEvent(new Event('visibilitychange'));
            await jest.runAllTimersAsync();
            expect(mockClient.destroy).toHaveBeenCalled();

            ctrl.destroy();
        });

        test('should correctly process `FRAME_DEFERRED_INIT` when deferred`', async () => {
            setFrameVisibility('hidden');
            const type = WorkerMessageType.FRAME_DEFERRED_INIT;

            const register = jest.spyOn(ctrl.channel, 'register');
            jest.spyOn(ctrl, 'defer');

            await ctrl.init();
            await jest.runAllTimersAsync();
            expect(ctrl.deferred).toBe(true);

            setFrameVisibility('visible');

            const listener = register.mock.calls.find(([m]) => m === type)?.[1];
            listener?.(backgroundMessage({ type }), jest.fn());
            await jest.runAllTimersAsync();

            expect(ctrl.defer).toHaveBeenCalled();
            ctrl.destroy();
        });

        test('should ignore `FRAME_DEFERRED_INIT` when already initialized', async () => {
            setFrameVisibility('visible');
            await ctrl.init();
            await jest.runAllTimersAsync();

            expect(ctrl.instance).toBeTruthy();
            expect(ctrl.deferred).toBe(false);

            const type = WorkerMessageType.FRAME_DEFERRED_INIT;
            const register = jest.spyOn(ctrl.channel, 'register');
            const listener = register.mock.calls.find(([m]) => m === type)?.[1];
            listener?.(backgroundMessage({ type }), jest.fn());

            jest.spyOn(ctrl, 'startImmediate');
            await jest.runAllTimersAsync();

            expect(ctrl.startImmediate).not.toHaveBeenCalled();
            ctrl.destroy();
        });

        test('should clean up deferred subscription on destroy', async () => {
            setFrameVisibility('hidden');
            await ctrl.init();

            expect(ctrl.deferred).toBe(true);
            expect(ctrl.deferredUnsubscribe).toBeDefined();

            const ctrlWithUnsub = ctrl as ClientController & { deferredUnsubscribe: () => void };
            const unsubscribeSpy = jest.spyOn(ctrlWithUnsub, 'deferredUnsubscribe');

            ctrl.destroy();

            expect(unsubscribeSpy).toHaveBeenCalled();
            expect(ctrl.deferredUnsubscribe).toBeUndefined();
        });

        test('should trigger client start on mutation events when deferred', async () => {
            setFrameVisibility('hidden');
            await ctrl.init();

            expect(ctrl.deferred).toBe(true);
            expect(mockObserver.subscribe).toHaveBeenCalled();
            expect(mockClientFactory).not.toHaveBeenCalled();

            const subscribe = mockObserver.subscribe.mock.calls[0][0];
            await subscribe({ type: 'mutation', reason: 'dom-change' });
            await jest.runAllTimersAsync();

            expect(mockClientFactory).toHaveBeenCalled();
            expect(mockClient.start).toHaveBeenCalled();
            expect(ctrl.deferred).toBe(false);
            ctrl.destroy();
        });

        test('should trigger client start on resize when frame becomes visible', async () => {
            setFrameVisibility('hidden');
            await ctrl.init();

            expect(ctrl.deferred).toBe(true);
            expect(mockObserver.subscribe).toHaveBeenCalled();
            expect(mockClientFactory).not.toHaveBeenCalled();

            setFrameVisibility('visible');
            const subscribe = mockObserver.subscribe.mock.calls[0][0];
            await subscribe({ type: 'event', event: { type: 'resize' } as any });
            await jest.runAllTimersAsync();

            expect(mockClientFactory).toHaveBeenCalled();
            expect(mockClient.start).toHaveBeenCalled();
            expect(ctrl.deferred).toBe(false);
            ctrl.destroy();
        });

        test('should not trigger client start on resize when frame remains hidden', async () => {
            setFrameVisibility('hidden');
            await ctrl.init();

            expect(ctrl.deferred).toBe(true);
            expect(mockObserver.subscribe).toHaveBeenCalled();
            expect(mockClientFactory).not.toHaveBeenCalled();

            const subscribe = mockObserver.subscribe.mock.calls[0][0];
            await subscribe({ type: 'event', event: { type: 'resize' } as any });
            await jest.runAllTimersAsync();

            expect(mockClientFactory).not.toHaveBeenCalled();
            expect(mockClient.start).not.toHaveBeenCalled();
            expect(ctrl.deferred).toBe(true);
            ctrl.destroy();
        });
    });

    describe('cleanup', () => {
        test('should clean up all resources on destroy', async () => {
            ctrl = createMockClientController(true);
            const channelDestroy = jest.spyOn(ctrl.channel, 'destroy');

            setFrameVisibility('visible');
            await ctrl.init();
            ctrl.destroy('test-reason');

            expect(mockClient.destroy).toHaveBeenCalledWith({ reason: 'test-reason' });
            expect(mockObserver.destroy).toHaveBeenCalled();
            expect(channelDestroy).toHaveBeenCalled();
            expect(ctrl.instance).toBeNull();
        });
    });
});
