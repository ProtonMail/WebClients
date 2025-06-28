import { act, waitFor } from '@testing-library/react';

import { useEventManager } from '@proton/components';

import { api, clearApiMocks } from './api';
import { base64Cache, clearCache } from './cache';
import { clearApiContacts } from './contact';
import { clearApiKeys } from './crypto';
import { eventManagerListeners } from './event-manager';

export * from './api';
export * from './assertion';
export * from './cache';
export * from './crypto';
export * from './event-manager';
export * from './message';
export * from './render';

const savedConsole = { ...console };

export const clearAll = () => {
    jest.clearAllMocks();
    api.mockClear();
    //store.dispatch(globalReset());
    clearApiMocks();
    clearCache();
    clearApiKeys();
    clearApiContacts();
    base64Cache.clear();
    eventManagerListeners.splice(0, eventManagerListeners.length);
    console = { ...savedConsole };
};

export const mockConsole = (level: keyof Console = 'error') => {
    console[level] = jest.fn();
};

export const waitForSpyCall = async <T = Promise<unknown>, Y extends any[] = []>({
    spy,
    callTimes,
    disableFakeTimers = false,
}: {
    spy: jest.Mock<T, Y>;
    /** Expected number of calls (defaults to >= 1) */
    callTimes?: number;
    /**
     * If fake timers are being used, they need to be temporarily disabled for the `waitFor` timeout to work if the CryptoProxy
     * is being used with a non-mocked CryptoApi.
     * This is because the fake timers meddle with Promise resolution/process ticks to speed up the app time,
     * but SubtleCrypto is normally unaffected as it usually runs in a separate, non-JS process, meaning its
     * operations will run in "real time" and timeout as a result.
     * NB: the fake timers are re-enabled before returning.
     */
    disableFakeTimers?: boolean;
}) => {
    if (disableFakeTimers) {
        act(() => {
            jest.runOnlyPendingTimers();
            jest.useRealTimers();
        });
    }

    try {
        await waitFor(
            async () => (callTimes ? expect(spy).toHaveBeenCalledTimes(callTimes) : expect(spy).toHaveBeenCalled()),
            { timeout: 10000 }
        );
    } finally {
        if (disableFakeTimers) {
            jest.useFakeTimers();
        }
    }
};

export const waitForEventManagerCall = async () => {
    // Hard override of the typing as event manager is mocked
    const { call } = (useEventManager as any as () => { call: jest.Mock })();
    await waitForSpyCall({ spy: call });
};

export const getModal = () => {
    const modal =
        (document.querySelector('dialog[aria-modal="true"]') as HTMLDialogElement | null) ||
        (document.querySelector('div[class="modal"]') as HTMLDialogElement | null);

    if (!modal) {
        throw new Error('No modal was on screen');
    }

    const submit = modal.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    const cancel = modal.querySelector('button[type="reset"]') as HTMLButtonElement | null;
    const close = modal.querySelector('button.modal-close') as HTMLButtonElement | null;

    return { modal, submit, cancel, close };
};

export const getDropdown = () =>
    waitFor(
        () => {
            const dropdown = document.querySelector('div[role="dialog"].dropdown') as HTMLDialogElement | null;
            if (!dropdown) {
                throw new Error('No dropdown was on screen');
            }
            return dropdown;
        },
        {
            interval: 100,
            timeout: 5000,
        }
    );

export const waitForNotification = (content: string, timeout = 8000) =>
    waitFor(
        () => {
            const notifications = document.querySelectorAll('div[role="alert"].notification');
            const matchingNotification = [...notifications].find((notification) =>
                notification.textContent?.includes(content)
            );
            if (matchingNotification) {
                return matchingNotification;
            }
            throw new Error(`Notification not found with "${content}"`);
        },
        {
            interval: 100,
            timeout,
        }
    );

export const waitForNoNotification = (timeout = 8000) =>
    waitFor(
        () => {
            const notifications = document.querySelectorAll('div[role="alert"].notification:not(.notification--out)');
            if (notifications.length === 0) {
                return;
            }
            const matchingNotification = [...notifications].map((notification) => notification.textContent);
            throw new Error(`Notification still present with "${matchingNotification.join(', ')}"`);
        },
        {
            interval: 100,
            timeout,
        }
    );
export { parseDOMStringToBodyElement } from '@proton/mail/helpers/parseDOMStringToBodyElement';
