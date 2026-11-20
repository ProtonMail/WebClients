import { mockHandlers } from '../../app/worker/__mocks__/channel.handlers';
import { errorMessage, resolveMessageResponse } from '../../lib/message/response';
import { sender } from '../sender';

const browser = {
    runtime: {
        getVersion: vi.fn(() => '0.0.1'),
        getURL: vi.fn((asset: string) => `test://${asset}`),
        sendMessage: vi.fn(async (_, message) => {
            const handler = mockHandlers.get(message.type);
            if (handler) {
                try {
                    return resolveMessageResponse(await handler(message, sender));
                } catch (error) {
                    return errorMessage(error instanceof Error ? error.message : undefined);
                }
            }
        }),
        getManifest: () => ({ version: '1.0.0' }),
        requestUpdateCheck: vi.fn().mockResolvedValue(['no_update']),
        onMessage: {
            addListener: vi.fn(),
            removeListener: vi.fn(),
        },
    },
    permissions: {
        request: vi.fn().mockResolvedValue(true),
        contains: vi.fn().mockResolvedValue(true),
        onAdded: { addListener: vi.fn() },
        onRemoved: { addListener: vi.fn() },
    },
    action: {
        setBadgeBackgroundColor: vi.fn().mockResolvedValue(undefined),
        setBadgeText: vi.fn().mockResolvedValue(undefined),
    },
    privacy: {
        services: {
            autofillAddressEnabled: { get: vi.fn(), set: vi.fn() },
            passwordSavingEnabled: { get: vi.fn(), set: vi.fn() },
        },
    },
    alarms: {
        create: vi.fn().mockResolvedValue({}),
        clear: vi.fn().mockResolvedValue(undefined),
        get: vi.fn(),
        onAlarm: { addListener: vi.fn() },
    },
    webNavigation: {
        getAllFrames: vi.fn().mockResolvedValue([]),
        getFrame: vi.fn().mockResolvedValue({}),
    },
    tabs: {
        sendMessage: vi.fn().mockResolvedValue({}),
        query: vi.fn().mockResolvedValue([]),
        get: vi.fn().mockResolvedValue({}),
        onUpdated: {
            addListener: vi.fn(),
        },
        onRemoved: { addListener: vi.fn() },
    },
    webRequest: {
        onBeforeRequest: { addListener: vi.fn() },
        onCompleted: { addListener: vi.fn() },
        onErrorOccurred: { addListener: vi.fn() },
    },
    windows: {
        WINDOW_ID_NONE: -1,
        getLastFocused: vi.fn().mockResolvedValue({ focused: false }),
        onFocusChanged: {
            addListener: vi.fn(),
            removeListener: vi.fn(),
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
    browser.windows.getLastFocused.mockClear();
    browser.windows.onFocusChanged.addListener.mockClear();
    browser.windows.onFocusChanged.removeListener.mockClear();
};

export default browser;
