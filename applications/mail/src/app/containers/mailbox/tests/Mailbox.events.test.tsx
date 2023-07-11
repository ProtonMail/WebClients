import { act } from '@testing-library/react';

import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { DEFAULT_PLACEHOLDERS_COUNT, PAGE_SIZE } from '../../../constants';
import { addApiResolver, addToCache, api, clearAll, render } from '../../../helpers/test/helper';
import { Conversation } from '../../../models/conversation';
import { MessageEvent } from '../../../models/event';
import MailboxContainer from '../MailboxContainer';
import { baseApiMocks, expectElements, getElements, getProps, props, sendEvent, setup } from './Mailbox.test.helpers';

jest.setTimeout(20000);

describe('Mailbox elements list reacting to events', () => {
    const { labelID } = props;

    beforeEach(clearAll);

    it('should add to the cache a message which is not existing yet', async () => {
        // Usefull to receive incoming mail or draft without having to reload the list

        const total = 3;
        const { getItems } = await setup({ conversations: getElements(total) });

        const element = { ID: 'id3', Labels: [{ ID: labelID }], LabelIDs: [labelID] };
        await sendEvent({
            ConversationCounts: [{ LabelID: labelID, Total: total + 1, Unread: 0 }],
            Conversations: [{ ID: element.ID, Action: EVENT_ACTIONS.CREATE, Conversation: element as Conversation }],
        });

        expectElements(getItems, total + 1, false);
    });

    it('should not add to the cache a message which is not existing when a search is active', async () => {
        // When a search is active, all the cache will be shown, we can't accept any updated message
        // But we will refresh the request each time

        const total = 3;
        const search = { keyword: 'test' };
        const { getItems } = await setup({ messages: getElements(total), search });

        const message = { ID: 'id3', Labels: [{ ID: labelID }], LabelIDs: [labelID] } as any as Message;
        await sendEvent({
            Messages: [{ ID: message.ID, Action: EVENT_ACTIONS.CREATE, Message: message }],
        });

        expectElements(getItems, total, false);
        expect(api.mock.calls.length).toBe(4);
    });

    it('should not reload the list on an update event if a filter is active', async () => {
        const total = 3;
        const filter = { Unread: 1 };
        const conversations = getElements(total, labelID, { NumUnread: 1 });

        const { getItems } = await setup({ conversations, filter });

        const ID = 'id0';
        await sendEvent({
            Conversations: [{ ID, Action: EVENT_ACTIONS.UPDATE, Conversation: { ID } as Conversation }],
        });

        expectElements(getItems, total, false);
        expect(api.mock.calls.length).toBe(3);
    });

    it('should not reload the list on an update event if has list from start', async () => {
        const total = 3;
        const { getItems } = await setup({ conversations: getElements(total) });

        const ID = 'id0';
        await sendEvent({
            Conversations: [{ ID, Action: EVENT_ACTIONS.UPDATE, Conversation: { ID } as Conversation }],
        });

        expectElements(getItems, total, false);
        expect(api.mock.calls.length).toBe(3);
    });

    it('should reload the list on an update event if has not list from start', async () => {
        const page = 2;
        const total = PAGE_SIZE * 6 + 2;
        const { getItems } = await setup({
            conversations: getElements(PAGE_SIZE),
            page,
            totalConversations: total,
        });

        const ID = 'id0';
        await sendEvent({
            Conversations: [{ ID, Action: EVENT_ACTIONS.UPDATE, Conversation: { ID } as Conversation }],
        });

        expectElements(getItems, PAGE_SIZE, false);
        expect(api.mock.calls.length).toBe(4);
    });

    it('should reload the list on an delete event if a search is active', async () => {
        const total = 3;
        const search = { keyword: 'test' };
        const { getItems } = await setup({ messages: getElements(total), search });

        const ID = 'id10';
        await sendEvent({
            Messages: [{ ID, Action: EVENT_ACTIONS.DELETE, Message: { ID } as Message }],
        });

        expectElements(getItems, total, false);
        expect(api.mock.calls.length).toBe(4);
    });

    it('should not reload the list on count event when a search is active', async () => {
        // If a search is active, the expected length computation has no meaning

        const total = 3;
        const search = { keyword: 'test' };
        const messages = getElements(total);
        await setup({ messages, search });

        await sendEvent({
            MessageCounts: [{ LabelID: labelID, Total: 10, Unread: 10 }],
        });

        expect(api.mock.calls.length).toBe(3);
    });

    it('should not show the loader if not live cache but params has not changed', async () => {
        const total = PAGE_SIZE;
        const search = { keyword: 'test' };
        const messages = getElements(total);

        baseApiMocks();

        addToCache('ConversationCounts', []);
        addToCache('MessageCounts', [{ LabelID: labelID, Total: total }]);
        addToCache('Calendars', []);
        const { resolve } = addApiResolver('mail/v4/messages');

        const { getAllByTestId } = await render(<MailboxContainer {...getProps({ search })} />);
        const getItems = () => getAllByTestId('message-item', { exact: false });

        // First load pending
        expectElements(getItems, DEFAULT_PLACEHOLDERS_COUNT, true);

        await act(async () => {
            resolve({ Total: total, Messages: messages });
        });

        // First load finished
        expectElements(getItems, total, false);

        const message = messages[0] as Message;
        await sendEvent({
            Messages: [{ ID: message.ID || '', Action: EVENT_ACTIONS.DELETE } as MessageEvent],
        });

        // Event triggered a reload, load is pending but it's hidded to the user
        expectElements(getItems, total, false);

        await act(async () => {
            resolve({ Total: total, Messages: messages });
        });

        // Load finished
        expectElements(getItems, total, false);
    });

    it('should show the loader if not live cache and params has changed', async () => {
        const total = PAGE_SIZE;
        const search = { keyword: 'test' };
        const messages = getElements(total);

        baseApiMocks();

        addToCache('ConversationCounts', []);
        addToCache('MessageCounts', [{ LabelID: labelID, Total: total }]);
        let { resolve } = addApiResolver('mail/v4/messages');

        const { rerender, getAllByTestId } = await render(<MailboxContainer {...getProps({ search })} />);
        const getItems = () => getAllByTestId('message-item', { exact: false });

        // First load pending
        expectElements(getItems, DEFAULT_PLACEHOLDERS_COUNT, true);

        await act(async () => {
            resolve({ Total: total, Messages: messages });
        });

        // First load finished
        expectElements(getItems, total, false);

        resolve = addApiResolver('mail/v4/messages').resolve;

        await rerender(<MailboxContainer {...getProps({ search: { keyword: 'changed' } })} />);

        // Params has changed, cache is reset
        expectElements(getItems, DEFAULT_PLACEHOLDERS_COUNT, true);

        await act(async () => {
            resolve({ Total: total, Messages: messages });
        });

        // Load finished
        expectElements(getItems, total, false);
    });
});
