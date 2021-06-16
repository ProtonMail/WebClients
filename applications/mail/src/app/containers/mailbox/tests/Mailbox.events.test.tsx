import React from 'react';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { act } from '@testing-library/react';
import { PAGE_SIZE, DEFAULT_PLACEHOLDERS_COUNT } from '../../../constants';
import { addApiResolver, addToCache, api, clearAll, render } from '../../../helpers/test/helper';
import { Conversation, ConversationLabel } from '../../../models/conversation';
import { Element } from '../../../models/element';
import { ConversationEvent, MessageEvent } from '../../../models/event';
import MailboxContainer from '../MailboxContainer';
import { baseApiMocks, expectElements, getElements, getProps, props, sendEvent, setup } from './Mailbox.test.helpers';

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
        expect(api.mock.calls.length).toBe(6);
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
        expect(api.mock.calls.length).toBe(5);
    });

    it('should not reload the list on an update event if has list from start', async () => {
        const total = 3;
        const { getItems } = await setup({ conversations: getElements(total) });

        const ID = 'id0';
        await sendEvent({
            Conversations: [{ ID, Action: EVENT_ACTIONS.UPDATE, Conversation: { ID } as Conversation }],
        });

        expectElements(getItems, total, false);
        expect(api.mock.calls.length).toBe(5);
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
        expect(api.mock.calls.length).toBe(6);
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
        expect(api.mock.calls.length).toBe(6);
    });

    it('should reload the list on count event and expected length not matched when several pages of elements', async () => {
        // Removing 5 elements should trigger an expected length mismatch and trigger a new request

        const total = PAGE_SIZE + 3;
        const conversations = getElements(total);
        await setup({ conversations });

        await sendEvent({
            Conversations: conversations
                .slice(0, 5)
                .map((element) => ({ ID: element.ID, Action: EVENT_ACTIONS.DELETE } as ConversationEvent)),
        });

        expect(api.mock.calls.length).toBe(6);
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

        expect(api.mock.calls.length).toBe(5);
    });

    it('should reload the list if the last element has been updated', async () => {
        // If the last element of the list has been updated by an event
        // We're not sure that the sort is good so the cache has to be reset

        const setTime = (element: Element, time: number) => {
            ((element as Conversation).Labels as ConversationLabel[])[0].ContextTime = time;
            return element;
        };

        const total = PAGE_SIZE;
        const conversations = getElements(total);
        conversations.forEach((element, i) => setTime(element, i + 10));
        await setup({ conversations });

        const element = setTime({ ...conversations[4] }, 0);
        await sendEvent({
            Conversations: [{ ID: element.ID || '', Action: EVENT_ACTIONS.UPDATE_FLAGS, Conversation: element }],
        });

        expect(api.mock.calls.length).toBe(6);
    });

    it('should not show the loader if not live cache but params has not changed', async () => {
        const total = PAGE_SIZE;
        const search = { keyword: 'test' };
        const messages = getElements(total);

        baseApiMocks();

        addToCache('ConversationCounts', []);
        addToCache('MessageCounts', [{ LabelID: labelID, Total: total }]);
        const resolve = addApiResolver('mail/v4/messages');

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
        const resolve = addApiResolver('mail/v4/messages');

        const { rerender, getAllByTestId } = await render(<MailboxContainer {...getProps({ search })} />);
        const getItems = () => getAllByTestId('message-item', { exact: false });

        // First load pending
        expectElements(getItems, DEFAULT_PLACEHOLDERS_COUNT, true);

        await act(async () => {
            resolve({ Total: total, Messages: messages });
        });

        // First load finished
        expectElements(getItems, total, false);

        // hook.rerender({ search: { keyword: 'changed' } as SearchParameters });
        await rerender(<MailboxContainer {...getProps({ search: { keyword: 'changed' } })} />);

        // Params has changed, cache is reseted
        expectElements(getItems, DEFAULT_PLACEHOLDERS_COUNT, true);

        await act(async () => {
            resolve({ Total: total, Messages: messages });
        });

        // Load finished
        expectElements(getItems, total, false);
    });
});
