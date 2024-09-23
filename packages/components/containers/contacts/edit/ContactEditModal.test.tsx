import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as userHooks from '@proton/account/user/hooks';
import { CryptoProxy } from '@proton/crypto';
import * as useContactEmailHooks from '@proton/mail/contactEmails/hooks';
import * as mailLabelHooks from '@proton/mail/labels/hooks';
import * as mailSettingsHooks from '@proton/mail/mailSettings/hooks';
import { API_CODES, CONTACT_CARD_TYPE } from '@proton/shared/lib/constants';
import { parseToVCard } from '@proton/shared/lib/contacts/vcard';
import type { MailSettings, UserModel } from '@proton/shared/lib/interfaces';
import type { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import { addApiMock } from '@proton/testing';

import { clearAll, minimalCache, mockedCryptoApi, notificationManager, renderWithProviders } from '../tests/render';
import type { ContactEditModalProps, ContactEditProps } from './ContactEditModal';
import ContactEditModal from './ContactEditModal';

jest.mock('../../../hooks/useAuthentication', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        getUID: jest.fn(),
    })),
}));

jest.mock('../../../hooks/useConfig', () => () => ({ API_URL: 'api' }));

jest.mock('@proton/mail/contactEmails/hooks', () => ({
    __esModule: true,
    ...jest.requireActual('@proton/mail/contactEmails/hooks'),
}));
jest.mock('@proton/mail/labels/hooks', () => ({
    __esModule: true,
    ...jest.requireActual('@proton/mail/labels/hooks'),
}));
jest.mock('@proton/account/user/hooks', () => ({
    __esModule: true,
    ...jest.requireActual('@proton/account/user/hooks'),
}));
jest.mock('@proton/mail/mailSettings/hooks', () => ({
    __esModule: true,
    ...jest.requireActual('@proton/mail/mailSettings/hooks'),
}));

jest.mock('@proton/shared/lib/helpers/image.ts', () => ({
    toImage: (src: string) => ({ src }),
}));

const setupApiMocks = () => {
    const saveRequestSpy = jest.fn();
    addApiMock('contacts/v4/contacts/emails/label', (args) => {
        saveRequestSpy(args.data);
        return { ContactEmailIDs: [], Responses: [{ Response: { Code: API_CODES.SINGLE_SUCCESS } }] };
    });
    addApiMock('contacts/v4/contacts', (args) => {
        saveRequestSpy(args.data);
        return { Contacts: [], Responses: [{ Response: { Code: API_CODES.SINGLE_SUCCESS } }] };
    });
    addApiMock('contacts/v4/contacts/emails', () => {
        return { ContactEmails: [] };
    });
    addApiMock('contacts/v4/contacts/ContactID', (args) => {
        saveRequestSpy(args.data);
        return { Code: API_CODES.SINGLE_SUCCESS };
    });
    return saveRequestSpy;
};

const props: ContactEditProps & ContactEditModalProps = {
    contactID: 'ContactID',
    vCardContact: { fn: [] },
    onUpgrade: jest.fn(),
    onSelectImage: jest.fn(),
    onGroupEdit: jest.fn(),
    onLimitReached: jest.fn(),
};

const groupName = 'Test group';
const mockContactGroup = [
    {
        ID: '5aBZh7oqeAmyL-5p3gggA_Ji5r0m3vfbGruq7dqE8fw7FjskOWBAWrY4X8o62RqlguaTLRMezIP7Q_C8B9Wy8Q==',
        Name: groupName,
        Path: groupName,
        Type: 2,
        Color: '#54473f',
        Order: 1,
        Notify: 0,
        Exclusive: 0,
        Expanded: 0,
        Sticky: 0,
        Display: 1,
    } as ContactGroup,
];
const testEmail = 'testy@mctestface.com';

