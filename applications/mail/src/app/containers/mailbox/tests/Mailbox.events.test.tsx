import { act, screen } from '@testing-library/react';

import { getModelState } from '@proton/account/test';
import { DEFAULT_MAIL_PAGE_SIZE, EVENT_ACTIONS } from '@proton/shared/lib/constants';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { DEFAULT_PLACEHOLDERS_COUNT } from '../../../constants';
import { addApiResolver, api, clearAll, mailTestRender } from '../../../helpers/test/helper';
import type { Conversation } from '../../../models/conversation';
import type { MessageEvent } from '../../../models/event';
import { RouterMailboxContainer } from '../../../router/RouterMailboxContainer';
import {
    baseApiMocks,
    expectElements,
    folders,
    getElements,
    getProps,
    labels,
    props,
    sendEvent,
    setup,
} from './Mailbox.test.helpers';

jest.setTimeout(20000);

jest.mock('proton-mail/metrics/useMailELDTMetric', () => ({
    useMailELDTMetric: () => {
        return { stopELDTMetric: jest.fn() };
    },
}));

describe('Mailbox elements list reacting to events', () => {
    const { labelID } = props;

    beforeEach(clearAll);

    it('should add to the cache a message which is not existing yet', async () => {
        // Useful to receive incoming mail or draft without having to reload the list

        const total = 3;
        const { getItems, store } = await setup({ conversations: getElements(total) });

        const conversation = {
            ID: 'id3',
            Labels: [{ ID: labelID }],
            LabelIDs: [labelID],
        };

        await sendEvent(store, {
            ConversationCounts: [{ LabelID: labelID, Total: total + 1, Unread: 0 }],
            Conversations: [
                {
                    ID: conversation.ID,
                    Action: EVENT_ACTIONS.CREATE,
                    Conversation: conversation as Conversation,
                },
            ],
        });

        expectElements(getItems, total + 1, false);
    });

    it('should not add to the cache a message which is not existing when a search is active', async () => {
        // When a search is active, all the cache will be shown, we can't accept any updated message
        // But we will refresh the request each time

        const total = 3;
        const search = { keyword: 'test' };
        const { getItems, store } = await setup({
            messages: getElements(total, labelID, { ConversationID: 'id3' }),
            search,
        });

        const message = {
            ID: 'id3',
            Labels: [{ ID: labelID }],
            LabelIDs: [labelID],
            ConversationID: 'id3',
        } as any as Message;
        await sendEvent(store, {
            Messages: [
                {
                    ID: message.ID,
                    Action: EVENT_ACTIONS.CREATE,
                    Message: message,
                },
            ],
        });

        expectElements(getItems, total, false);
        expect(api.mock.calls.length).toBe(5);
    });

    it('should not reload the list on an update event if a filter is active', async () => {
        const total = 3;
        const filter = { Unread: 1 };
        const conversations = getElements(total, labelID, { NumUnread: 1 });

        const { getItems, store } = await setup({ conversations, filter });

        const ID = 'id0';
        await sendEvent(store, {
            Conversations: [
                {
                    ID,
                    Action: EVENT_ACTIONS.UPDATE,
                    Conversation: { ID } as Conversation,
                },
            ],
        });

        expectElements(getItems, total, false);
        expect(api.mock.calls.length).toBe(4);
    });

    it('should not reload the list on an update event if has list from start', async () => {
        const total = 3;
        const { getItems, store } = await setup({ conversations: getElements(total) });

        const ID = 'id0';
        await sendEvent(store, {
            Conversations: [
                {
                    ID,
                    Action: EVENT_ACTIONS.UPDATE,
                    Conversation: { ID } as Conversation,
                },
            ],
        });

        expectElements(getItems, total, false);
        expect(api.mock.calls.length).toBe(4);
    });

    it('should reload the list on an update event if has not list from start', async () => {
        const page = 2;
        const total = DEFAULT_MAIL_PAGE_SIZE * 6 + 2;
        const { getItems, store } = await setup({
            conversations: getElements(DEFAULT_MAIL_PAGE_SIZE),
            page,
            totalConversations: total,
        });

        const ID = 'id0';

        await sendEvent(store, {
            Conversations: [
                {
                    ID,
                    Action: EVENT_ACTIONS.UPDATE,
                    Conversation: { ID } as Conversation,
                },
            ],
        });

        expectElements(getItems, DEFAULT_MAIL_PAGE_SIZE, false);

        /**
         * `/get conversations` should be called twice at render and twice on reload
         */
        expect(api).toHaveBeenCalledTimes(7);
    });

    it('should reload the list on an delete event if a search is active', async () => {
        const total = 3;
        const search = { keyword: 'test' };
        const { getItems, store } = await setup({
            messages: getElements(total, labelID, { ConversationID: 'id10' }),
            search,
        });

        const ID = 'id10';
        await sendEvent(store, {
            Messages: [
                {
                    ID,
                    Action: EVENT_ACTIONS.DELETE,
                    Message: { ID, ConversationID: ID } as Message,
                },
            ],
        });

        expectElements(getItems, total, false);
        expect(api.mock.calls.length).toBe(5);
    });

    it('should not reload the list on count event when a search is active', async () => {
        // If a search is active, the expected length computation has no meaning

        const total = 3;
        const search = { keyword: 'test' };
        const messages = getElements(total, labelID, { ConversationID: 'id3' });
        const { store } = await setup({ messages, search });

        await sendEvent(store, {
            MessageCounts: [{ LabelID: labelID, Total: 10, Unread: 10 }],
        });

        expect(api.mock.calls.length).toBe(4);
    });

    it('should not show the loader if not live cache but params has not changed', async () => {
        const total = DEFAULT_MAIL_PAGE_SIZE;
        const search = { keyword: 'test' };
        const messages = getElements(total, labelID, { ConversationID: 'id3' });

        baseApiMocks();

        const { resolve } = addApiResolver('mail/v4/messages');

        const { initialPath, ...props } = getProps({ search, labelID });

        const view = await mailTestRender(<RouterMailboxContainer />, {
            preloadedState: {
                messageCounts: getModelState([{ LabelID: labelID, Total: total }]),
                categories: getModelState([...labels, ...folders]),
                elements: {
                    params: {
                        labelID: props.labelID,
                        elementID: props.elementID,
                        messageID: undefined,
                        conversationMode: false,
                        sort: { sort: 'Time', desc: true },
                        filter: {},
                        search: {},
                        esEnabled: false,
                        isSearching: false,
                    },
                    beforeFirstLoad: false,
                    invalidated: false,
                    pendingRequest: false,
                    pendingActions: 0,
                    page: 0,
                    total: {},
                    elements: {},
                    bypassFilter: [],
                    pages: {},
                    retry: { payload: null, count: 0, error: undefined },
                    taskRunning: { labelIDs: [], timeoutID: undefined },
                },
            },
            initialPath,
        });
        const { store } = view;
        const getItems = () => screen.getAllByTestId('message-item', { exact: false });

        // First load pending
        expectElements(getItems, DEFAULT_PLACEHOLDERS_COUNT, true);

        await act(async () => {
            resolve({ Total: total, Messages: messages });
        });

        // First load finished
        expectElements(getItems, total, false);

        const message = messages[0] as Message;
        await sendEvent(store, {
            Messages: [
                {
                    ID: message.ID || '',
                    Action: EVENT_ACTIONS.DELETE,
                } as MessageEvent,
            ],
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
        const total = DEFAULT_MAIL_PAGE_SIZE;
        const search = { keyword: 'test' };
        const messages = getElements(total, labelID, { ConversationID: 'id3' });

        baseApiMocks();

        let { resolve } = addApiResolver('mail/v4/messages');

        const { initialPath, ...props } = getProps({ search, labelID });
        const { rerender, history } = await mailTestRender(<RouterMailboxContainer />, {
            preloadedState: {
                conversationCounts: getModelState([]),
                messageCounts: getModelState([{ LabelID: labelID, Total: total }]),
                categories: getModelState([...labels, ...folders]),
                elements: {
                    params: {
                        labelID: props.labelID,
                        elementID: props.elementID,
                        messageID: undefined,
                        conversationMode: false,
                        sort: { sort: 'Time', desc: true },
                        filter: {},
                        search: {},
                        esEnabled: false,
                        isSearching: false,
                    },
                    beforeFirstLoad: false,
                    invalidated: false,
                    pendingRequest: false,
                    pendingActions: 0,
                    page: 0,
                    total: {},
                    elements: {},
                    bypassFilter: [],
                    pages: {},
                    retry: { payload: null, count: 0, error: undefined },
                    taskRunning: { labelIDs: [], timeoutID: undefined },
                },
            },
            initialPath,
        });
        const getItems = () => screen.getAllByTestId('message-item', { exact: false });

        // First load pending
        expectElements(getItems, DEFAULT_PLACEHOLDERS_COUNT, true);

        await act(async () => {
            resolve({ Total: total, Messages: messages });
        });

        // First load finished
        expectElements(getItems, total, false);

        resolve = addApiResolver('mail/v4/messages').resolve;
        const { initialPath: rerenderInitialPath } = getProps({ search: { keyword: 'changed' } });
        act(() => {
            history.push(rerenderInitialPath);
        });

        await rerender(<RouterMailboxContainer />);

        // Params has changed, cache is reset
        expectElements(getItems, DEFAULT_PLACEHOLDERS_COUNT, true);

        await act(async () => {
            resolve({ Total: total, Messages: messages });
        });

        // Load finished
        expectElements(getItems, total, false);
    });
});
