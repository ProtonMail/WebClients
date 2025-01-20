import browser, { clearBrowserMocks } from 'proton-pass-extension/__mocks__/webextension-polyfill';

import { backgroundMessage } from '@proton/pass/lib/extension/message/send-message';
import { WorkerMessageType } from '@proton/pass/types';

import * as client from './client';
import { createContentScriptClient } from './services/script';

const setDocumentVisibility = (state: DocumentVisibilityState) => {
    Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => state,
    });
};

const mockClient = { start: jest.fn(() => Promise.resolve()), destroy: jest.fn() };
const mockElements = { root: 'test', control: 'test' };

jest.mock('./services/script', () => ({ createContentScriptClient: jest.fn(() => mockClient) }));
const registerCustomElementsMock = jest.fn(async () => mockElements);
const createContentScriptClientMock = createContentScriptClient as jest.Mock;

describe('Client content-script runner', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockClient.start.mockClear();
        mockClient.destroy.mockClear();
        createContentScriptClientMock.mockClear();
        registerCustomElementsMock.mockClear();
        clearBrowserMocks();
    });

    afterEach(() => jest.useRealTimers());

    test('should create client when loading on visible page', async () => {
        setDocumentVisibility('visible');
        const { destroyClient } = await client.run(registerCustomElementsMock);

        expect(registerCustomElementsMock).toHaveBeenCalled();
        expect(createContentScriptClient).toHaveBeenCalled();
        expect(mockClient.start).toHaveBeenCalled();

        destroyClient();
    });

    test('should create client when loading on visible page', async () => {
        setDocumentVisibility('hidden');
        const { destroyClient } = await client.run(registerCustomElementsMock);

        expect(registerCustomElementsMock).toHaveBeenCalled();
        expect(createContentScriptClient).not.toHaveBeenCalled();

        destroyClient();
    });

    test('should handle visibility changes', async () => {
        setDocumentVisibility('visible');
        const { destroyClient } = await client.run(registerCustomElementsMock);

        expect(registerCustomElementsMock).toHaveBeenCalled();
        expect(createContentScriptClient).toHaveBeenCalled();
        expect(mockClient.start).toHaveBeenCalled();

        registerCustomElementsMock.mockClear();
        createContentScriptClientMock.mockClear();

        setDocumentVisibility('hidden');
        document.dispatchEvent(new Event('visibilitychange'));

        expect(registerCustomElementsMock).not.toHaveBeenCalled();
        expect(createContentScriptClient).not.toHaveBeenCalled();
        expect(mockClient.destroy).toHaveBeenCalled();

        setDocumentVisibility('visible');
        document.dispatchEvent(new Event('visibilitychange'));

        expect(registerCustomElementsMock).not.toHaveBeenCalled();
        expect(createContentScriptClient).toHaveBeenCalled();

        destroyClient();
    });

    test('should destroy on `UNLOAD_CONTENT_SCRIPT`', async () => {
        setDocumentVisibility('visible');
        const { destroyClient } = await client.run(registerCustomElementsMock);

        expect(registerCustomElementsMock).toHaveBeenCalled();
        expect(createContentScriptClient).toHaveBeenCalled();
        expect(mockClient.start).toHaveBeenCalled();
        registerCustomElementsMock.mockClear();
        createContentScriptClientMock.mockClear();

        const unloadListener = browser.runtime.onMessage.addListener.mock.calls[0][0];
        const message = backgroundMessage({ type: WorkerMessageType.UNLOAD_CONTENT_SCRIPT });

        /** simulate unload event */
        unloadListener(message);
        expect(mockClient.destroy).toHaveBeenCalled();

        destroyClient();
    });
});
