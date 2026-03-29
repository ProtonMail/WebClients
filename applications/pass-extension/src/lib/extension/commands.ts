import browser from '@proton/pass/lib/globals/browser';
import noop from '@proton/utils/noop';

import { backgroundMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

export type Shortcut = { name: string; description: string; shortcut: string };

type BrowserCommand = Awaited<ReturnType<typeof browser.commands.getAll>>[number];

export const resolveShortcuts = (commands: BrowserCommand[], supported: Record<string, string>): Shortcut[] =>
    commands
        .filter((cmd): cmd is BrowserCommand & { name: string } => Boolean(cmd.name && cmd.name in supported))
        .map(({ name, shortcut }) => ({ name, shortcut: shortcut ?? '', description: supported[name] }));

export const handleExtensionCommand = async (command: string) => {
    if (command === 'open-larger-window') {
        browser.tabs
            .create({
                url: browser.runtime.getURL('popup.html#'),
            })
            .catch(noop);
    }

    if (command === 'autofill') {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
            browser.tabs.sendMessage(tab.id, backgroundMessage({ type: WorkerMessageType.AUTOFILL_TRIGGER })).catch(noop);
        }
    }
};
