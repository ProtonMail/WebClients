import browser, { clearBrowserMocks } from 'proton-pass-extension/__mocks__/webextension-polyfill';
import type { ContentScriptClient } from 'proton-pass-extension/app/content/services/client';
import { backgroundMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { wait } from '@proton/shared/lib/helpers/promise';

import { type ClientController, createClientController } from './client.controller';

const setDocumentVisibility = (state: DocumentVisibilityState) => {
    Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => state,
    });
};

const mockClient = { start: jest.fn(() => Promise.resolve()), destroy: jest.fn() };
const mockClientFactory = jest.fn(() => mockClient as unknown as ContentScriptClient);

describe('Client controller', () => {
    let ctrl: ClientController;
    beforeEach(() => {
        jest.useFakeTimers();

        mockClient.start.mockClear();
        mockClient.destroy.mockClear();
        mockClientFactory.mockClear();
        clearBrowserMocks();

        ctrl = createClientController({ clientFactory: mockClientFactory });
    });

    afterEach(() => jest.useRealTimers());

    test('should create client when loading on visible page', async () => {
        setDocumentVisibility('visible');
        ctrl.init();

        expect(mockClientFactory).toHaveBeenCalled();
        expect(mockClient.start).toHaveBeenCalled();
        ctrl.destroy();
    });

    test('should create client when loading on visible page', async () => {
        setDocumentVisibility('hidden');
        ctrl.init();

        expect(mockClientFactory).not.toHaveBeenCalled();
        expect(mockClient.start).not.toHaveBeenCalled();
        ctrl.destroy();
    });

    test('should handle visibility changes', async () => {
        setDocumentVisibility('visible');
        ctrl.init();

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
        ctrl.init();

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

    test('should destroy on `UNLOAD_CONTENT_SCRIPT`', async () => {
        setDocumentVisibility('visible');
        ctrl.init();

        expect(mockClientFactory).toHaveBeenCalled();
        expect(mockClient.start).toHaveBeenCalled();

        const unloadListener = browser.runtime.onMessage.addListener.mock.calls[0][0];
        const message = backgroundMessage({ type: WorkerMessageType.UNLOAD_CONTENT_SCRIPT });

        /** simulate unload event */
        unloadListener(message);
        expect(mockClient.destroy).toHaveBeenCalled();
        ctrl.destroy();
    });
});
