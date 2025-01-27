import { fireEvent, waitFor } from '@testing-library/react';

import { getModelState } from '@proton/account/test';
import type { PublicKeyReference } from '@proton/crypto';
import type { ContactWithBePinnedPublicKey } from '@proton/shared/lib/interfaces/contacts';

import { addApiMock } from '../../../helpers/test/api';
import type { GeneratedKey } from '../../../helpers/test/crypto';
import { generateKeys, getStoredUserKey } from '../../../helpers/test/crypto';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../helpers/test/crypto';
import { clearAll, waitForNotification } from '../../../helpers/test/helper';
import { receiver, sender, setupContactsForPinKeys } from '../../../helpers/test/pinKeys';
import { render } from '../../../helpers/test/render';
import TrustPublicKeyModal from './TrustPublicKeyModal';

const senderAddress = 'sender@outside.com';

const getContact = (senderKey: PublicKeyReference, isContact = false) => {
    return {
        emailAddress: senderAddress,
        name: 'Sender',
        contactID: isContact ? 'contactID' : undefined,
        isInternal: false,
        bePinnedPublicKey: senderKey,
    } as ContactWithBePinnedPublicKey;
};

describe('Trust public key modal', () => {
    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    afterEach(clearAll);

    const setup = async (senderKeys: GeneratedKey, isContact: boolean, options?: Parameters<typeof render>[1]) => {
        const contact = getContact(senderKeys.publicKeys[0], isContact);

        const component = await render(<TrustPublicKeyModal contact={contact} open />, options);

        return component;
    };

    it('should update contact when trusting key if contact already exists', async () => {
        // Create the contact
        const { senderKeys, receiverKeys, updateSpy } = await setupContactsForPinKeys();

        const { getByText, getByTestId } = await setup(senderKeys, true, {
            preloadedState: {
                userKeys: getModelState(getStoredUserKey(receiverKeys)),
            },
        });

        // Modal is displayed
        getByText('Trust public key?');

        // Click on Trust key button
        const submitButton = getByTestId('trust-key-modal:submit');

        fireEvent.click(submitButton);

        // Contact has been updated
        await waitFor(() => expect(updateSpy).toHaveBeenCalled());
    });

    it('should create a contact when trusting key if contact does not exists', async () => {
        const senderKeys = await generateKeys('sender', sender.Address);
        const receiverKeys = await generateKeys('me', receiver.Address);

        const createSpy = jest.fn(() => {
            return {
                Responses: [
                    {
                        Response: { Code: 1000 },
                    },
                ],
            };
        });
        addApiMock('contacts/v4/contacts', createSpy, 'post');

        const { getByText, getByTestId } = await setup(senderKeys, false, {
            preloadedState: {
                userKeys: getModelState(getStoredUserKey(receiverKeys)),
            },
        });

        // Modal is displayed
        getByText('Trust public key?');

        // Click on Trust key button
        const submitButton = getByTestId('trust-key-modal:submit');
        fireEvent.click(submitButton);

        // Contact has been created
        await waitFor(() => expect(createSpy).toHaveBeenCalled());
    });

    it('should display a notification when key could not be trusted', async () => {
        const senderKeys = await generateKeys('sender', sender.Address);
        const receiverKeys = await generateKeys('me', receiver.Address);

        const createSpy = jest.fn(() => {
            return {
                Responses: [
                    {
                        Response: { Code: 1002 }, // Wrong api code to trigger the error
                    },
                ],
            };
        });
        addApiMock('contacts/v4/contacts', createSpy, 'post');

        const { getByText, getByTestId } = await setup(senderKeys, false, {
            preloadedState: {
                userKeys: getModelState(getStoredUserKey(receiverKeys)),
            },
        });

        // Modal is displayed
        getByText('Trust public key?');

        // Click on Trust key button
        const submitButton = getByTestId('trust-key-modal:submit');
        fireEvent.click(submitButton);

        // Contact has been created
        await waitFor(() => expect(createSpy).toHaveBeenCalled());

        await waitForNotification('Public key could not be trusted');
    });
});
