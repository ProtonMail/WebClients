import { contactCache } from '../../../helpers/test/cache';
import { initMessage, setup } from './Message.test.helpers';

describe('Message recipients rendering', () => {
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
        };

        contactCache.contactsMap[Address] = ContactEmail;

        initMessage({ data: { ToList: [{ Name, Address }] } });

        const { getByText, details } = await setup();

        getByText(ContactEmail.Name);

        await details();

        getByText(ContactEmail.Name);
        getByText(Address, { exact: false });
    });

    it('show recipients in a contact group', async () => {
        const Name = 'test-name';
        const Address = 'address@test.com';
        const ContactGroup = {
            ID: 'test-group-id',
            Name: 'test-group-name',
            Path: 'test-group-path',
        };
        const Group = ContactGroup.Path;
        const contacts = [{}, {}, {}];
        const ToList = [
            { Name, Address, Group },
            { Name, Address, Group },
        ];

        contactCache.contactGroupsMap[ContactGroup.Path] = ContactGroup;
        contactCache.groupsWithContactsMap[ContactGroup.ID] = { group: ContactGroup, contacts };

        initMessage({ data: { ToList } });

        const { getByText, details } = await setup();

        const expectation = `${ContactGroup.Name} (${ToList.length}/${contacts.length} Members)`;

        getByText(expectation);

        await details();

        getByText(expectation);
        getByText(`${Address}, ${Address}`);
    });
});
