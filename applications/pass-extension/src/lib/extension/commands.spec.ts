import { handleExtensionCommand } from './commands';
import browser from '@proton/pass/lib/globals/browser';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

jest.mock('@proton/pass/lib/globals/browser', () => ({
    tabs: {
        create: jest.fn(() => Promise.resolve()),
        query: jest.fn(() => Promise.resolve([{ id: 42 }])),
        sendMessage: jest.fn(() => Promise.resolve()),
    },
    runtime: {
        getURL: jest.fn((path: string) => `chrome-extension://abc/${path}`),
    },
    commands: {
        getAll: jest.fn(() => Promise.resolve([])),
    },
}));

describe('handleExtensionCommand', () => {
    beforeEach(() => jest.clearAllMocks());

    it('should open larger window for open-larger-window command', async () => {
        await handleExtensionCommand('open-larger-window');
        expect(browser.tabs.create).toHaveBeenCalledWith({
            url: 'chrome-extension://abc/popup.html#',
        });
    });

    it('should send AUTOFILL_TRIGGER to active tab for autofill command', async () => {
        await handleExtensionCommand('autofill');
        expect(browser.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
        expect(browser.tabs.sendMessage).toHaveBeenCalledWith(
            42,
            expect.objectContaining({ type: WorkerMessageType.AUTOFILL_TRIGGER })
        );
    });

    it('should send message when tab id is 0', async () => {
        (browser.tabs.query as jest.Mock).mockResolvedValueOnce([{ id: 0 }]);
        await handleExtensionCommand('autofill');
        expect(browser.tabs.sendMessage).toHaveBeenCalledWith(
            0,
            expect.objectContaining({ type: WorkerMessageType.AUTOFILL_TRIGGER })
        );
    });

    it('should not send message when no active tab', async () => {
        (browser.tabs.query as jest.Mock).mockResolvedValueOnce([]);
        await handleExtensionCommand('autofill');
        expect(browser.tabs.sendMessage).not.toHaveBeenCalled();
    });

    it('should do nothing for unknown commands', async () => {
        await handleExtensionCommand('unknown-command');
        expect(browser.tabs.create).not.toHaveBeenCalled();
        expect(browser.tabs.sendMessage).not.toHaveBeenCalled();
    });
});
