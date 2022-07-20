import { API_CODES, CONTACT_CARD_TYPE } from '@proton/shared/lib/constants';
import { CryptoProxy } from '@proton/crypto';
import { parseToVCard } from '@proton/shared/lib/contacts/vcard';
import { fireEvent, waitFor } from '@testing-library/react';
import { api, clearAll, mockedCryptoApi, notificationManager, render } from '../tests/render';
import ContactEditModal, { ContactEditModalProps, ContactEditProps } from './ContactEditModal';

describe('ContactEditModal', () => {
    const props: ContactEditProps & ContactEditModalProps = {
        contactID: 'ContactID',
        vCardContact: { fn: [] },
        onUpgrade: jest.fn(),
        onSelectImage: jest.fn(),
        onGroupEdit: jest.fn(),
    };

    beforeAll(() => {
        CryptoProxy.setEndpoint(mockedCryptoApi);
    });

    beforeEach(clearAll);

    afterAll(async () => {
        await CryptoProxy.releaseEndpoint();
    });

    it('should prefill all fields with contact values', async () => {
        const vcard = `BEGIN:VCARD
VERSION:4.0
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
FN:J. Doe
FN:FN2
EMAIL:jdoe@example.com
NOTE:TestNote
ADR:1;2;3;4;5;6;7
ADR:;;;;;;testadr
TEL:testtel
PHOTO:https://example.com/myphoto.jpg
END:VCARD`;

        const vCardContact = parseToVCard(vcard);

        const { getByDisplayValue } = render(<ContactEditModal open={true} {...props} vCardContact={vCardContact} />);

        getByDisplayValue('J. Doe');
        expect(document.querySelector('img[src="https://example.com/myphoto.jpg"]')).not.toBe(null);
        getByDisplayValue('FN2');
        getByDisplayValue('jdoe@example.com');
        getByDisplayValue('testtel');
        getByDisplayValue('1');
        getByDisplayValue('4');
        getByDisplayValue('5');
        getByDisplayValue('6');
        getByDisplayValue('7');
        getByDisplayValue('testadr');
        getByDisplayValue('TestNote');
    });

    it('should update basic properties', async () => {
        const vcard = `BEGIN:VCARD
VERSION:4.0
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
FN:J. Doe
EMAIL:jdoe@example.com
TEL:testtel
NOTE:TestNote
END:VCARD`;

        const vCardContact = parseToVCard(vcard);

        const saveRequestSpy = jest.fn();

        api.mockImplementation(async (args: any): Promise<any> => {
            if (args.url === 'contacts/v4/contacts') {
                saveRequestSpy(args.data);
                return { Responses: [{ Response: { Code: API_CODES.SINGLE_SUCCESS } }] };
            }
        });

        const { getByDisplayValue, getByTestId, getByText } = render(
            <ContactEditModal open={true} {...props} vCardContact={vCardContact} />
        );

        const name = getByDisplayValue('J. Doe');
        fireEvent.change(name, { target: { value: 'New name' } });

        const email = getByDisplayValue('jdoe@example.com');
        fireEvent.change(email, { target: { value: 'new@email.com' } });

        const tel = getByDisplayValue('testtel');
        fireEvent.change(tel, { target: { value: 'newtel' } });

        const note = getByDisplayValue('TestNote');
        fireEvent.change(note, { target: { value: 'NewNote' } });

        const addButton = getByTestId('add-other');
        fireEvent.click(addButton);

        const properties = document.querySelectorAll('[data-contact-property-id]');
        const newProperty = properties[properties.length - 1];
        const typeSelect = newProperty.querySelector('button.select');
        fireEvent.click(typeSelect as Element);
        const titleOption = document.querySelector('.dropdown button[title="Title"]');
        fireEvent.click(titleOption as Element);

        const titleInput = getByTestId('Title');
        fireEvent.change(titleInput, { target: { value: 'NewTitle' } });

        const saveButton = getByText('Save');
        fireEvent.click(saveButton);

        await waitFor(() => {
            if (notificationManager.createNotification.mock.calls.length > 0) {
                throw new Error();
            }
        });

        const sentData = saveRequestSpy.mock.calls[0][0];
        const cards = sentData.Contacts[0].Cards;

        const signedCardContent = cards.find(
            ({ Type }: { Type: CONTACT_CARD_TYPE }) => Type === CONTACT_CARD_TYPE.SIGNED
        ).Data;

        const encryptedCardContent = cards.find(
            ({ Type }: { Type: CONTACT_CARD_TYPE }) => Type === CONTACT_CARD_TYPE.ENCRYPTED_AND_SIGNED
        ).Data;

        const expectedSignedCard = `BEGIN:VCARD
VERSION:4.0
FN;PREF=1:New name
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
ITEM1.EMAIL;PREF=1:new@email.com
END:VCARD`.replaceAll('\n', '\r\n');

        const expectedEncryptedCard = `BEGIN:VCARD
VERSION:4.0
TEL;PREF=1:newtel
NOTE:NewNote
TITLE:NewTitle
END:VCARD`.replaceAll('\n', '\r\n');

        expect(signedCardContent).toBe(expectedSignedCard);
        expect(encryptedCardContent).toBe(expectedEncryptedCard);
    });

    it('should create a contact', async () => {
        const saveRequestSpy = jest.fn();

        api.mockImplementation(async (args: any): Promise<any> => {
            if (args.url === 'contacts/v4/contacts') {
                saveRequestSpy(args.data);
                return { Responses: [{ Response: { Code: API_CODES.SINGLE_SUCCESS } }] };
            }
        });

        const { getByTestId, getByText } = render(<ContactEditModal open={true} {...props} />);

        const name = getByTestId('Name');
        fireEvent.change(name, { target: { value: 'New name' } });

        const email = getByTestId('Email');
        fireEvent.change(email, { target: { value: 'new@email.com' } });

        const saveButton = getByText('Save');
        fireEvent.click(saveButton);

        await waitFor(() => expect(notificationManager.createNotification).toHaveBeenCalled());

        const sentData = saveRequestSpy.mock.calls[0][0];
        const cards = sentData.Contacts[0].Cards;

        const signedCardContent = cards.find(
            ({ Type }: { Type: CONTACT_CARD_TYPE }) => Type === CONTACT_CARD_TYPE.SIGNED
        ).Data;

        expect(signedCardContent).toContain('FN;PREF=1:New name');
        expect(signedCardContent).toContain('ITEM1.EMAIL;PREF=1:new@email.com');
    });
});
