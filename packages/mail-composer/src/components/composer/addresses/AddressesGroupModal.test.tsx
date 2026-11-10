import { screen } from '@testing-library/react';

import type { RecipientGroup } from '@proton/mail-message/models/address';
import type { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts/Contact';
import noop from '@proton/utils/noop';

import { clearAll } from '../../../test-helpers/helpers';
import { composerTestRender } from '../../../test-helpers/render';
import AddressesGroupModal from './AddressesGroupModal';

const group = { ID: 'group', Name: 'Team', Path: 'Team' } as ContactGroup;

const getContact = (name: string) =>
    ({ ID: name, Name: name, Email: `${name}@example.com`, LabelIDs: [group.ID] }) as ContactEmail;

const renderModal = (contacts: ContactEmail[]) => {
    const recipientGroup: RecipientGroup = {
        group,
        recipients: contacts.map(({ Name, Email }) => ({ Name, Address: Email, Group: group.Path })),
    };

    const modalProps = { open: true, onClose: noop };

    return composerTestRender(
        <AddressesGroupModal recipientGroup={recipientGroup} contacts={contacts} onSubmit={noop} {...modalProps} />
    );
};

describe('AddressesGroupModal', () => {
    beforeEach(clearAll);

    it('should say "member" in the title when the group has one member', async () => {
        await renderModal([getContact('bob')]);

        expect(screen.getByText('Team (1 member)')).toBeInTheDocument();
    });

    it('should say "members" in the title when the group has several members', async () => {
        await renderModal([getContact('bob'), getContact('alice')]);

        expect(screen.getByText('Team (2 members)')).toBeInTheDocument();
    });
});
