import { act } from 'react';

import { screen } from '@testing-library/react';

import type { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';

import { clearAll } from '../../../helpers/test/helper';
import { refresh } from '../../../store/contacts/contactsActions';
import { setup } from './Message.test.helpers';

describe('Message recipients rendering', () => {
    afterEach(clearAll);

    it('show a recipient not associated with a contact', async () => {
        const Name = 'test-name';
        const Address = 'address@test.com';

        const { details } = await setup({ data: { ToList: [{ Name, Address }] } });

        screen.getByText(Name);

        await details();

        screen.getByText(Name);
        screen.getByText(Address, { exact: false });
    });

    it('show a recipient matching a contact', async () => {
        const Name = 'test-name';
        const Address = 'address@test.com';
        const ContactEmail = {
            Email: Address,
            Name: 'test-contact',
        } as ContactEmail;

        const { store, details } = await setup({ data: { ToList: [{ Name, Address }] } });
        await act(() => store.dispatch(refresh({ contacts: [ContactEmail], contactGroups: [] })));

        screen.getByText(ContactEmail.Name);

        await details();

        screen.getByText(ContactEmail.Name);
        screen.getByText(Address, { exact: false });
    });

    it('show recipients in a contact group partial', async () => {
        const Name = 'test-name';
        const Address = 'address@test.com';
        const ContactGroup = {
            ID: 'test-group-id',
            Name: 'test-group-name',
            Path: 'test-group-path',
        } as ContactGroup;
        const Group = ContactGroup.Path;
        const contacts = [
            { Email: '', LabelIDs: [ContactGroup.ID] },
            { Email: '', LabelIDs: [ContactGroup.ID] },
            { Email: '', LabelIDs: [ContactGroup.ID] },
        ] as ContactEmail[];
        const ToList = [
            { Name, Address, Group },
            { Name, Address, Group },
        ];

        const { store } = await setup({ data: { ToList } });
        await act(() => store.dispatch(refresh({ contacts, contactGroups: [ContactGroup] })));

        const expectation = `${ContactGroup.Name} (${ToList.length}/${contacts.length})`;

        screen.getByText(expectation);
    });

    it('show recipients in a contact group full', async () => {
        const Name = 'test-name';
        const Address = 'address@test.com';
        const ContactGroup = {
            ID: 'test-group-id',
            Name: 'test-group-name',
            Path: 'test-group-path',
        } as ContactGroup;
        const Group = ContactGroup.Path;
        const contacts = [
            { Email: '', LabelIDs: [ContactGroup.ID] },
            { Email: '', LabelIDs: [ContactGroup.ID] },
            { Email: '', LabelIDs: [ContactGroup.ID] },
        ] as ContactEmail[];
        const ToList = [
            { Name, Address, Group },
            { Name, Address, Group },
            { Name, Address, Group },
        ];

        const { store } = await setup({ data: { ToList } });
        act(() => store.dispatch(refresh({ contacts, contactGroups: [ContactGroup] })));

        const expectation = `${ContactGroup.Name} (${contacts.length})`;

        screen.getByText(expectation);
    });
});
