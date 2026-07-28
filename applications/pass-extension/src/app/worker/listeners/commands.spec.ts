import { triggerTabAutofill } from 'proton-pass-extension/app/worker/services/autofill.trigger';
import { PASS_COMMANDS } from 'proton-pass-extension/lib/extension/commands';

import browser from '@proton/pass/lib/globals/browser';

import { handleExtensionCommand } from './commands';

jest.mock('proton-pass-extension/app/worker/services/autofill.trigger', () => ({
    triggerTabAutofill: jest.fn().mockResolvedValue(true),
}));

const tabsCreate = browser.tabs.create as jest.Mock;
const tabsQuery = browser.tabs.query as jest.Mock;
const triggerAutofill = triggerTabAutofill as jest.Mock;

describe('handleExtensionCommand', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        tabsQuery.mockResolvedValue([{ id: 42 }]);
    });

    test('should open a larger window for the `open-larger-window` command', async () => {
        await handleExtensionCommand(PASS_COMMANDS.LARGER_WINDOW);

        expect(tabsCreate).toHaveBeenCalledWith({ url: 'test://popup.html#' });
        expect(triggerAutofill).not.toHaveBeenCalled();
    });

    test('should trigger autofill on the active tab for the `autofill` command', async () => {
        await handleExtensionCommand(PASS_COMMANDS.AUTOFILL);

        expect(tabsQuery).toHaveBeenCalledWith({ active: true, currentWindow: true });
        expect(triggerAutofill).toHaveBeenCalledWith(42);
        expect(tabsCreate).not.toHaveBeenCalled();
    });

    test('should handle a tab id of `0`', async () => {
        tabsQuery.mockResolvedValue([{ id: 0 }]);
        await handleExtensionCommand(PASS_COMMANDS.AUTOFILL);

        expect(triggerAutofill).toHaveBeenCalledWith(0);
    });

    test('should noop when there is no active tab', async () => {
        tabsQuery.mockResolvedValue([]);
        await handleExtensionCommand(PASS_COMMANDS.AUTOFILL);

        expect(triggerAutofill).not.toHaveBeenCalled();
    });

    test('should noop for unknown commands', async () => {
        await handleExtensionCommand('unknown-command');

        expect(tabsCreate).not.toHaveBeenCalled();
        expect(tabsQuery).not.toHaveBeenCalled();
        expect(triggerAutofill).not.toHaveBeenCalled();
    });
});
