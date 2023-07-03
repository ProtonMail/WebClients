import { fireEvent, waitFor } from '@testing-library/react';

import { Address } from '@proton/shared/lib/interfaces';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

import { addApiMock } from '../../../helpers/test/api';
import { addToCache, minimalCache } from '../../../helpers/test/cache';
import { addKeysToUserKeysCache } from '../../../helpers/test/crypto';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../helpers/test/crypto';
import { contactID, receiver, sender, setupContactsForPinKeys } from '../../../helpers/test/pinKeys';
import { render, tick } from '../../../helpers/test/render';
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

    const setup = async (hasFingerprint: boolean) => {
        minimalCache();
        addToCache('Addresses', [{ Email: receiver.Address } as Address]);

        const { receiverKeys, senderKeys } = await setupContactsForPinKeys(hasFingerprint);

        addApiMock('core/v4/keys', () => ({ Keys: [senderKeys] }));
        addApiMock(
            'contacts/v4/contacts/emails',
            () => ({
                ContactEmails: [{ Email: sender.Address, ContactID: contactID } as ContactEmail] as ContactEmail[],
            }),
            'get'
        );

        const updateSpy = jest.fn();
        addApiMock(`contacts/v4/contacts/${contactID}`, updateSpy, 'put');

        addKeysToUserKeysCache(receiverKeys);

        const onResignSpy = jest.fn();

        const container = await render(
            <ContactResignModal title={title} contacts={contacts} onResign={onResignSpy} open>
                {children}
            </ContactResignModal>,
            false
        );

        return { container, senderKeys, updateSpy, onResignSpy };
    };

    it('should resign the contact and render email rows', async () => {
        const {
            container: { getByText, getByTestId },
            senderKeys,
            updateSpy,
            onResignSpy,
        } = await setup(true);

        // Modal and content are displayed
        getByText(title);
        getByText(children);

        // Email rows are rendered (Email + fingerprints)
        await waitFor(() => getByText(`${sender.Address}:`));
        const expectedFingerPrint = senderKeys.publicKeys[0].getFingerprint();
        getByText(expectedFingerPrint);

        // Click on Re-sign button
        const resignButton = getByTestId('resign-contact');
        fireEvent.click(resignButton);
        await tick();

        // Contact update is called
        expect(updateSpy).toHaveBeenCalled();

        // Optional on Resign action is called
        expect(onResignSpy).toHaveBeenCalled();
    });

    it('should resign the contact not render email rows', async () => {
        const {
            container: { getByText, queryByText, getByTestId },
            updateSpy,
            onResignSpy,
        } = await setup(false);

        // Modal and content are displayed
        getByText(title);
        getByText(children);

        // Email rows are not rendered
        const emailRow = queryByText(`${sender.Address}:`);
        expect(emailRow).toBeNull();

        // Click on Re-sign button
        const resignButton = getByTestId('resign-contact');
        fireEvent.click(resignButton);
        await tick();

        // Contact update is called
        expect(updateSpy).toHaveBeenCalled();

        // Optional on Resign action is called
        expect(onResignSpy).toHaveBeenCalled();
    });
});