describe('ContactEditModal', () => {
    beforeAll(() => {
        CryptoProxy.setEndpoint(mockedCryptoApi);
    });

    beforeEach(() => {
        clearAll();
    });

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

        minimalCache();
        setupApiMocks();

        renderWithProviders(<ContactEditModal open={true} {...props} vCardContact={vCardContact} />);

        screen.getByDisplayValue('J. Doe');
        // Wait for image to be loaded
        await waitFor(() => {
            expect(screen.getByRole('presentation')).toHaveAttribute('src', 'https://example.com/myphoto.jpg');
        });
        screen.getByDisplayValue('FN2');
        screen.getByDisplayValue('jdoe@example.com');
        screen.getByDisplayValue('testtel');
        screen.getByDisplayValue('1');
        screen.getByDisplayValue('4');
        screen.getByDisplayValue('5');
        screen.getByDisplayValue('6');
        screen.getByDisplayValue('7');
        screen.getByDisplayValue('testadr');
        screen.getByDisplayValue('TestNote');
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

        minimalCache();
        const saveRequestSpy = setupApiMocks();

        renderWithProviders(<ContactEditModal open={true} {...props} vCardContact={vCardContact} />);

        const name = screen.getByDisplayValue('J. Doe');
        await userEvent.clear(name);
        await userEvent.type(name, 'New name');

        const email = screen.getByDisplayValue('jdoe@example.com');
        await userEvent.clear(email);
        await userEvent.type(email, 'new@email.com');

        const tel = screen.getByDisplayValue('testtel');
        await userEvent.clear(tel);
        await userEvent.type(tel, 'newtel');

        const note = screen.getByDisplayValue('TestNote');
        await userEvent.clear(note);
        await userEvent.type(note, 'NewNote');

        await userEvent.click(screen.getByTestId('add-other'));
        await userEvent.click(screen.getByTestId('create-contact:other-info-select'));
        await userEvent.click(screen.getByTestId('create-contact:dropdown-item-Title'));
        await userEvent.type(screen.getByTestId('Title'), 'NewTitle');

        await userEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => {
            expect(notificationManager.createNotification).toHaveBeenCalled();
        });

        const sentData = saveRequestSpy.mock.calls[0][0];
        const cards = sentData.Cards;

        const signedCardContent = cards.find(
            ({ Type }: { Type: CONTACT_CARD_TYPE }) => Type === CONTACT_CARD_TYPE.SIGNED
        ).Data;

        const encryptedCardContent = cards.find(
            ({ Type }: { Type: CONTACT_CARD_TYPE }) => Type === CONTACT_CARD_TYPE.ENCRYPTED_AND_SIGNED
        ).Data;

        const expectedSignedCard = `BEGIN:VCARD
VERSION:4.0
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
FN;PREF=1:New name
ITEM1.EMAIL;PREF=1:new@email.com
END:VCARD`.replaceAll('\n', '\r\n');

        const expectedEncryptedCard = `BEGIN:VCARD
VERSION:4.0
TEL;PREF=1:newtel
NOTE:NewNote
N:;;;;
TITLE:NewTitle
END:VCARD`.replaceAll('\n', '\r\n');

        expect(signedCardContent).toBe(expectedSignedCard);
        expect(encryptedCardContent).toBe(expectedEncryptedCard);
    });

    it('should create a contact', async () => {
        minimalCache();
        const saveRequestSpy = setupApiMocks();
        renderWithProviders(<ContactEditModal open={true} {...props} />);

        const firstName = screen.getByTestId('First name');
        await userEvent.type(firstName, 'Bruno');

        const lastName = screen.getByTestId('Last name');
        await userEvent.type(lastName, 'Mars');

        const displayName = screen.getByTestId('Enter a display name or nickname');
        await userEvent.type(displayName, 'New name');

        const email = screen.getByTestId('Email');
        await userEvent.type(email, 'new@email.com');

        const saveButton = screen.getByRole('button', { name: 'Save' });
        await userEvent.click(saveButton);

        await waitFor(() => expect(notificationManager.createNotification).toHaveBeenCalled());

        const sentData = saveRequestSpy.mock.calls[0][0];
        const cards = sentData.Cards;

        const signedCardContent = cards.find(
            ({ Type }: { Type: CONTACT_CARD_TYPE }) => Type === CONTACT_CARD_TYPE.SIGNED
        ).Data;

        const encryptedCardContent = cards.find(
            ({ Type }: { Type: CONTACT_CARD_TYPE }) => Type === CONTACT_CARD_TYPE.ENCRYPTED_AND_SIGNED
        ).Data;

        expect(signedCardContent).toContain('FN;PREF=1:New name');
        expect(signedCardContent).toContain('ITEM1.EMAIL;PREF=1:new@email.com');
        expect(encryptedCardContent).toContain('N:Mars;Bruno;;;');
    });

    it('should trigger an error if all of the name fields are empty when creating a contact', async () => {
        setupApiMocks();
        renderWithProviders(<ContactEditModal open={true} {...props} />);

        const saveButton = screen.getByRole('button', { name: 'Save' });
        await userEvent.click(saveButton);

        const errorZone = screen.getByText('Please provide either a first name, a last name or a display name');
        expect(errorZone).toBeVisible();
    });

    it('should trigger an error if display name is empty when editing a contact', async () => {
        const vcard = `BEGIN:VCARD
VERSION:4.0
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
EMAIL:jdoe@example.com
END:VCARD`;

        setupApiMocks();
        const vCardContact = parseToVCard(vcard);

        renderWithProviders(<ContactEditModal open={true} {...props} vCardContact={vCardContact} />);

        const saveButton = screen.getByRole('button', { name: 'Save' });
        await userEvent.click(saveButton);

        const errorZone = screen.getByText('This field is required');
        expect(errorZone).toBeVisible();
    });

    it('should add user to a group at creation', async () => {
        // Mocking is a code smell (https://medium.com/javascript-scene/mocking-is-a-code-smell-944a70c90a6a)
        // but I don't think we could test this without these mocks.
        jest.spyOn(mailLabelHooks, 'useContactGroups').mockImplementation(() => [mockContactGroup, true]);
        jest.spyOn(useContactEmailHooks, 'useContactEmails').mockReturnValue([
            [{ Email: testEmail, Name: 'Testy McTestFace' } as ContactEmail],
            false,
        ]);
        jest.spyOn(mailSettingsHooks, 'useMailSettings').mockImplementation(() => [
            { RecipientLimit: 100 } as MailSettings,
            true,
        ]);
        jest.spyOn(userHooks, 'useUser').mockImplementation(() => [{ hasPaidMail: true } as UserModel, true]);

        const saveRequestSpy = setupApiMocks();

        renderWithProviders(<ContactEditModal open={true} {...{ ...props, contactID: '' }} />);

        await userEvent.type(screen.getByTestId('First name'), 'Testy');
        await userEvent.type(screen.getByTestId('Last name'), 'McTestFace');
        await userEvent.type(screen.getByTestId('Email'), testEmail);
        await userEvent.click(screen.getByRole('button', { name: 'Contact group' }));
        await userEvent.click(screen.getByRole('checkbox', { name: groupName }));
        await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => {
            expect(notificationManager.createNotification).toHaveBeenCalled();
        });

        // The first call, to the contacts endpoint to save the contact, always happens.
        // The second call only happens when adding a user to a group. Therefore, checking
        // the call length is 2 is enough to verify that the user has been added to a group.
        expect(saveRequestSpy.mock.calls).toHaveLength(2);
    });
});
