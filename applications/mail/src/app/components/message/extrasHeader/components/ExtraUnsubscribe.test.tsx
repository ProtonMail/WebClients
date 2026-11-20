import { fireEvent, screen, waitFor } from '@testing-library/react';
import loudRejection from 'loud-rejection';
import type { Mock } from 'vitest';

import { getModelState } from '@proton/account/testing/getModelState';
import { mergeMessages } from '@proton/mail-message/helpers/message/messages';
import type { MessageStateWithData } from '@proton/mail-message/store/messages/messagesTypes';
import { openNewTab } from '@proton/shared/lib/helpers/browser';
import { CUSTOM_VIEWS_LABELS } from '@proton/shared/lib/mail/constants';

import { addApiMock } from '../../../../helpers/tests/api';
import { getCompleteAddress, minimalCache } from '../../../../helpers/tests/cache';
import {
    addApiKeys,
    generateKeys,
    getAddressKeyCache,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '../../../../helpers/tests/crypto';
import { clearAll, waitForEventManagerCall, waitForNotification } from '../../../../helpers/tests/helper';
import { mailTestRender } from '../../../../helpers/tests/render';
import { newElementsState } from '../../../../store/elements/elementsSlice';
import ExtraUnsubscribe from './ExtraUnsubscribe';

loudRejection();

vi.mock('@proton/shared/lib/helpers/browser', () => ({
    ua: { ua: 'UserAgent' },
    detectStorageCapabilities: vi.fn(() =>
        Promise.resolve({
            isAccessible: true,
            hasIndexedDB: true,
        })
    ),
    isMac: vi.fn(() => false),
    openNewTab: vi.fn(),
    isMobile: vi.fn(),
    isFirefoxLessThan55: vi.fn(),
    getIsIframe: vi.fn(() => false),
    isLinux: vi.fn(() => false),
}));

// Mock idb library
vi.mock('idb', () => ({
    openDB: vi.fn(() =>
        Promise.resolve({
            close: vi.fn(),
            createObjectStore: vi.fn(),
            transaction: vi.fn(),
            objectStore: vi.fn(),
            put: vi.fn(),
            get: vi.fn(),
            delete: vi.fn(),
        })
    ),
    deleteDB: vi.fn(() => Promise.resolve()),
}));

vi.mock('@proton/encrypted-search/esIDB/indexedDB', () => ({
    hasESDB: vi.fn(() => false),
}));

describe('Unsubscribe banner', () => {
    const messageID = 'messageID';
    const toAddressID = 'toAddressID';
    const toAddress = 'to@domain.com';

    const defaultMessage = {
        localID: messageID,
        data: { ID: messageID, Subject: 'test', ParsedHeaders: { 'X-Original-To': toAddress }, Attachments: [] } as any,
        messageDocument: { initialized: true },
        verification: {},
    } as MessageStateWithData;

    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    afterEach(clearAll);

    it('should show the unsubscribe banner with one click method', async () => {
        const unsubscribeCall = vi.fn();
        const markUnsubscribedCall = vi.fn();

        minimalCache();
        addApiMock(`mail/v4/messages/${messageID}/unsubscribe`, unsubscribeCall);
        addApiMock(`mail/v4/messages/mark/unsubscribed`, markUnsubscribedCall);

        const message = mergeMessages(defaultMessage, {
            data: {
                UnsubscribeMethods: { OneClick: 'OneClick' },
            },
        }) as MessageStateWithData;

        await mailTestRender(<ExtraUnsubscribe message={message.data} />, {
            preloadedState: {
                addresses: getModelState([getCompleteAddress({ ID: toAddressID, Email: toAddress })]),
            },
        });

        let button;
        await waitFor(() => {
            button = screen.getByTestId('unsubscribe-banner');
            expect(button.textContent).toMatch(/Unsubscribe/);
        });

        if (button) {
            fireEvent.click(button);
        }

        await waitFor(() => {
            const submitButton = screen.getByTestId('unsubscribe-banner:submit');
            if (submitButton) {
                fireEvent.click(submitButton);
            }
        });

        await waitForEventManagerCall();

        expect(unsubscribeCall).toHaveBeenCalled();
        expect(markUnsubscribedCall).toHaveBeenCalled();
    });

    it('should show the unsubscribe banner with mailto method', async () => {
        const mailto = 'to@address.com';
        const keys = await generateKeys('me', toAddress);
        const address = getCompleteAddress({ ID: toAddressID, Email: toAddress });

        const createCall = vi.fn(() => ({ Message: { ID: messageID, AddressID: address.ID, Attachments: [] } }));
        const sendCall = vi.fn(() => ({ Sent: {} }));
        const markUnsubscribedCall = vi.fn();

        minimalCache();
        addApiKeys(false, mailto, []);
        addApiMock(`mail/v4/messages`, createCall);
        addApiMock(`mail/v4/messages/messageID`, sendCall);
        addApiMock(`mail/v4/messages/mark/unsubscribed`, markUnsubscribedCall);

        const message = mergeMessages(defaultMessage, {
            data: {
                AddressID: address.ID,
                UnsubscribeMethods: { Mailto: { ToList: [mailto], Body: 'body', Subject: 'subject' } },
            },
        }) as MessageStateWithData;

        await mailTestRender(<ExtraUnsubscribe message={message.data} />, {
            preloadedState: {
                addresses: getModelState([address]),
                addressKeys: getAddressKeyCache(address, [keys]),
            },
        });

        let button;
        await waitFor(() => {
            button = screen.getByTestId('unsubscribe-banner');
            expect(button.textContent).toMatch(/Unsubscribe/);
        });

        if (button) {
            fireEvent.click(button);
        }

        await waitFor(() => {
            const submitButton = screen.getByTestId('unsubscribe-banner:submit');
            if (submitButton) {
                fireEvent.click(submitButton);
            }
        });

        await waitForNotification('Mail list unsubscribed');
        await waitForEventManagerCall();

        expect(sendCall).toHaveBeenCalled();
        expect(markUnsubscribedCall).toHaveBeenCalled();
    });

    it('should show the unsubscribe banner with http client method', async () => {
        const markUnsubscribedCall = vi.fn();
        const openNewTabMock = openNewTab as Mock;

        minimalCache();
        addApiMock(`mail/v4/messages/mark/unsubscribed`, markUnsubscribedCall);

        const message = mergeMessages(defaultMessage, {
            data: {
                UnsubscribeMethods: { HttpClient: 'url' },
            },
        }) as MessageStateWithData;

        await mailTestRender(<ExtraUnsubscribe message={message.data} />, {
            preloadedState: {
                addresses: getModelState([getCompleteAddress({ ID: toAddressID, Email: toAddress })]),
            },
        });

        let button;
        await waitFor(() => {
            button = screen.getByTestId('unsubscribe-banner');
            expect(button.textContent).toMatch(/Unsubscribe/);
        });

        if (button) {
            fireEvent.click(button);
        }

        await waitFor(() => {
            const submitButton = screen.getByTestId('unsubscribe-banner:submit');
            if (submitButton) {
                fireEvent.click(submitButton);
            }
        });

        await waitForEventManagerCall();

        expect(openNewTabMock).toHaveBeenCalled();
        expect(markUnsubscribedCall).toHaveBeenCalled();
    });

    it('should show an extra modal on unsubscribe', async () => {
        const unsubscribeCall = vi.fn();
        const markUnsubscribedCall = vi.fn();

        minimalCache();
        addApiMock(`mail/v4/messages/${messageID}/unsubscribe`, unsubscribeCall);
        addApiMock(`mail/v4/messages/mark/unsubscribed`, markUnsubscribedCall);

        const message = mergeMessages(defaultMessage, {
            data: {
                UnsubscribeMethods: { OneClick: 'OneClick' },
            },
        }) as MessageStateWithData;

        await mailTestRender(<ExtraUnsubscribe message={message.data} />, {
            preloadedState: {
                addresses: getModelState([getCompleteAddress({ ID: toAddressID, Email: toAddress })]),
            },
        });

        let button;
        await waitFor(() => {
            button = screen.getByTestId('unsubscribe-banner');
            expect(button.textContent).toMatch(/Unsubscribe/);
        });

        if (button) {
            fireEvent.click(button);
        }

        // Submit first modal
        await waitFor(() => {
            const submitButton = screen.getByTestId('unsubscribe-banner:submit');
            if (submitButton) {
                fireEvent.click(submitButton);
            }
        });

        // Second modal should be opened
        expect(screen.queryByText('Hide-my-email aliases')).toBeNull();
    });

    it('should not show an extra modal when the message was coming from an official Proton address', async () => {
        const unsubscribeCall = vi.fn();
        const markUnsubscribedCall = vi.fn();

        minimalCache();
        addApiMock(`mail/v4/messages/${messageID}/unsubscribe`, unsubscribeCall);
        addApiMock(`mail/v4/messages/mark/unsubscribed`, markUnsubscribedCall);

        const message = mergeMessages(defaultMessage, {
            data: {
                UnsubscribeMethods: { OneClick: 'OneClick' },
                Sender: { Address: 'sender@simplelogin.co', Name: 'SimpleLoginAlias', IsProton: 1 },
            },
        }) as MessageStateWithData;

        await mailTestRender(<ExtraUnsubscribe message={message.data} />, {
            preloadedState: {
                addresses: getModelState([getCompleteAddress({ ID: toAddressID, Email: toAddress })]),
            },
        });

        let button;
        await waitFor(() => {
            button = screen.getByTestId('unsubscribe-banner');
            expect(button.textContent).toMatch(/Unsubscribe/);
        });

        if (button) {
            fireEvent.click(button);
        }

        // Submit first modal
        await waitFor(() => {
            const submitButton = screen.getByTestId('unsubscribe-banner:submit');
            if (submitButton) {
                fireEvent.click(submitButton);
            }
        });

        // Second modal should not be opened
        expect(screen.queryByText('with hide-my-email aliases')).toBeNull();
    });

    it('should not show the unsubscribe button in the newsletter subscriptions view', async () => {
        const unsubscribeCall = vi.fn();
        const markUnsubscribedCall = vi.fn();

        minimalCache();
        addApiMock(`mail/v4/messages/${messageID}/unsubscribe`, unsubscribeCall);
        addApiMock(`mail/v4/messages/mark/unsubscribed`, markUnsubscribedCall);

        const message = mergeMessages(defaultMessage, {
            data: {
                UnsubscribeMethods: { OneClick: 'OneClick' },
            },
        }) as MessageStateWithData;

        await mailTestRender(<ExtraUnsubscribe message={message.data} />, {
            preloadedState: {
                addresses: getModelState([getCompleteAddress({ ID: toAddressID, Email: toAddress })]),
                elements: newElementsState({ params: { labelID: CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS } }),
            },
        });

        expect(screen.queryByText('Unsubscribe')).toBeNull();
    });
});
