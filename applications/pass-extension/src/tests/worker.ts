import type { Runtime } from 'webextension-polyfill';

import type { State } from '@proton/pass/store/types';
import type { TestStateInit } from '@proton/pass/utils/tests/state';
import { createTestState } from '@proton/pass/utils/tests/state';

import { setMockMessageSender } from '../__mocks__/mocks';
import browser from '../__mocks__/webextension-polyfill';
import { WorkerContext } from '../app/worker/context/inject';
import { createAutoFillService } from '../app/worker/services/autofill';
import { createAutoSaveService } from '../app/worker/services/autosave';
import { createFormTrackerService } from '../app/worker/services/form.tracker';
import { parseSender } from '../lib/utils/sender';

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

/** `storage` stands in for the worker's `storage.local`, read by the autofill service on init */
export type TestWorkerInit = { url: string; state?: TestStateInit; storage?: Record<string, string> };

afterEach(() => WorkerContext.clear());

export const setupWorker = ({ url, state: init, storage = {} }: TestWorkerInit) => {
    const state: State = createTestState(init);

    bridgeTabMessages();
    setMockMessageSender(url, TEST_TAB_ID);
    browser.tabs.get.mockResolvedValue({ id: TEST_TAB_ID, url });
    browser.webNavigation.getAllFrames.mockResolvedValue([{ frameId: 0, parentFrameId: -1, url }]);

    const autosave = createAutoSaveService();
    const formTracker = createFormTrackerService();

    WorkerContext.set({
        ensureReady: jest.fn().mockResolvedValue(undefined),
        getState: jest.fn(() => ({ authorized: true })),
        service: {
            autosave,
            formTracker,
            storage: { local: { getItems: jest.fn().mockResolvedValue(storage), setItem: jest.fn() } },
            store: { dispatch: jest.fn(), getState: jest.fn(() => state) },
        },
    } as any);

    return { autofill: createAutoFillService(), autosave, formTracker, state };
};

/** The tab now shows `url`, as after a form submit navigation */
export const navigateTab = (url: string) => {
    setMockMessageSender(url, TEST_TAB_ID);
    browser.tabs.get.mockResolvedValue({ id: TEST_TAB_ID, url });
};

/** Form submission the worker tracks for the tab while it shows `url` */
export const getTabSubmission = async (formTracker: ReturnType<typeof createFormTrackerService>, url: string) => {
    const { tabId, url: components } = await parseSender({
        tab: { id: TEST_TAB_ID, url },
        url,
        frameId: 0,
    } as Runtime.MessageSender);
    return formTracker.get(tabId, components);
};
