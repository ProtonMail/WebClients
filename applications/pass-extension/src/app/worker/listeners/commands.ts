import { triggerTabAutofill } from 'proton-pass-extension/app/worker/services/autofill.trigger';
import { PASS_COMMANDS } from 'proton-pass-extension/lib/extension/commands';

import browser from '@proton/pass/lib/globals/browser';

/** `browser.commands.onCommand` listener, registered from `worker/index.ts`. Lives
 * under `app/worker` so `lib/extension/commands` — imported by the settings shortcuts
 * panel — stays free of the worker context graph. */
export const handleExtensionCommand = async (command: string): Promise<void> => {
    try {
        switch (command) {
            case PASS_COMMANDS.LARGER_WINDOW:
                await browser.tabs.create({ url: browser.runtime.getURL('popup.html#') });
                break;

            case PASS_COMMANDS.AUTOFILL: {
                const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
                /** `tab.id` may legitimately be `0` : check for `undefined` explicitly */
                if (tab?.id === undefined) return;
                /** Throws synchronously if the worker context is not initialized yet */
                await triggerTabAutofill(tab.id);
                break;
            }
        }
    } catch {
        /** Registered as an event listener : never surface an unhandled rejection */
    }
};
