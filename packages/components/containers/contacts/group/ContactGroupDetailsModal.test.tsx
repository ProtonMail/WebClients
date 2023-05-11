import { LABEL_TYPE } from '@proton/shared/lib/constants';
import { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import { STATUS } from '@proton/shared/lib/models/cache';

import { cache, clearAll, minimalCache, render } from '../tests/render';
import ContactGroupDetailsModal, { ContactGroupDetailsProps } from './ContactGroupDetailsModal';

describe('ContactGroupDetailsModal', () => {
    const props: ContactGroupDetailsProps = {
        contactGroupID: 'ContactGroupID',
        onEdit: jest.fn(),
        onDelete: jest.fn(),
        onExport: jest.fn(),
        onUpgrade: jest.fn(),
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

    beforeEach(clearAll);

    it('should display a contact group', async () => {
        minimalCache();

        cache.set('Labels', { status: STATUS.RESOLVED, value: [group] });
        cache.set('ContactEmails', { status: STATUS.RESOLVED, value: [contactEmail1, contactEmail2, contactEmail3] });

        const { getByText } = render(<ContactGroupDetailsModal open={true} {...props} />, false);

        getByText(group.Name);
        getByText('3 email addresses');
        getByText(contactEmail1.Name);
        getByText(contactEmail2.Name);
        getByText(contactEmail3.Name);
    });
});
