import { ACCENT_COLORS, LABEL_TYPE } from '@proton/shared/lib/constants';
import { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import { STATUS } from '@proton/shared/lib/models/cache';
import { CryptoProxy } from '@proton/crypto';
import { fireEvent, getByDisplayValue, waitFor } from '@testing-library/react';
import { api, cache, clearAll, getCard, minimalCache, mockedCryptoApi, render } from '../tests/render';
import ContactGroupEditModal, { ContactGroupEditProps } from './ContactGroupEditModal';

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

        cache.set('Labels', { status: STATUS.RESOLVED, value: [group] });
        cache.set('ContactEmails', { status: STATUS.RESOLVED, value: [contactEmail1, contactEmail2, contactEmail3] });

        const updateSpy = jest.fn();
        const createContactSpy = jest.fn();
        const labelSpy = jest.fn();
        const unlabelSpy = jest.fn();

        api.mockImplementation(async (args: any): Promise<any> => {
            if (args.url === `v4/labels/${group.ID}`) {
                updateSpy(args.data);
                return { Label: { ID: group.ID } };
            }
            if (args.url === 'contacts/v4/contacts') {
                createContactSpy(args.data);
                return {};
            }
            if (args.url === 'contacts/v4/contacts/emails/label') {
                labelSpy(args.data);
                return {};
            }
            if (args.url === 'contacts/v4/contacts/emails/unlabel') {
                unlabelSpy(args.data);
                return {};
            }
        });

        const { getByTestId, getByText, getAllByText } = render(
            <ContactGroupEditModal open={true} {...props} />,
            false
        );

        const name = document.getElementById('contactGroupName') as HTMLElement;
        fireEvent.change(name, { target: { value: 'NewName' } });

        const colorDropdown = getByTestId('dropdown-button');
        fireEvent.click(colorDropdown);

        const colorButton = document.getElementById('contactGroupColor') as HTMLElement;
        fireEvent.click(colorButton);
        const colorRadio = getByDisplayValue(document.body, ACCENT_COLORS[0]);
        fireEvent.click(colorRadio);

        const removeButtons = getAllByText('Remove');
        fireEvent.click(removeButtons[2]);

        const email = document.getElementById('contactGroupEmail') as HTMLElement;
        fireEvent.change(email, { target: { value: 'email4@test.com' } });

        const addButton = getByText('Add');
        fireEvent.click(addButton);

        const saveButton = getByText('Save');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(updateSpy).toHaveBeenCalled();
            expect(createContactSpy).toHaveBeenCalled();
            expect(labelSpy).toHaveBeenCalled();
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
});
