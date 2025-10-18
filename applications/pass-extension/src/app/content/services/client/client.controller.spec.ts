import browser, { clearBrowserMocks } from 'proton-pass-extension/__mocks__/webextension-polyfill';
import type {
    ContentScriptClient,
    ContentScriptClientFactoryOptions,
} from 'proton-pass-extension/app/content/services/client/client';
import { createClientObserver } from 'proton-pass-extension/app/content/services/client/client.observer';
import { backgroundMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { wait } from '@proton/shared/lib/helpers/promise';

import { type ClientController, createClientController } from './client.controller';

const TEST_SCRIPT_ID = 'test-script-id';

jest.mock('proton-pass-extension/app/content/services/client/client.observer');

const mockCreatePageObserver = createClientObserver as jest.MockedFunction<typeof createClientObserver>;
const mockObserver = { observe: jest.fn(), destroy: jest.fn(), subscribe: jest.fn() };
const mockClient = { context: {} as any, start: jest.fn(() => Promise.resolve()), destroy: jest.fn() };
const mockClientFactory = jest.fn((_: ContentScriptClientFactoryOptions) => mockClient as ContentScriptClient);
const elements = { root: 'pass-root-test', control: 'pass-control-test' };

const setDocumentVisibility = (state: DocumentVisibilityState) => {
    Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => state,
    });
};

const createMockClientController = (mainFrame: boolean) =>
    createClientController({
        clientFactory: mockClientFactory,
        elements,
        scriptId: TEST_SCRIPT_ID,
        mainFrame,
    });

