import { act, fireEvent, screen } from '@testing-library/react';
import loudRejection from 'loud-rejection';

import { getModelState } from '@proton/account/test';
import { openNewTab } from '@proton/shared/lib/helpers/browser';

import { mergeMessages } from '../../../helpers/message/messages';
import { getCompleteAddress, minimalCache } from '../../../helpers/test/cache';
import { getAddressKeyCache, releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../helpers/test/crypto';
import {
    addApiKeys,
    addApiMock,
    clearAll,
    generateKeys,
    render,
    waitForEventManagerCall,
    waitForNotification,
} from '../../../helpers/test/helper';
import type { MessageStateWithData } from '../../../store/messages/messagesTypes';
import ExtraUnsubscribe from './ExtraUnsubscribe';

loudRejection();

jest.mock('@proton/shared/lib/helpers/browser', () => ({
    ua: { ua: 'UserAgent' },
    isMac: jest.fn(() => false),
    openNewTab: jest.fn(),
    isMobile: jest.fn(),
    isFirefoxLessThan55: jest.fn(),
    getIsIframe: jest.fn(() => false),
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
        const unsubscribeCall = jest.fn();
        const markUnsubscribedCall = jest.fn();

        minimalCache();
        addApiMock(`mail/v4/messages/${messageID}/unsubscribe`, unsubscribeCall);
        addApiMock(`mail/v4/messages/mark/unsubscribed`, markUnsubscribedCall);

        const message = mergeMessages(defaultMessage, {
            data: {
                UnsubscribeMethods: { OneClick: 'OneClick' },
            },
        }) as MessageStateWithData;

        await render(<ExtraUnsubscribe message={message.data} />, {
            preloadedState: {
                addresses: getModelState([getCompleteAddress({ Email: toAddress })]),
            },
        });

        const button = screen.getByTestId('unsubscribe-banner');

        expect(button.textContent).toMatch(/Unsubscribe/);

        if (button) {
            await act(async () => {
                fireEvent.click(button);
            });
        }

        const submitButton = screen.getByTestId('unsubscribe-banner:submit');
        if (submitButton) {
            await act(async () => {
                fireEvent.click(submitButton);
            });
        }

        await waitForEventManagerCall();

        expect(unsubscribeCall).toHaveBeenCalled();
        expect(markUnsubscribedCall).toHaveBeenCalled();
    });

    it('should show the unsubscribe banner with mailto method', async () => {
        const mailto = 'to@address.com';
        const keys = await generateKeys('me', toAddress);

        const createCall = jest.fn(() => ({ Message: { ID: messageID, Attachments: [] } }));
        const sendCall = jest.fn(() => ({ Sent: {} }));
        const markUnsubscribedCall = jest.fn();

        minimalCache();
        addApiKeys(false, mailto, []);
        addApiMock(`mail/v4/messages`, createCall);
        addApiMock(`mail/v4/messages/messageID`, sendCall);
        addApiMock(`mail/v4/messages/mark/unsubscribed`, markUnsubscribedCall);

        const message = mergeMessages(defaultMessage, {
            data: {
                UnsubscribeMethods: { Mailto: { ToList: [mailto], Body: 'body', Subject: 'subject' } },
            },
        }) as MessageStateWithData;

        await render(<ExtraUnsubscribe message={message.data} />, {
            preloadedState: {
                addresses: getModelState([getCompleteAddress({ ID: toAddressID, Email: toAddress })]),
                addressKeys: getAddressKeyCache(toAddressID, keys),
            },
        });

        const button = screen.getByTestId('unsubscribe-banner');

        expect(button.textContent).toMatch(/Unsubscribe/);

        if (button) {
            fireEvent.click(button);
        }

        const submitButton = screen.getByTestId('unsubscribe-banner:submit');
        if (submitButton) {
            fireEvent.click(submitButton);
        }

        await waitForNotification('Mail list unsubscribed');
        await waitForEventManagerCall();

        expect(sendCall).toHaveBeenCalled();
        expect(markUnsubscribedCall).toHaveBeenCalled();
    });

    it('should show the unsubscribe banner with http client method', async () => {
        const markUnsubscribedCall = jest.fn();
        const openNewTabMock = openNewTab as jest.Mock;

        minimalCache();
        addApiMock(`mail/v4/messages/mark/unsubscribed`, markUnsubscribedCall);

        const message = mergeMessages(defaultMessage, {
            data: {
                UnsubscribeMethods: { HttpClient: 'url' },
            },
        }) as MessageStateWithData;

        await render(<ExtraUnsubscribe message={message.data} />, {
            preloadedState: {
                addresses: getModelState([getCompleteAddress({ ID: toAddressID, Email: toAddress })]),
            },
        });

        const button = screen.getByTestId('unsubscribe-banner');

        expect(button.textContent).toMatch(/Unsubscribe/);

        if (button) {
            await act(async () => {
                fireEvent.click(button);
            });
        }

        const submitButton = screen.getByTestId('unsubscribe-banner:submit');
        if (submitButton) {
            await act(async () => {
                fireEvent.click(submitButton);
            });
        }

        await waitForEventManagerCall();

        expect(openNewTabMock).toHaveBeenCalled();
        expect(markUnsubscribedCall).toHaveBeenCalled();
    });

    it('should show an extra modal on unsubscribe', async () => {
        const unsubscribeCall = jest.fn();
        const markUnsubscribedCall = jest.fn();

        minimalCache();
        addApiMock(`mail/v4/messages/${messageID}/unsubscribe`, unsubscribeCall);
        addApiMock(`mail/v4/messages/mark/unsubscribed`, markUnsubscribedCall);

        const message = mergeMessages(defaultMessage, {
            data: {
                UnsubscribeMethods: { OneClick: 'OneClick' },
            },
        }) as MessageStateWithData;

        await render(<ExtraUnsubscribe message={message.data} />, {
            preloadedState: {
                addresses: getModelState([getCompleteAddress({ ID: toAddressID, Email: toAddress })]),
            },
        });

        const button = screen.getByTestId('unsubscribe-banner');

        expect(button.textContent).toMatch(/Unsubscribe/);

        if (button) {
            await act(async () => {
                fireEvent.click(button);
            });
        }

        // Submit first modal
        const submitButton = screen.getByTestId('unsubscribe-banner:submit');
        if (submitButton) {
            await act(async () => {
                fireEvent.click(submitButton);
            });
        }

        // Second modal should be opened
        screen.getByText('hide-my-email aliases');
    });

    it('should not show an extra modal when the message was coming from an official Proton address', async () => {
        const unsubscribeCall = jest.fn();
        const markUnsubscribedCall = jest.fn();

        minimalCache();
        addApiMock(`mail/v4/messages/${messageID}/unsubscribe`, unsubscribeCall);
        addApiMock(`mail/v4/messages/mark/unsubscribed`, markUnsubscribedCall);

        const message = mergeMessages(defaultMessage, {
            data: {
                UnsubscribeMethods: { OneClick: 'OneClick' },
                Sender: { Address: 'sender@simplelogin.co', Name: 'SimpleLoginAlias', IsProton: 1 },
            },
        }) as MessageStateWithData;

        await render(<ExtraUnsubscribe message={message.data} />, {
            preloadedState: {
                addresses: getModelState([getCompleteAddress({ ID: toAddressID, Email: toAddress })]),
            },
        });

        const button = screen.getByTestId('unsubscribe-banner');

        expect(button.textContent).toMatch(/Unsubscribe/);

        if (button) {
            await act(async () => {
                fireEvent.click(button);
            });
        }

        // Submit first modal
        const submitButton = screen.getByTestId('unsubscribe-banner:submit');
        if (submitButton) {
            await act(async () => {
                fireEvent.click(submitButton);
            });
        }

        // Second modal should not be opened
        expect(screen.queryByText('hide-my-email aliases')).toBeNull();
    });
});
