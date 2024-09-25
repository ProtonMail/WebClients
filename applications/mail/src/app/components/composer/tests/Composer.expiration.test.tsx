import { fireEvent } from '@testing-library/react';
import { act, getByTestId as getByTestIdDefault, getByText as getByTextDefault } from '@testing-library/react';
import { format } from 'date-fns';
import loudRejection from 'loud-rejection';

import type { MIME_TYPES } from '@proton/shared/lib/constants';
import { addDays } from '@proton/shared/lib/date-fns-utc';
import { dateLocale } from '@proton/shared/lib/i18n';

import type { PartialMessageState } from 'proton-mail/store/messages/messagesTypes';

import { getAddressKeyCache, releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../helpers/test/crypto';
import { addApiKeys, clearAll, generateKeys, getDropdown, render } from '../../../helpers/test/helper';
import Composer from '../Composer';
import { AddressID, ID, fromAddress, prepareMessage, props, toAddress } from './Composer.test.helpers';

loudRejection();

describe('Composer expiration', () => {
    beforeEach(() => {
        clearAll();
    });

    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    afterAll(async () => {
        clearAll();
        await releaseCryptoProxy();
    });

    const composerID = 'composer-test-id';

    const setup = async (message: PartialMessageState) => {
        const fromKeys = await generateKeys('me', fromAddress);
        addApiKeys(false, toAddress, []);

        const result = await render(<Composer {...props} composerID={composerID} />, {
            preloadedState: {
                addressKeys: getAddressKeyCache(AddressID, fromKeys),
            },
            onStore: (store) => {
                prepareMessage(store, message, composerID);
            },
        });

        return result;
    };

    it('should open expiration modal with default values', async () => {
        const expirationDate = addDays(new Date(), 7);
        const datePlaceholder = format(expirationDate, 'PP', { locale: dateLocale });

        const { getByTestId, getByText } = await setup({
            localID: ID,
            data: { MIMEType: 'text/plain' as MIME_TYPES },
            messageDocument: { plainText: '' },
        });

        const moreOptionsButton = getByTestId('composer:more-options-button');
        fireEvent.click(moreOptionsButton);

        const dropdown = await getDropdown();

        getByTextDefault(dropdown, 'Expiration time');

        const expirationButton = getByTestIdDefault(dropdown, 'composer:expiration-button');
        await act(async () => {
            fireEvent.click(expirationButton);
        });

        getByText('Expiring message');
        const dayInput = getByTestId('composer:expiration-days') as HTMLInputElement;
        const hoursInput = getByTestId('composer:expiration-hours') as HTMLInputElement;

        // Check if default expiration is in 7 days and at 9 o'clock
        expect(dayInput.value).toEqual(datePlaceholder);
        expect(hoursInput.value).toEqual('9:00 AM');
    });

    it('should display expiration banner and open expiration modal when clicking on edit', async () => {
        const expirationDate = addDays(new Date(), 7);
        const datePlaceholder = format(expirationDate, 'PP', { locale: dateLocale });

        const { getByText, getByTestId } = await setup({
            localID: ID,
            draftFlags: {
                expiresIn: expirationDate,
            },
            messageDocument: { plainText: '' },
        });

        getByText(/This message will expire/);

        const editButton = getByTestId('message:expiration-banner-edit-button');
        await act(async () => {
            fireEvent.click(editButton);
        });

        getByText('Edit expiration time');
        const dayInput = getByTestId('composer:expiration-days') as HTMLInputElement;
        const hoursInput = getByTestId('composer:expiration-hours') as HTMLInputElement;

        const time = expirationDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

        // Check if default expiration is in 7 days and at 9 o'clock
        expect(dayInput.value).toEqual(datePlaceholder);
        expect(hoursInput.value).toEqual(time);
    });
});
