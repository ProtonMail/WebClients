import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import React from 'react';
import { noop } from 'proton-shared/lib/helpers/function';
import { clearAll, contactCache, render } from '../../../helpers/test/helper';
import AddressesSummary from './AddressesSummary';
import { getRecipientLabel } from '../../../helpers/addresses';

const message = {} as Message;
const props = { message, contacts: [], contactGroups: [], onFocus: noop, toggleExpanded: noop };
const recipient = { Name: 'RecipientName', Address: 'Address' };
const recipientLabel = getRecipientLabel(recipient, {}) || '';
const recipientGroup = { Name: 'RecipientName', Address: 'Address', Group: 'GroupPath' };
const group = { Name: 'GroupName', Path: 'GroupPath' };

describe('AddressesSummary', () => {
    beforeEach(() => {
        contactCache.contactGroupsMap[group.Path] = group;
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
