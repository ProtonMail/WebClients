import { screen } from '@testing-library/react';

import { ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import noop from '@proton/utils/noop';

import { getRecipientLabel } from '../../../helpers/message/messageRecipients';
import { clearAll, render } from '../../../helpers/test/helper';
import { refresh } from '../../../logic/contacts/contactsActions';
import { store } from '../../../logic/store';
import { RecipientType } from '../../../models/address';
import { prepareMessage } from '../tests/Composer.test.helpers';
import AddressesSummary from './AddressesSummary';

const message = {} as Message;
const props = {
    message,
    contacts: [],
    contactGroups: [],
    onFocus: noop,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    toggleExpanded: (_type: RecipientType) => noop,
    disabled: false,
    handleContactModal: jest.fn(),
};
const recipient = { Name: 'RecipientName', Address: 'Address' };
const recipientLabel = getRecipientLabel(recipient, {}) || '';
const recipientGroup = { Name: 'RecipientName', Address: 'Address', Group: 'GroupPath' };
const group = { Name: 'GroupName', Path: 'GroupPath' } as ContactGroup;

describe('AddressesSummary', () => {
    beforeEach(clearAll);
    beforeEach(() => {
        store.dispatch(refresh({ contacts: [], contactGroups: [group] }));
    });
    beforeAll(clearAll);

    it('should render a recipient', async () => {
        const { composerID } = prepareMessage({
            data: {
                ToList: [recipient],
            },
        });

        await render(<AddressesSummary {...props} composerID={composerID} />);
        screen.getByText(recipientLabel);
    });

    it('should render a group', async () => {
        const { composerID } = prepareMessage({
            data: {
                ToList: [recipientGroup],
            },
        });

        await render(<AddressesSummary {...props} composerID={composerID} />);
        screen.getByText(group.Name, { exact: false });
    });

    it('should render a recipient and a group', async () => {
        const { composerID } = prepareMessage({
            data: {
                ToList: [recipient, recipientGroup],
            },
        });

        await render(<AddressesSummary {...props} composerID={composerID} />);
        screen.getByText(recipientLabel);
        screen.getByText(group.Name, { exact: false });
    });
});
