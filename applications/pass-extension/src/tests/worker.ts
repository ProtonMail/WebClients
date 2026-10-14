import type { Runtime } from 'webextension-polyfill';

import type { State } from '@proton/pass/store/types';
import type { TestStateInit } from '@proton/pass/utils/tests/state';
import { createTestState } from '@proton/pass/utils/tests/state';

import { setMockMessageSender } from '../__mocks__/mocks';
import browser from '../__mocks__/webextension-polyfill';
import { WorkerContext } from '../app/worker/context/inject';
import { createAutoFillService } from '../app/worker/services/autofill';

const TEST_TAB_ID = 1;

/** Delivers `tabs.sendMessage` to the `runtime.onMessage` listeners
 * registered in this realm: the content-script frame broker. */
const bridgeTabMessages = () => {
    const listeners = new Set<Runtime.OnMessageListenerCallback>();

    browser.runtime.onMessage.addListener.mockImplementation((listener) => listeners.add(listener));
    browser.runtime.onMessage.removeListener.mockImplementation((listener) => listeners.delete(listener));

    browser.tabs.sendMessage.mockImplementation(
        (_tabId, message) =>
            new Promise((resolve) => {
                let willReply = false;
                listeners.forEach((listener) => {
                    if (listener(message, {} as Runtime.MessageSender, resolve) === true) willReply = true;
                });
                if (!willReply) resolve(undefined);
            })
    );
};

export type TestWorkerInit = { url: string; state?: TestStateInit };

afterEach(() => WorkerContext.clear());

export const setupWorker = ({ url, state: init }: TestWorkerInit) => {
    const state: State = createTestState(init);

    bridgeTabMessages();
    setMockMessageSender(url, TEST_TAB_ID);
    browser.tabs.get.mockResolvedValue({ id: TEST_TAB_ID, url });

    WorkerContext.set({
        ensureReady: jest.fn().mockResolvedValue(undefined),
        getState: jest.fn(() => ({ authorized: true })),
        service: {
            storage: { local: { getItems: jest.fn().mockResolvedValue({}), setItem: jest.fn() } },
            store: { dispatch: jest.fn(), getState: jest.fn(() => state) },
        },
    } as any);

    return { autofill: createAutoFillService(), state };
};
