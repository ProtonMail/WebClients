import { ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import noop from '@proton/utils/noop';

import { getRecipientLabel } from '../../../helpers/addresses';
import { clearAll, render } from '../../../helpers/test/helper';
import { refresh } from '../../../logic/contacts/contactsActions';
import { store } from '../../../logic/store';
import AddressesSummary from './AddressesSummary';

const message = {} as Message;
const props = {
    message,
    contacts: [],
    contactGroups: [],
    onFocus: noop,
    toggleExpanded: noop,
    disabled: false,
    handleContactModal: jest.fn(),
};
const recipient = { Name: 'RecipientName', Address: 'Address' };
const recipientLabel = getRecipientLabel(recipient, {}) || '';
const recipientGroup = { Name: 'RecipientName', Address: 'Address', Group: 'GroupPath' };
const group = { Name: 'GroupName', Path: 'GroupPath' } as ContactGroup;

describe('AddressesSummary', () => {
    beforeEach(() => {
        store.dispatch(refresh({ contacts: [], contactGroups: [group] }));
    });

    afterEach(clearAll);

    it('should render a recipient', async () => {
        const message = { ToList: [recipient] } as Message;

        const { getByText } = await render(<AddressesSummary {...props} message={message} />);

        getByText(recipientLabel);
    });

    it('should render a group', async () => {
        const message = { ToList: [recipientGroup] } as Message;

        const { getByText } = await render(<AddressesSummary {...props} message={message} />);

        getByText(group.Name, { exact: false });
    });

    it('should render a recipient and a group', async () => {
        const message = { ToList: [recipient, recipientGroup] } as Message;

        const { getByText } = await render(<AddressesSummary {...props} message={message} />);

        getByText(recipientLabel);
        getByText(group.Name, { exact: false });
    });
});
