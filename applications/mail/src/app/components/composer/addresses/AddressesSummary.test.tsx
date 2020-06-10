import React from 'react';
import { clearAll, render } from '../../../helpers/test/helper';
import AddressesSummary from './AddressesSummary';
import { MessageExtended } from '../../../models/message';
import { noop } from 'proton-shared/lib/helpers/function';
import { getRecipientLabel } from '../../../helpers/addresses';
import { ContactGroup } from 'proton-shared/lib/interfaces/contacts';

const message = {} as MessageExtended;
const props = { message, contacts: [], contactGroups: [], onFocus: noop };
const recipient = { Name: 'RecipientName', Address: 'Address' };
const recipientLabel = getRecipientLabel(recipient) || '';
const recipientGroup = { Name: 'RecipientName', Address: 'Address', Group: 'GroupPath' };
const group = { Name: 'GroupName', Path: 'GroupPath' };
const contactGroups = [group] as ContactGroup[];

describe('AddressesSummary', () => {
    afterEach(() => clearAll());

    it('should render a recipient', async () => {
        const message = ({ localID: 'localID', data: { ToList: [recipient] } } as any) as MessageExtended;

        const { getByText } = await render(<AddressesSummary {...props} message={message} />);

        getByText(recipientLabel);
    });

    it('should render a group', async () => {
        const message = ({ localID: 'localID', data: { ToList: [recipientGroup] } } as any) as MessageExtended;

        const { getByText } = await render(
            <AddressesSummary {...props} message={message} contactGroups={contactGroups} />
        );

        getByText(group.Name, { exact: false });
    });

    it('should render a recipient and a group', async () => {
        const message = ({
            localID: 'localID',
            data: { ToList: [recipient, recipientGroup] }
        } as any) as MessageExtended;

        const { getByText } = await render(
            <AddressesSummary {...props} message={message} contactGroups={contactGroups} />
        );

        getByText(recipientLabel);
        getByText(group.Name, { exact: false });
    });
});
