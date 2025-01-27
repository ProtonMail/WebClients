import { fireEvent, getByTestId as getByTestIdDefault } from '@testing-library/react';
import { addHours } from 'date-fns';
import loudRejection from 'loud-rejection';

import { getModelState } from '@proton/account/test';
import type { MIME_TYPES } from '@proton/shared/lib/constants';

import type { PartialMessageState } from 'proton-mail/store/messages/messagesTypes';

import { getAddressKeyCache, releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../helpers/test/crypto';
import {
    addApiKeys,
    addApiMock,
    clearAll,
    generateKeys,
    getCompleteAddress,
    getDropdown,
    render,
    tick,
    waitForNotification,
} from '../../../helpers/test/helper';
import Composer from '../Composer';
import { AddressID, ID, fromAddress, prepareMessage, props, saveNow, toAddress } from './Composer.test.helpers';

loudRejection();

const password = 'password';

describe('Composer outside encryption', () => {
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
        addApiMock(`mail/v4/messages/${ID}`, () => ({ Message: {} }), 'put');

        const fromKeys = await generateKeys('me', fromAddress);
        addApiKeys(false, toAddress, []);

        const address = getCompleteAddress({ ID: AddressID, Email: fromAddress });
        const view = await render(<Composer {...props} composerID={composerID} />, {
            preloadedState: {
                addressKeys: getAddressKeyCache(address, [fromKeys]),
                addresses: getModelState([address]),
            },
            onStore: (store) => {
                prepareMessage(store, message, composerID);
            },
        });

        return view;
    };

    it('should set outside encryption and display the expiration banner', async () => {
        const { getByTestId, getByText, container } = await setup({
            localID: ID,
            data: { MIMEType: 'text/plain' as MIME_TYPES },
            messageDocument: { plainText: '' },
        });

        const expirationButton = getByTestId('composer:password-button');
        fireEvent.click(expirationButton);
        await tick();

        // modal is displayed and we can set a password
        getByText('Encrypt message');

        const passwordInput = getByTestId('encryption-modal:password-input');
        fireEvent.change(passwordInput, { target: { value: password } });

        const setEncryptionButton = getByTestId('modal-footer:set-button');
        fireEvent.click(setEncryptionButton);

        await waitForNotification('Password has been set successfully');

        // The expiration banner is displayed
        getByText(/This message will expire/);

        await saveNow(container);
    });

    it('should set outside encryption with a default expiration time', async () => {
        // Message will expire tomorrow

        const { getByTestId, getByText } = await setup({
            localID: ID,
            data: { MIMEType: 'text/plain' as MIME_TYPES },
            messageDocument: { plainText: '' },
            draftFlags: {
                expiresIn: addHours(new Date(), 25), // expires in 25 hours
            },
        });

        const expirationButton = getByTestId('composer:password-button');
        fireEvent.click(expirationButton);

        // Modal and expiration date are displayed
        getByText('Edit encryption');
        getByText('Your message will expire tomorrow.');
    });

    it('should be able to edit encryption', async () => {
        const { getByTestId, getByText, container } = await setup({
            localID: ID,
            data: { MIMEType: 'text/plain' as MIME_TYPES },
            messageDocument: { plainText: '' },
        });

        const expirationButton = getByTestId('composer:password-button');
        fireEvent.click(expirationButton);

        // modal is displayed and we can set a password
        getByText('Encrypt message');

        const passwordInput = getByTestId('encryption-modal:password-input');
        fireEvent.change(passwordInput, { target: { value: password } });

        const setEncryptionButton = getByTestId('modal-footer:set-button');
        fireEvent.click(setEncryptionButton);

        await waitForNotification('Password has been set successfully');
        await saveNow(container);

        // Edit encryption
        // Open the encryption dropdown
        const encryptionDropdownButton = getByTestId('composer:encryption-options-button');
        fireEvent.click(encryptionDropdownButton);

        const dropdown = await getDropdown();

        // Click on edit button
        const editEncryptionButton = getByTestIdDefault(dropdown, 'composer:edit-outside-encryption');
        fireEvent.click(editEncryptionButton);

        const passwordInputAfterUpdate = getByTestId('encryption-modal:password-input') as HTMLInputElement;
        const passwordValue = passwordInputAfterUpdate.value;

        expect(passwordValue).toEqual(password);
    });

    it('should be able to remove encryption', async () => {
        const { getByTestId, getByText, queryByText, container, findByText } = await setup({
            localID: ID,
            data: { MIMEType: 'text/plain' as MIME_TYPES },
            messageDocument: { plainText: '' },
        });

        const expirationButton = getByTestId('composer:password-button');
        fireEvent.click(expirationButton);
        await tick();

        // modal is displayed and we can set a password
        getByText('Encrypt message');

        const passwordInput = getByTestId('encryption-modal:password-input');
        fireEvent.change(passwordInput, { target: { value: password } });

        const setEncryptionButton = getByTestId('modal-footer:set-button');
        fireEvent.click(setEncryptionButton);

        await waitForNotification('Password has been set successfully');

        // Edit encryption
        // Open the encryption dropdown
        const encryptionDropdownButton = getByTestId('composer:encryption-options-button');
        fireEvent.click(encryptionDropdownButton);

        const dropdown = await getDropdown();

        await findByText(/This message will expire on/);
        // Click on remove button
        const editEncryptionButton = getByTestIdDefault(dropdown, 'composer:remove-outside-encryption');
        fireEvent.click(editEncryptionButton);

        expect(queryByText(/This message will expire on/)).toBe(null);

        await saveNow(container);
    });
});
