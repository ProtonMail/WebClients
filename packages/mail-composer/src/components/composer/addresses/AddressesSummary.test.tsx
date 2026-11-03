import { screen } from '@testing-library/react';

import { getRecipientLabel } from '@proton/mail-message/helpers/message/messageRecipients';
import type { RecipientType } from '@proton/mail-message/models/address';
import { refresh } from '@proton/mail-message/store/contacts/contactsActions';
import type { ContactGroup } from '@proton/shared/lib/interfaces/contacts/Contact';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import noop from '@proton/utils/noop';

import { prepareComposerMessage } from '../../../test-helpers/composer';
import { clearAll } from '../../../test-helpers/helpers';
import { composerTestRender } from '../../../test-helpers/render';
import AddressesSummary from './AddressesSummary';

const message = {} as Message;
const props = {
    message,
    contacts: [],
    contactGroups: [],
    onFocus: noop,
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
        await composerTestRender(<AddressesSummary {...props} composerID={composerID} />, {
            onStore: (store) => {
                prepareComposerMessage(
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
        await composerTestRender(<AddressesSummary {...props} composerID={composerID} />, {
            onStore: (store) => {
                prepareComposerMessage(
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
        await composerTestRender(<AddressesSummary {...props} composerID={composerID} />, {
            onStore: (store) => {
                prepareComposerMessage(
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

    it('should keep CC and BCC buttons reachable with the keyboard', async () => {
        await composerTestRender(<AddressesSummary {...props} composerID={composerID} />, {
            onStore: (store) => {
                prepareComposerMessage(store, { data: { ToList: [recipient] } }, composerID);
            },
        });
        expect(screen.getByRole('button', { name: 'CC' })).toBe(screen.getByTestId('composer:recipients:cc-button'));
        expect(screen.getByRole('button', { name: 'BCC' })).toBe(screen.getByTestId('composer:recipients:bcc-button'));
        expect(screen.getByTestId('composer:recipients:cc-button')).not.toHaveAttribute('tabindex', '-1');
        expect(screen.getByTestId('composer:recipients:bcc-button')).not.toHaveAttribute('tabindex', '-1');
    });
});
