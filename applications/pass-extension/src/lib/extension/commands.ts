import type browser from '@proton/pass/lib/globals/browser';

/** Command names as declared under the `commands` key of `manifest-chrome.json` and
 * `manifest-firefox.json`. Shared by the worker's `onCommand` listener and the settings
 * shortcut list so neither can drift from the manifests. NOTE: Safari declares no
 * `commands` key — see the `BUILD_TARGET` guard in `worker/index.ts`. */
export const PASS_COMMANDS = {
    EXECUTE_ACTION: '_execute_action',
    LARGER_WINDOW: 'open-larger-window',
    AUTOFILL: 'autofill',
} as const;

export type Shortcut = { name: string; description: string; shortcut: string };

type BrowserCommand = Awaited<ReturnType<typeof browser.commands.getAll>>[number];

export const resolveShortcuts = (commands: BrowserCommand[], supported: Record<string, string>): Shortcut[] =>
    commands
        .filter((cmd): cmd is BrowserCommand & { name: string } => Boolean(cmd.name && cmd.name in supported))
        .map(({ name, shortcut }) => ({ name, shortcut: shortcut ?? '', description: supported[name] }));
