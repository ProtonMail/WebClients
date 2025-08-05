import { fireEvent, screen, waitFor } from '@testing-library/react';

import { getModelState } from '@proton/account/test';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import noop from '@proton/utils/noop';

import { addApiMock, clearApiMocks } from '../../../helpers/test/api';
import { getCompleteAddress } from '../../../helpers/test/cache';
import { getStoredUserKey, releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../helpers/test/crypto';
import { contactID, receiver, sender, setupContactsForPinKeys } from '../../../helpers/test/pinKeys';
import { mailTestRender, tick } from '../../../helpers/test/render';
import ContactResignModal from './ContactResignModal';

const contacts = [{ contactID: contactID }];
const title = 'Contact Resign Modal title';
const children = 'Contact Resign Modal children';

describe('Contact resign modal', () => {
    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    beforeEach(() => {
        clearApiMocks();
    });

    const setup = async (hasFingerprint: boolean) => {
        const { receiverKeys, senderKeys, updateSpy } = await setupContactsForPinKeys(hasFingerprint);

        addApiMock('core/v4/keys/all', () => ({ Address: { Keys: [{ PublicKey: senderKeys.publicKeyArmored }] } }));
        addApiMock(
            'contacts/v4/contacts/emails',
            () => ({
                ContactEmails: [{ Email: sender.Address, ContactID: contactID } as ContactEmail] as ContactEmail[],
            }),
            'get'
        );

        const onResignSpy = jest.fn();

        await mailTestRender(
            <ContactResignModal
                title={title}
                contacts={contacts}
                onResign={onResignSpy}
                onResolve={noop}
                onReject={noop}
                open
            >
                {children}
            </ContactResignModal>,
            {
                preloadedState: {
                    userKeys: getModelState(getStoredUserKey(receiverKeys)),
                    addresses: getModelState([getCompleteAddress({ Email: receiver.Address })]),
                },
            }
        );

        return { senderKeys, updateSpy, onResignSpy };
    };

    it('should resign the contact and render email rows', async () => {
        const { senderKeys, updateSpy, onResignSpy } = await setup(true);

        // Modal and content are displayed
        screen.getByText(title);
        screen.getByText(children);

        // Email rows are rendered (Email + fingerprints)
        await screen.findByText(`${sender.Address}:`);
        const expectedFingerPrint = senderKeys.publicKeys[0].getFingerprint();
        screen.getByText(expectedFingerPrint);

        // Click on Re-sign button
        const resignButton = screen.getByTestId('resign-contact');
        await waitFor(() => expect(resignButton).not.toBeDisabled(), { timeout: 1000 });
        fireEvent.click(resignButton);
        await tick();

        // Contact update is called
        await waitFor(() => expect(updateSpy).toHaveBeenCalled());

        // Optional on Resign action is called
        await waitFor(() => expect(onResignSpy).toHaveBeenCalled());
    });

    it('should resign the contact not render email rows', async () => {
        const { updateSpy, onResignSpy } = await setup(false);

        // Modal and content are displayed
        screen.getByText(title);
        screen.getByText(children);

        // Email rows are not rendered
        const emailRow = screen.queryByText(`${sender.Address}:`);
        expect(emailRow).toBeNull();

        // Click on Re-sign button
        const resignButton = screen.getByTestId('resign-contact');
        await waitFor(() => expect(resignButton).not.toBeDisabled());
        fireEvent.click(resignButton);

        // Contact update is called
        await waitFor(() => expect(updateSpy).toHaveBeenCalled());

        // Optional on Resign action is called
        await waitFor(() => expect(onResignSpy).toHaveBeenCalled());
    });
});
