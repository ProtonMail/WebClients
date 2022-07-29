import { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';

import { clearAll } from '../../../helpers/test/helper';
import { refresh } from '../../../logic/contacts/contactsActions';
import { store } from '../../../logic/store';
import { initMessage, setup } from './Message.test.helpers';

describe('Message recipients rendering', () => {
    afterEach(clearAll);

    it('show a recipient not associated with a contact', async () => {
        const Name = 'test-name';
        const Address = 'address@test.com';

        initMessage({ data: { ToList: [{ Name, Address }] } });

        const { getByText, details } = await setup();

        getByText(Name);

        await details();

        getByText(Name);
        getByText(Address, { exact: false });
    });

    it('show a recipient matching a contact', async () => {
        const Name = 'test-name';
        const Address = 'address@test.com';
        const ContactEmail = {
            Email: Address,
            Name: 'test-contact',
        } as ContactEmail;

        store.dispatch(refresh({ contacts: [ContactEmail], contactGroups: [] }));

        initMessage({ data: { ToList: [{ Name, Address }] } });

        const { getByText, details } = await setup();

        getByText(ContactEmail.Name);

        await details();

        getByText(ContactEmail.Name);
        getByText(Address, { exact: false });
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

        store.dispatch(refresh({ contacts, contactGroups: [ContactGroup] }));

        initMessage({ data: { ToList } });

        const { getByText } = await setup();

        const expectation = `${ContactGroup.Name} (${ToList.length}/${contacts.length})`;

        getByText(expectation);
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

        store.dispatch(refresh({ contacts, contactGroups: [ContactGroup] }));

        initMessage({ data: { ToList } });

        const { getByText } = await setup();

        const expectation = `${ContactGroup.Name} (${contacts.length})`;

        getByText(expectation);
    });
});
