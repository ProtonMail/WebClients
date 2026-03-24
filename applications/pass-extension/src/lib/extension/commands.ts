import browser from '@proton/pass/lib/globals/browser';
import noop from '@proton/utils/noop';

export type Shortcut = { name: string; description: string; shortcut: string };

type BrowserCommand = Awaited<ReturnType<typeof browser.commands.getAll>>[number];

export const resolveShortcuts = (commands: BrowserCommand[], supported: Record<string, string>): Shortcut[] =>
    commands
        .filter((cmd): cmd is BrowserCommand & { name: string } => Boolean(cmd.name && cmd.name in supported))
        .map(({ name, shortcut }) => ({ name, shortcut: shortcut ?? '', description: supported[name] }));

export const handleExtensionCommand = (command: string) => {
    if (command === 'open-larger-window') {
        browser.windows
            .create({
                url: browser.runtime.getURL('popup.html#'),
                type: 'popup',
                focused: true,
            })
            .catch(noop);
    }
};
