import React from 'react';
import { fireEvent } from '@testing-library/dom';
import loudRejection from 'loud-rejection';
import { openNewTab } from 'proton-shared/lib/helpers/browser';
import { mergeMessages } from '../../../helpers/message/messages';
import { addAddressToCache, minimalCache } from '../../../helpers/test/cache';
import {
    addApiKeys,
    addApiMock,
    addKeysToAddressKeysCache,
    clearAll,
    generateKeys,
    getModal,
    render,
    waitForEventManagerCall,
} from '../../../helpers/test/helper';
import { MessageExtended } from '../../../models/message';
import ExtraUnsubscribe from './ExtraUnsubscribe';

loudRejection();

jest.mock('proton-shared/lib/helpers/browser', () => ({
    isMac: jest.fn(() => false),
    openNewTab: jest.fn(),
}));

describe('Unsubscribe banner', () => {
    const messageID = 'messageID';
    const toAddressID = 'toAddressID';
    const toAddress = 'to@domain.com';
    const onCompose = jest.fn();

    const defaultMessage = {
        localID: messageID,
        data: { ID: messageID, Subject: 'test', ParsedHeaders: { 'X-Original-To': toAddress } } as any,
        initialized: true,
        verification: {},
    } as MessageExtended;

    afterEach(clearAll);

    it('should show the unsubscribe banner with one click method', async () => {
        minimalCache();
        addAddressToCache({ Email: toAddress });
        const message = mergeMessages(defaultMessage, {
            data: {
                UnsubscribeMethods: { OneClick: 'OneClick' },
            },
        });

        const { getByTestId } = await render(<ExtraUnsubscribe message={message} onCompose={onCompose} />, false);

        const banner = getByTestId('unsubscribe-banner');

        expect(banner.textContent).toMatch(/Unsubscribe/);

        const unsubscribeCall = jest.fn();
        const markUnsubscribedCall = jest.fn();

        addApiMock(`mail/v4/messages/${messageID}/unsubscribe`, unsubscribeCall);
        addApiMock(`mail/v4/messages/mark/unsubscribed`, markUnsubscribedCall);

        const button = banner.querySelector('button');
        if (button) {
            fireEvent.click(button);
        }

        const { submit } = getModal();
        if (submit) {
            fireEvent.click(submit);
        }

        await waitForEventManagerCall();

        expect(unsubscribeCall).toHaveBeenCalled();
        expect(markUnsubscribedCall).toHaveBeenCalled();
    });

    it('should show the unsubscribe banner with mailto method', async () => {
        const mailto = 'to@address.com';

        minimalCache();
        addAddressToCache({ ID: toAddressID, Email: toAddress });
        addApiKeys(false, mailto, []);
        const keys = await generateKeys('me', toAddress);
        addKeysToAddressKeysCache(toAddressID, keys);

        const message = mergeMessages(defaultMessage, {
            data: {
                UnsubscribeMethods: { Mailto: { ToList: [mailto], Body: 'body', Subject: 'subject' } },
            },
        });

        const { getByTestId } = await render(<ExtraUnsubscribe message={message} onCompose={onCompose} />, false);

        const banner = getByTestId('unsubscribe-banner');

        expect(banner.textContent).toMatch(/Unsubscribe/);

        const createCall = jest.fn(() => ({ Message: { ID: messageID, Attachments: [] } }));
        const sendCall = jest.fn(() => ({ Sent: {} }));
        const markUnsubscribedCall = jest.fn();

        addApiMock(`mail/v4/messages`, createCall);
        addApiMock(`mail/v4/messages/messageID`, sendCall);
        addApiMock(`mail/v4/messages/mark/unsubscribed`, markUnsubscribedCall);

        const button = banner.querySelector('button');
        if (button) {
            fireEvent.click(button);
        }

        const { submit } = getModal();
        if (submit) {
            fireEvent.click(submit);
        }

        await waitForEventManagerCall();

        expect(sendCall).toHaveBeenCalled();
        expect(markUnsubscribedCall).toHaveBeenCalled();
    });

    it('should show the unsubscribe banner with http client method', async () => {
        minimalCache();
        addAddressToCache({ ID: toAddressID, Email: toAddress });

        const message = mergeMessages(defaultMessage, {
            data: {
                UnsubscribeMethods: { HttpClient: 'url' },
            },
        });

        const { getByTestId } = await render(<ExtraUnsubscribe message={message} onCompose={onCompose} />, false);

        const banner = getByTestId('unsubscribe-banner');

        expect(banner.textContent).toMatch(/Unsubscribe/);

        const markUnsubscribedCall = jest.fn();
        const openNewTabMock = openNewTab as jest.Mock;

        addApiMock(`mail/v4/messages/mark/unsubscribed`, markUnsubscribedCall);

        const button = banner.querySelector('button');
        if (button) {
            fireEvent.click(button);
        }

        const { submit } = getModal();
        if (submit) {
            fireEvent.click(submit);
        }

        await waitForEventManagerCall();

        expect(openNewTabMock).toHaveBeenCalled();
        expect(markUnsubscribedCall).toHaveBeenCalled();
    });
});
