import React from 'react';
import { fireEvent } from '@testing-library/react';
import MailboxContainer from '../MailboxContainer';
import { render, addApiMock, clearAll, addToCache } from '../../../helpers/test/helper';
import { props } from './Mailbox.test.helpers';

describe('Mailbox elements selection', () => {
    const conversationsResult = {
        Total: 2,
        Conversations: [
            { ID: '1', Labels: [{ ID: props.labelID }] },
            { ID: '2', Labels: [{ ID: props.labelID }] },
        ],
    };

    beforeEach(() => {
        clearAll();
        addToCache('Labels', []);
        addApiMock('mail/v4/messages/count', () => ({}));
        addApiMock('mail/v4/conversations/count', () => ({}));
    });

    it('should show list when elements finish loading', async () => {
        addApiMock('mail/v4/conversations', () => conversationsResult);

        const { getAllByTestId } = await render(<MailboxContainer {...props} />);

        const items = getAllByTestId('item');

        expect(items.length === conversationsResult.Conversations.length).toBe(true);
    });

    it('should select all', async () => {
        addApiMock('mail/v4/conversations', () => conversationsResult);

        const { getByTestId, getAllByTestId } = await render(<MailboxContainer {...props} />);

        const checkAll = getByTestId('select-all');
        fireEvent.click(checkAll);

        const allChecks = getAllByTestId('item-checkbox') as HTMLInputElement[];
        expect(allChecks.length > 0).toBe(true);

        const checked = [...allChecks].every((oneCheck) => oneCheck.checked);
        expect(checked).toBe(true);
    });
});