describe('Client controller', () => {
    let ctrl: ClientController;

    beforeEach(() => {
        jest.useFakeTimers();

        mockClient.start.mockClear();
        mockClient.destroy.mockClear();
        mockClientFactory.mockClear();
        mockObserver.observe.mockClear();
        mockObserver.destroy.mockClear();
        mockObserver.subscribe.mockClear();
        clearBrowserMocks();

        mockCreatePageObserver.mockReturnValue(mockObserver);
    });

    afterEach(() => jest.useRealTimers());

    describe('initialization', () => {
        test('should register `UNLOAD_CONTENT_SCRIPT handler`', async () => {
            ctrl = createMockClientController(true);

            setDocumentVisibility('visible');
            await ctrl.init();

            const unloadListener = browser.runtime.onMessage.addListener.mock.calls[0][0];
            const message = backgroundMessage({ type: WorkerMessageType.UNLOAD_CONTENT_SCRIPT });

            unloadListener(message);
            expect(mockClient.destroy).toHaveBeenCalled();
            ctrl.destroy();
        });

        test('should register `FRAME_QUERY` handler', async () => {
            ctrl = createMockClientController(true);
            const channelRegister = jest.spyOn(ctrl.channel, 'register');

            setDocumentVisibility('visible');
            await ctrl.init();

            expect(channelRegister).toHaveBeenCalledWith(WorkerMessageType.FRAME_QUERY, expect.any(Function));
            ctrl.destroy();
        });
    });

    describe('main frame', () => {
        beforeEach(() => {
            ctrl = createMockClientController(true);
        });

        test('should create client when loading on visible page', async () => {
            setDocumentVisibility('visible');
            await ctrl.init();

            expect(mockClientFactory).toHaveBeenCalled();
            expect(mockClient.start).toHaveBeenCalled();
            expect(ctrl.deferred).toBe(false);
            ctrl.destroy();
        });

        test('should not create client when loading on hidden page', async () => {
            setDocumentVisibility('hidden');
            await ctrl.init();

            expect(mockClientFactory).not.toHaveBeenCalled();
            expect(mockClient.start).not.toHaveBeenCalled();
            expect(ctrl.deferred).toBe(false);
            ctrl.destroy();
        });

        test('should handle visibility changes', async () => {
            setDocumentVisibility('visible');
            await ctrl.init();

            expect(mockClientFactory).toHaveBeenCalled();
            expect(mockClient.start).toHaveBeenCalled();

            mockClientFactory.mockClear();

            setDocumentVisibility('hidden');
            document.dispatchEvent(new Event('visibilitychange'));

            expect(mockClientFactory).not.toHaveBeenCalled();
            expect(mockClient.destroy).toHaveBeenCalled();

            setDocumentVisibility('visible');
            document.dispatchEvent(new Event('visibilitychange'));

            await jest.advanceTimersByTimeAsync(350);

            expect(mockClientFactory).toHaveBeenCalled();
            ctrl.destroy();
        });

        test('should debounce quick visibility changes', async () => {
            setDocumentVisibility('visible');
            await ctrl.init();

            expect(mockClientFactory).toHaveBeenCalledTimes(1);

            for (let i = 0; i < 15; i++) {
                const hide = wait(25).then(() => {
                    setDocumentVisibility('hidden');
                    document.dispatchEvent(new Event('visibilitychange'));
                });

                await jest.advanceTimersByTimeAsync(25);
                await hide;

                const show = wait(25).then(() => {
                    setDocumentVisibility('visible');
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
    });

    describe('sub-frame', () => {
        const docMock = { childElementCount: 1, clientHeight: 100, clientWidth: 100 };

        beforeEach(() => {
            Object.defineProperty(document, 'documentElement', {
                configurable: true,
                get: () => docMock,
            });

            ctrl = createMockClientController(false);
        });

        test('should defer initialization when loading on visible sub-frame', async () => {
            setDocumentVisibility('visible');
            await ctrl.init();

            expect(mockClientFactory).not.toHaveBeenCalled();
            expect(mockClient.start).not.toHaveBeenCalled();
            expect(ctrl.deferred).toBe(true);
            expect(mockObserver.observe).toHaveBeenCalled();
            expect(mockObserver.subscribe).toHaveBeenCalledWith(expect.any(Function), { once: true });
            ctrl.destroy();
        });

        test('should start client when observer detects activity', async () => {
            setDocumentVisibility('visible');
            await ctrl.init();

            expect(ctrl.deferred).toBe(true);
            expect(mockObserver.subscribe).toHaveBeenCalled();

            const subscribeCallback = mockObserver.subscribe.mock.calls[0][0];
            subscribeCallback('test-trigger');

            expect(mockClientFactory).toHaveBeenCalled();
            expect(mockClient.start).toHaveBeenCalled();
            expect(ctrl.deferred).toBe(false);
            ctrl.destroy();
        });

        test('should not create client when loading on hidden sub-frame', async () => {
            setDocumentVisibility('hidden');
            await ctrl.init();

            expect(ctrl.deferred).toBe(true);
            expect(mockClientFactory).not.toHaveBeenCalled();
            expect(mockClient.start).not.toHaveBeenCalled();

            expect(mockObserver.observe).toHaveBeenCalled();
            ctrl.destroy();
        });

        test('should handle visibility changes in deferred sub-frame', async () => {
            setDocumentVisibility('hidden');
            await ctrl.init();

            expect(ctrl.deferred).toBe(true);
            expect(mockObserver.observe).toHaveBeenCalledTimes(1);

            setDocumentVisibility('visible');
            document.dispatchEvent(new Event('visibilitychange'));
            expect(mockObserver.observe).toHaveBeenCalledTimes(2);

            setDocumentVisibility('hidden');
            document.dispatchEvent(new Event('visibilitychange'));

            expect(mockClient.destroy).not.toHaveBeenCalled();
            ctrl.destroy();
        });

        test('should defer if sub-frame has no content', async () => {
            docMock.childElementCount = 0;

            setDocumentVisibility('visible');
            await ctrl.init();

            expect(ctrl.deferred).toBe(true);
            expect(mockClientFactory).not.toHaveBeenCalled();
            expect(mockObserver.observe).toHaveBeenCalled();
            ctrl.destroy();
        });
    });

    describe('cleanup', () => {
        test('should clean up all resources on destroy', async () => {
            ctrl = createMockClientController(true);
            const channelDestroy = jest.spyOn(ctrl.channel, 'destroy');

            setDocumentVisibility('visible');
            await ctrl.init();
            ctrl.destroy('test-reason');

            expect(mockClient.destroy).toHaveBeenCalledWith({ reason: 'test-reason' });
            expect(mockObserver.destroy).toHaveBeenCalled();
            expect(channelDestroy).toHaveBeenCalled();
            expect(ctrl.instance).toBeNull();
        });
    });
});
