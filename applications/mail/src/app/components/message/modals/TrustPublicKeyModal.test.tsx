import { fireEvent, screen, waitFor } from '@testing-library/react';

import { getModelState } from '@proton/account/test';
import type { PublicKeyReference } from '@proton/crypto';
import type { ContactWithBePinnedPublicKey } from '@proton/shared/lib/interfaces/contacts';

import { addApiMock } from '../../../helpers/test/api';
import type { GeneratedKey } from '../../../helpers/test/crypto';
import {
    generateKeys,
    getStoredUserKey,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '../../../helpers/test/crypto';
import { clearAll, waitForNotification } from '../../../helpers/test/helper';
import { receiver, sender, setupContactsForPinKeys } from '../../../helpers/test/pinKeys';
import { mailTestRender } from '../../../helpers/test/render';
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

    const setup = async (
        senderKeys: GeneratedKey,
        isContact: boolean,
        options?: Parameters<typeof mailTestRender>[1]
    ) => {
        const contact = getContact(senderKeys.publicKeys[0], isContact);
        await mailTestRender(<TrustPublicKeyModal contact={contact} open />, options);
    };

    it('should update contact when trusting key if contact already exists', async () => {
        // Create the contact
        const { senderKeys, receiverKeys, updateSpy } = await setupContactsForPinKeys();

        await setup(senderKeys, true, {
            preloadedState: {
                userKeys: getModelState(getStoredUserKey(receiverKeys)),
            },
        });

        // Modal is displayed
        screen.getByText('Trust public key?');

        // Click on Trust key button
        const submitButton = screen.getByTestId('trust-key-modal:submit');

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

        await setup(senderKeys, false, {
            preloadedState: {
                userKeys: getModelState(getStoredUserKey(receiverKeys)),
            },
        });

        // Modal is displayed
        screen.getByText('Trust public key?');

        // Click on Trust key button
        const submitButton = screen.getByTestId('trust-key-modal:submit');
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

        await setup(senderKeys, false, {
            preloadedState: {
                userKeys: getModelState(getStoredUserKey(receiverKeys)),
            },
        });

        // Modal is displayed
        screen.getByText('Trust public key?');

        // Click on Trust key button
        const submitButton = screen.getByTestId('trust-key-modal:submit');
        fireEvent.click(submitButton);

        // Contact has been created
        await waitFor(() => expect(createSpy).toHaveBeenCalled());

        await waitForNotification('Public key could not be trusted');
    });
});
