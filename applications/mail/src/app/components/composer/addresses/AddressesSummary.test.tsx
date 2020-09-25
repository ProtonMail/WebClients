import React from 'react';
import { clearAll, render } from '../../../helpers/test/helper';
import AddressesSummary from './AddressesSummary';
import { Message } from '../../../models/message';
import { noop } from 'proton-shared/lib/helpers/function';
import { getRecipientLabel } from '../../../helpers/addresses';
import { ContactGroup } from 'proton-shared/lib/interfaces/contacts';

const message = {} as Message;
const props = { message, contacts: [], contactGroups: [], onFocus: noop, toggleExpanded: noop };
const recipient = { Name: 'RecipientName', Address: 'Address' };
const recipientLabel = getRecipientLabel(recipient) || '';
const recipientGroup = { Name: 'RecipientName', Address: 'Address', Group: 'GroupPath' };
const group = { Name: 'GroupName', Path: 'GroupPath' };
const contactGroups = [group] as ContactGroup[];

describe('AddressesSummary', () => {
    afterEach(() => clearAll());

    it('should render a recipient', async () => {
        const message = { ToList: [recipient] } as Message;

        const { getByText } = await render(<AddressesSummary {...props} message={message} />);

        getByText(recipientLabel);
    });

    it('should render a group', async () => {
        const message = { ToList: [recipientGroup] } as Message;

        const { getByText } = await render(
            <AddressesSummary {...props} message={message} contactGroups={contactGroups} />
        );

        getByText(group.Name, { exact: false });
    });

    it('should render a recipient and a group', async () => {
        const message = { ToList: [recipient, recipientGroup] } as Message;

        const { getByText } = await render(
            <AddressesSummary {...props} message={message} contactGroups={contactGroups} />
        );

        getByText(recipientLabel);
        getByText(group.Name, { exact: false });
    });
});
