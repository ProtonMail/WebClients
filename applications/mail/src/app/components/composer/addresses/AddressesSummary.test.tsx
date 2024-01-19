import { screen } from '@testing-library/react';

import { ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import noop from '@proton/utils/noop';

import { getRecipientLabel } from '../../../helpers/message/messageRecipients';
import { clearAll, render } from '../../../helpers/test/helper';
import { RecipientType } from '../../../models/address';
import { refresh } from '../../../store/contacts/contactsActions';
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
    beforeAll(clearAll);
    const composerID = 'composer-test-id';

    it('should render a recipient', async () => {
        await render(<AddressesSummary {...props} composerID={composerID} />, {
            onStore: (store) => {
                prepareMessage(
                    store,
                    {
                        data: {
                            ToList: [recipient],
                        },
                    },
                    composerID
                );
                store.dispatch(refresh({ contacts: [], contactGroups: [group] }));
            },
        });
        screen.getByText(recipientLabel);
    });

    it('should render a group', async () => {
        await render(<AddressesSummary {...props} composerID={composerID} />, {
            onStore: (store) => {
                prepareMessage(
                    store,
                    {
                        data: {
                            ToList: [recipientGroup],
                        },
                    },
                    composerID
                );

                store.dispatch(refresh({ contacts: [], contactGroups: [group] }));
            },
        });
        screen.getByText(group.Name, { exact: false });
    });

    it('should render a recipient and a group', async () => {
        await render(<AddressesSummary {...props} composerID={composerID} />, {
            onStore: (store) => {
                prepareMessage(
                    store,
                    {
                        data: {
                            ToList: [recipient, recipientGroup],
                        },
                    },
                    composerID
                );
                store.dispatch(refresh({ contacts: [], contactGroups: [group] }));
            },
        });

        screen.getByText(recipientLabel);
        screen.getByText(group.Name, { exact: false });
    });
});
