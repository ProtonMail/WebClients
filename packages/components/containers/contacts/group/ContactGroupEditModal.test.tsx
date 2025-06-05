import { fireEvent, getByDisplayValue, screen, waitFor } from '@testing-library/react';

import { getModelState } from '@proton/account/test';
import { CryptoProxy } from '@proton/crypto';
import { ACCENT_COLORS } from '@proton/shared/lib/colors';
import { LABEL_TYPE } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import { MAX_RECIPIENTS } from '@proton/shared/lib/mail/mailSettings';
import { addApiMock } from '@proton/testing/lib/api';

import { clearAll, getCard, minimalCache, mockedCryptoApi, renderWithProviders } from '../tests/render';
import type { ContactGroupEditProps } from './ContactGroupEditModal';
import ContactGroupEditModal from './ContactGroupEditModal';

describe('ContactGroupEditModal', () => {
    const props: ContactGroupEditProps = {
        contactGroupID: 'ContactGroupID',
        selectedContactEmails: [],
        onDelayedSave: jest.fn(),
    };

    const group: ContactGroup = {
        ID: 'ContactGroupID',
        Name: 'GroupName',
        Color: 'GroupColor',
        Path: '/ContactGroupID',
        Display: 1,
        Exclusive: 1,
        Notify: 1,
        Order: 1,
        Type: LABEL_TYPE.CONTACT_GROUP,
    };

    const contactEmail1: ContactEmail = {
        ID: 'ContactEmail1',
        Email: 'email1@test.com',
        Name: 'email1',
        Type: [],
        Defaults: 1,
        Order: 1,
        ContactID: 'ContactID',
        LabelIDs: ['ContactGroupID'],
        LastUsedTime: 1,
    };

    const contactEmail2: ContactEmail = {
        ...contactEmail1,
        ID: 'ContactEmail2',
        Email: 'email2@test.com',
        Name: 'email2',
    };

    const contactEmail3: ContactEmail = {
        ...contactEmail1,
        ID: 'ContactEmail3',
        Email: 'email3@test.com',
        Name: 'email3',
    };

    beforeAll(() => {
        CryptoProxy.setEndpoint(mockedCryptoApi);
    });

    beforeEach(clearAll);

    afterAll(async () => {
        await CryptoProxy.releaseEndpoint();
    });

    it('should display a contact group', async () => {
        minimalCache();

        const updateSpy = jest.fn();
        const createContactSpy = jest.fn();
        const labelSpy = jest.fn();
        const unlabelSpy = jest.fn();

        addApiMock(`core/v4/labels/${group.ID}`, (args) => {
            updateSpy(args.data);
            return { Label: { ID: group.ID } };
        });
        addApiMock('contacts/v4/contacts', (args) => {
            createContactSpy(args.data);
            return {};
        });
        addApiMock('contacts/v4/contacts/emails/label', (args) => {
            labelSpy(args.data);
            return {};
        });
        addApiMock('contacts/v4/contacts/emails/unlabel', (args) => {
            unlabelSpy(args.data);
            return {};
        });

        renderWithProviders(<ContactGroupEditModal open={true} {...props} />, {
            preloadedState: {
                mailSettings: getModelState({ RecipientLimit: MAX_RECIPIENTS } as MailSettings),
                contactEmails: getModelState([contactEmail1, contactEmail2, contactEmail3]),
                categories: getModelState([group]),
            },
        });

        const name = document.getElementById('contactGroupName') as HTMLElement;
        fireEvent.change(name, { target: { value: 'NewName' } });

        const colorDropdown = screen.getByTestId('dropdown-button');
        fireEvent.click(colorDropdown);

        const colorButton = document.getElementById('contactGroupColor') as HTMLElement;
        fireEvent.click(colorButton);
        const colorRadio = getByDisplayValue(document.body, ACCENT_COLORS[0]);
        fireEvent.click(colorRadio);

        const removeButtons = screen.getAllByText('Remove');
        fireEvent.click(removeButtons[2]);

        const email = document.getElementById('contactGroupEmail') as HTMLElement;
        fireEvent.change(email, { target: { value: 'email4@test.com' } });

        const addButton = screen.getByText('Add');
        fireEvent.click(addButton);

        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(updateSpy).toHaveBeenCalled();
        });
        await waitFor(() => {
            expect(createContactSpy).toHaveBeenCalled();
        });
        await waitFor(() => {
            expect(labelSpy).toHaveBeenCalled();
        });
        await waitFor(() => {
            expect(unlabelSpy).toHaveBeenCalled();
        });

        const updateData = updateSpy.mock.calls[0][0];
        expect(updateData.Name).toBe('NewName');
        expect(updateData.Color).toBe(ACCENT_COLORS[0]);

        const createContactData = createContactSpy.mock.calls[0][0];
        const cards = createContactData.Contacts[0].Cards;
        const signed = getCard(cards);
        expect(signed).toContain('ITEM1.EMAIL;PREF=1:email4@test.com');

        const labelData = labelSpy.mock.calls[0][0];
        expect(labelData.ContactEmailIDs).toEqual([contactEmail1.ID, contactEmail2.ID]);

        const unlabelData = unlabelSpy.mock.calls[0][0];
        expect(unlabelData.ContactEmailIDs).toEqual([contactEmail3.ID]);
    });

    it('should be able to add all contacts and manually adding an email address', async () => {
        minimalCache();

        const contacts = [contactEmail1, contactEmail2, contactEmail3];

        renderWithProviders(<ContactGroupEditModal open={true} {...props} />, {
            preloadedState: {
                mailSettings: getModelState({ RecipientLimit: MAX_RECIPIENTS } as MailSettings),
                contactEmails: getModelState(contacts),
                categories: getModelState([group]),
            },
        });

        const name = document.getElementById('contactGroupName') as HTMLElement;
        fireEvent.change(name, { target: { value: 'NewName' } });

        // Add all contacts
        contacts.forEach((contact) => {
            const email = document.getElementById('contactGroupEmail') as HTMLElement;
            fireEvent.change(email, { target: { value: contact.Email } });

            const addButton = screen.getByText('Add');
            fireEvent.click(addButton);
        });

        // Add manually an email address in the group
        const email = document.getElementById('contactGroupEmail') as HTMLElement;
        fireEvent.change(email, { target: { value: 'email4@test.com' } });

        const addButton = screen.getByText('Add');
        fireEvent.click(addButton);
    });
});
