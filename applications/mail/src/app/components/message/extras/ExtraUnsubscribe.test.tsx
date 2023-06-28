import { fireEvent } from '@testing-library/react';
import loudRejection from 'loud-rejection';

import { openNewTab } from '@proton/shared/lib/helpers/browser';

import { mergeMessages } from '../../../helpers/message/messages';
import { addAddressToCache, minimalCache } from '../../../helpers/test/cache';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../helpers/test/crypto';
import {
    addApiKeys,
    addApiMock,
    addKeysToAddressKeysCache,
    clearAll,
    generateKeys,
    render,
    waitForEventManagerCall,
    waitForNotification,
} from '../../../helpers/test/helper';
import { MessageStateWithData } from '../../../logic/messages/messagesTypes';
import ExtraUnsubscribe from './ExtraUnsubscribe';

loudRejection();

jest.mock('@proton/shared/lib/helpers/browser', () => ({
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
        addAddressToCache({ Email: toAddress });
        addApiMock(`mail/v4/messages/${messageID}/unsubscribe`, unsubscribeCall);
        addApiMock(`mail/v4/messages/mark/unsubscribed`, markUnsubscribedCall);

        const message = mergeMessages(defaultMessage, {
            data: {
                UnsubscribeMethods: { OneClick: 'OneClick' },
            },
        }) as MessageStateWithData;

        const { getByTestId } = await render(<ExtraUnsubscribe message={message.data} />, false);

        const button = getByTestId('unsubscribe-banner');

        expect(button.textContent).toMatch(/Unsubscribe/);

        if (button) {
            fireEvent.click(button);
        }

        const submitButton = getByTestId('unsubscribe-banner:submit');
        if (submitButton) {
            fireEvent.click(submitButton);
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
        addAddressToCache({ ID: toAddressID, Email: toAddress });
        addApiKeys(false, mailto, []);
        addKeysToAddressKeysCache(toAddressID, keys);
        addApiMock(`mail/v4/messages`, createCall);
        addApiMock(`mail/v4/messages/messageID`, sendCall);
        addApiMock(`mail/v4/messages/mark/unsubscribed`, markUnsubscribedCall);

        const message = mergeMessages(defaultMessage, {
            data: {
                UnsubscribeMethods: { Mailto: { ToList: [mailto], Body: 'body', Subject: 'subject' } },
            },
        }) as MessageStateWithData;

        const { getByTestId } = await render(<ExtraUnsubscribe message={message.data} />, false);

        const button = getByTestId('unsubscribe-banner');

        expect(button.textContent).toMatch(/Unsubscribe/);

        if (button) {
            fireEvent.click(button);
        }

        const submitButton = getByTestId('unsubscribe-banner:submit');
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
        addAddressToCache({ ID: toAddressID, Email: toAddress });
        addApiMock(`mail/v4/messages/mark/unsubscribed`, markUnsubscribedCall);

        const message = mergeMessages(defaultMessage, {
            data: {
                UnsubscribeMethods: { HttpClient: 'url' },
            },
        }) as MessageStateWithData;

        const { getByTestId } = await render(<ExtraUnsubscribe message={message.data} />, false);

        const button = getByTestId('unsubscribe-banner');

        expect(button.textContent).toMatch(/Unsubscribe/);

        if (button) {
            fireEvent.click(button);
        }

        const submitButton = getByTestId('unsubscribe-banner:submit');
        if (submitButton) {
            fireEvent.click(submitButton);
        }

        await waitForEventManagerCall();

        expect(openNewTabMock).toHaveBeenCalled();
        expect(markUnsubscribedCall).toHaveBeenCalled();
    });
});
