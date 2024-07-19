import { getModelState } from '@proton/account/test';
import { LABEL_TYPE } from '@proton/shared/lib/constants';
import type { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';

import { clearAll, minimalCache, renderWithProviders } from '../tests/render';
import type { ContactGroupDetailsProps } from './ContactGroupDetailsModal';
import ContactGroupDetailsModal from './ContactGroupDetailsModal';

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

        const { getByText } = renderWithProviders(<ContactGroupDetailsModal open={true} {...props} />, {
            preloadedState: {
                contactEmails: getModelState([contactEmail1, contactEmail2, contactEmail3]),
                categories: getModelState([group]),
            },
        });

        getByText(group.Name);
        getByText('3 email addresses');
        getByText(contactEmail1.Name);
        getByText(contactEmail2.Name);
        getByText(contactEmail3.Name);
    });
});
