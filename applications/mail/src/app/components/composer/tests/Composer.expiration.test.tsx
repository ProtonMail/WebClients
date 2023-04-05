import { fireEvent } from '@testing-library/react';
import { act, getByTestId as getByTestIdDefault, getByText as getByTextDefault } from '@testing-library/react';
import { format } from 'date-fns';
import loudRejection from 'loud-rejection';

import { MIME_TYPES } from '@proton/shared/lib/constants';
import { addDays } from '@proton/shared/lib/date-fns-utc';
import { dateLocale } from '@proton/shared/lib/i18n';

import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../helpers/test/crypto';
import {
    addApiKeys,
    addKeysToAddressKeysCache,
    clearAll,
    generateKeys,
    getDropdown,
    render,
} from '../../../helpers/test/helper';
import { store } from '../../../logic/store';
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

    const setup = async () => {
        const state = store.getState();
        const composerID = Object.keys(state.composers.composers)[0];

        const fromKeys = await generateKeys('me', fromAddress);
        addKeysToAddressKeysCache(AddressID, fromKeys);
        addApiKeys(false, toAddress, []);

        const result = await render(<Composer {...props} composerID={composerID} />);

        return result;
    };

    it('should open expiration modal with default values', async () => {
        const expirationDate = addDays(new Date(), 7);
        const datePlaceholder = format(expirationDate, 'PP', { locale: dateLocale });

        prepareMessage({
            localID: ID,
            data: { MIMEType: 'text/plain' as MIME_TYPES },
            messageDocument: { plainText: '' },
        });

        const { getByTestId, getByText } = await setup();

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
        const expirationTime = expirationDate.getTime() / 1000;
        const datePlaceholder = format(expirationDate, 'PP', { locale: dateLocale });
        prepareMessage({
            localID: ID,
            data: { MIMEType: 'text/plain' as MIME_TYPES, ExpirationTime: expirationTime },
            messageDocument: { plainText: '' },
        });

        const { getByText, getByTestId } = await setup();

        getByText(/This message will expire/);

        const editButton = getByTestId('message:expiration-banner-edit-button');
        await act(async () => {
            fireEvent.click(editButton);
        });

        getByText('Expiring message');
        const dayInput = getByTestId('composer:expiration-days') as HTMLInputElement;
        const hoursInput = getByTestId('composer:expiration-hours') as HTMLInputElement;

        // Check if default expiration is in 7 days and at 9 o'clock
        expect(dayInput.value).toEqual(datePlaceholder);
        expect(hoursInput.value).toEqual('9:00 AM');
    });
});
