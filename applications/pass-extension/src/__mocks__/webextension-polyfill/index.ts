import { mockHandlers } from 'proton-pass-extension/__mocks__/app/worker/channel';
import { sender } from 'proton-pass-extension/__mocks__/mocks';
import { errorMessage, resolveMessageResponse } from 'proton-pass-extension/lib/message/response';

const browser = {
    runtime: {
        getVersion: jest.fn(() => '0.0.1'),
        getURL: jest.fn((asset: string) => `test://${asset}`),
        sendMessage: jest.fn(async (_, message) => {
            const handler = mockHandlers.get(message.type);
            if (handler) {
                try {
                    return resolveMessageResponse(await handler(message, sender));
                } catch (error) {
                    return errorMessage(error instanceof Error ? error.message : undefined);
                }
            }
        }),
        getManifest: () => ({}),
        requestUpdateCheck: jest.fn().mockResolvedValue(['no_update']),
        onMessage: {
            addListener: jest.fn(),
            removeListener: jest.fn(),
        },
    },
    permissions: {
        request: jest.fn().mockResolvedValue(true),
        contains: jest.fn().mockResolvedValue(true),
        onAdded: { addListener: jest.fn() },
        onRemoved: { addListener: jest.fn() },
    },
    action: {
        setBadgeBackgroundColor: jest.fn().mockResolvedValue(undefined),
        setBadgeText: jest.fn().mockResolvedValue(undefined),
    },
    privacy: {
        services: {
            autofillAddressEnabled: { get: jest.fn(), set: jest.fn() },
            passwordSavingEnabled: { get: jest.fn(), set: jest.fn() },
        },
    },
    alarms: {
        create: jest.fn().mockResolvedValue({}),
        clear: jest.fn().mockResolvedValue(undefined),
        get: jest.fn(),
        onAlarm: { addListener: jest.fn() },
    },
    webNavigation: {
        getAllFrames: jest.fn().mockResolvedValue([]),
        getFrame: jest.fn().mockResolvedValue({}),
    },
    tabs: {
        sendMessage: jest.fn().mockResolvedValue({}),
        query: jest.fn().mockResolvedValue([]),
        get: jest.fn().mockResolvedValue({}),
        onUpdated: {
            addListener: jest.fn(),
        },
    },
};

export const clearBrowserMocks = () => {
    browser.runtime.getURL.mockClear();
    browser.runtime.sendMessage.mockClear();
    browser.runtime.requestUpdateCheck.mockClear();
    browser.runtime.onMessage.addListener.mockClear();
    browser.runtime.onMessage.removeListener.mockClear();
    browser.permissions.request.mockClear();
    browser.permissions.contains.mockClear();
    browser.permissions.onAdded.addListener.mockClear();
    browser.permissions.onRemoved.addListener.mockClear();
    browser.action.setBadgeBackgroundColor.mockClear();
    browser.action.setBadgeText.mockClear();
    browser.privacy.services.autofillAddressEnabled.get.mockClear();
    browser.privacy.services.autofillAddressEnabled.set.mockClear();
    browser.privacy.services.passwordSavingEnabled.get.mockClear();
    browser.privacy.services.passwordSavingEnabled.set.mockClear();
    browser.alarms.create.mockClear();
    browser.alarms.clear.mockClear();
    browser.alarms.get.mockClear();
    browser.alarms.onAlarm.addListener.mockClear();
    browser.webNavigation.getAllFrames.mockClear();
    browser.webNavigation.getFrame.mockClear();
    browser.tabs.sendMessage.mockClear();
    browser.tabs.query.mockClear();
    browser.tabs.get.mockClear();
    browser.tabs.onUpdated.addListener.mockClear();
};

export default browser;
