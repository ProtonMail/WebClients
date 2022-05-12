import { CryptoProxy } from '@proton/crypto';
import { API_CODES, CONTACT_CARD_TYPE } from '@proton/shared/lib/constants';
import { parseToVCard } from '@proton/shared/lib/contacts/vcard';
import { VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';
import { fireEvent, getByTitle, waitFor } from '@testing-library/react';
import { api, clearAll, notificationManager, render, mockedCryptoApi } from '../tests/render';
import ContactEmailSettingsModal, { ContactEmailSettingsProps } from './ContactEmailSettingsModal';

describe('ContactEmailSettingsModal', () => {
    const props: ContactEmailSettingsProps = {
        contactID: 'ContactID',
        vCardContact: { fn: [] },
        emailProperty: {} as VCardProperty<string>,
        onClose: jest.fn(),
    };

    beforeAll(() => {
        CryptoProxy.setEndpoint(mockedCryptoApi);
    });

    beforeEach(clearAll);

    afterAll(async () => {
        await CryptoProxy.releaseEndpoint();
    });

    it('should save a contact with updated email settings', async () => {
        const vcard = `BEGIN:VCARD
VERSION:4.0
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
FN;PREF=1:J. Doe
ITEM1.EMAIL;PREF=1:jdoe@example.com
END:VCARD`;

        const vCardContact = parseToVCard(vcard);

        const saveRequestSpy = jest.fn();

        api.mockImplementation(async (args: any): Promise<any> => {
            if (args.url === 'keys') {
                return { Keys: [] };
            }
            if (args.url === 'contacts/v4/contacts') {
                saveRequestSpy(args.data);
                return { Responses: [{ Response: { Code: API_CODES.SINGLE_SUCCESS } }] };
            }
        });

        const { getByText } = render(
            <ContactEmailSettingsModal
                open={true}
                {...props}
                vCardContact={vCardContact}
                emailProperty={vCardContact.email?.[0] as VCardProperty<string>}
            />
        );

        const showMoreButton = getByText('Show advanced PGP settings');
        await waitFor(() => expect(showMoreButton).not.toBeDisabled());
        fireEvent.click(showMoreButton);

        const signToggleLabel = getByText('Sign emails');
        fireEvent.click(signToggleLabel);

        const pgpSelect = getByText('Use global default', { exact: false });
        fireEvent.click(pgpSelect);

        const pgpInlineOption = getByTitle(document.body, 'PGP/Inline');
        fireEvent.click(pgpInlineOption);

        const saveButton = getByText('Save');
        fireEvent.click(saveButton);

        await waitFor(() => expect(notificationManager.createNotification).toHaveBeenCalled());

        const sentData = saveRequestSpy.mock.calls[0][0];
        const cards = sentData.Contacts[0].Cards;

        const expectedEncryptedCard = `BEGIN:VCARD
VERSION:4.0
FN;PREF=1:J. Doe
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
ITEM1.EMAIL;PREF=1:jdoe@example.com
ITEM1.X-PM-MIMETYPE:text/plain
ITEM1.X-PM-ENCRYPT:false
ITEM1.X-PM-SIGN:true
ITEM1.X-PM-SCHEME:pgp-inline
END:VCARD`.replaceAll('\n', '\r\n');

        const signedCardContent = cards.find(
            ({ Type }: { Type: CONTACT_CARD_TYPE }) => Type === CONTACT_CARD_TYPE.SIGNED
        ).Data;

        expect(signedCardContent).toBe(expectedEncryptedCard);
    });
});
