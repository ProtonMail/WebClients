import { act } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import { useEventManager } from 'react-components';
import { ELEMENTS_CACHE_KEY } from '../../hooks/mailbox/useElementsCache';
import {
    clearCache,
    messageCache,
    conversationCache,
    cache,
    attachmentsCache,
    addressKeysCache,
    base64Cache,
    clearContactCache,
} from './cache';
import { api, clearApiMocks } from './api';
import { eventManagerListeners } from './event-manager';
import { clearApiKeys } from './crypto';
import { clearApiContacts } from './contact';
import { resetHistory } from './render';

export * from './cache';
export * from './crypto';
export * from './render';
export * from './api';
export * from './event-manager';
export * from './message';
export * from './assertion';

export const clearAll = () => {
    jest.clearAllMocks();
    api.mockClear();
    clearApiMocks();
    clearCache();
    clearApiKeys();
    clearApiContacts();
    messageCache.clear();
    conversationCache.clear();
    attachmentsCache.clear();
    addressKeysCache.clear();
    base64Cache.clear();
    cache.delete(ELEMENTS_CACHE_KEY);
    eventManagerListeners.splice(0, eventManagerListeners.length);
    clearContactCache();
    resetHistory();
};

export const waitForSpyCall = async (mock: jest.Mock) =>
    act(async () => waitFor(() => expect(mock).toHaveBeenCalled()));

export const waitForEventManagerCall = async () => {
    // Hard override of the typing as event manager is mocked
    const { call } = ((useEventManager as any) as () => { call: jest.Mock })();
    await waitForSpyCall(call);
};

export const getModal = () => {
    const modal = document.querySelector('dialog[aria-modal="true"]') as HTMLDialogElement | null;

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
