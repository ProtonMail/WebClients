import { waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';

import { useEventManager } from '@proton/components';

import { globalReset } from '../../logic/actions';
import { store } from '../../logic/store';
import { api, clearApiMocks } from './api';
import { addressKeysCache, base64Cache, clearCache } from './cache';
import { clearApiContacts } from './contact';
import { clearApiKeys } from './crypto';
import { eventManagerListeners } from './event-manager';
import { resetHistory } from './render';

export * from './cache';
export * from './crypto';
export * from './render';
export * from './api';
export * from './event-manager';
export * from './message';
export * from './assertion';

const savedConsole = { ...console };

export const clearAll = () => {
    jest.clearAllMocks();
    api.mockClear();
    store.dispatch(globalReset());
    clearApiMocks();
    clearCache();
    clearApiKeys();
    clearApiContacts();
    addressKeysCache.clear();
    base64Cache.clear();
    eventManagerListeners.splice(0, eventManagerListeners.length);
    resetHistory();
    console = { ...savedConsole };
};

export const mockConsole = (level: keyof Console = 'error') => {
    console[level] = jest.fn();
};

export const waitForSpyCall = async (mock: jest.Mock) =>
    act(async () =>
        waitFor(() => expect(mock).toHaveBeenCalled(), {
            interval: 100,
            timeout: 5000,
        })
    );

export const waitForEventManagerCall = async () => {
    // Hard override of the typing as event manager is mocked
    const { call } = (useEventManager as any as () => { call: jest.Mock })();
    await waitForSpyCall(call);
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

export const waitForNotification = (content: string) =>
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
            timeout: 5000,
        }
    );

export const waitForNoNotification = () =>
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
            timeout: 5000,
        }
    );
