import { fireEvent } from '@testing-library/react';

import { queryConversations } from '@proton/shared/lib/api/conversations';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';

import { ELEMENTS_CACHE_REQUEST_SIZE, PAGE_SIZE } from '../../../constants';
import { addApiMock, api, apiMocks, clearAll, getHistory, tick, waitForSpyCall } from '../../../helpers/test/helper';
import { Element } from '../../../models/element';
import { Sort } from '../../../models/tools';
import { getElements, props, sendEvent, setup } from './Mailbox.test.helpers';

describe('Mailbox element list', () => {
    const { labelID } = props;

    const element1 = {
        ID: 'id1',
        Labels: [{ ID: labelID, ContextTime: 1 }],
        LabelIDs: [labelID],
        Size: 20,
        NumUnread: 1,
        NumMessages: 1,
    } as Element;
    const element2 = {
        ID: 'id2',
        Labels: [{ ID: labelID, ContextTime: 2 }],
        LabelIDs: [labelID],
        Size: 10,
        NumUnread: 1,
        NumMessages: 1,
    } as Element;
    const element3 = {
        ID: 'id3',
        Labels: [{ ID: 'otherLabelID', ContextTime: 3 }],
        LabelIDs: ['otherLabelID'],
        NumUnread: 0,
        NumMessages: 1,
    } as Element;

    beforeEach(clearAll);

    describe('elements memo', () => {
        it('should order by label context time', async () => {
            const conversations = [element1, element2];
            const { getItems } = await setup({ conversations });
            const items = getItems();

            expect(items.length).toBe(2);
            expect(items[0].getAttribute('data-element-id')).toBe(conversations[1].ID);
            expect(items[1].getAttribute('data-element-id')).toBe(conversations[0].ID);
        });

        it('should filter message with the right label', async () => {
            const { getItems } = await setup({
                page: 0,
                totalConversations: 2,
                conversations: [element1, element2, element3],
            });
            const items = getItems();

            expect(items.length).toBe(2);
        });

        it('should limit to the page size', async () => {
            const total = PAGE_SIZE + 5;
            const { getItems } = await setup({
                conversations: getElements(total),
                page: 0,
                totalConversations: total,
            });
            const items = getItems();

            expect(items.length).toBe(PAGE_SIZE);
        });

        it('should returns the current page', async () => {
            const page1 = 0;
            const page2 = 1;
            const total = PAGE_SIZE + 2;
            const conversations = getElements(total);

            const { rerender, getItems } = await setup({ conversations, totalConversations: total, page: page1 });
            let items = getItems();
            expect(items.length).toBe(PAGE_SIZE);

            await rerender({ page: page2 });
            items = getItems();
            expect(items.length).toBe(2);
        });

        it('should returns elements sorted', async () => {
            const conversations = [element1, element2];
            const sort1: Sort = { sort: 'Size', desc: false };
            const sort2: Sort = { sort: 'Size', desc: true };

            const { rerender, getItems } = await setup({ conversations, sort: sort1 });
            let items = getItems();

            expect(items.length).toBe(2);
            expect(items[0].getAttribute('data-element-id')).toBe(conversations[1].ID);
            expect(items[1].getAttribute('data-element-id')).toBe(conversations[0].ID);

            await rerender({ sort: sort2 });
            items = getItems();

            expect(items.length).toBe(2);
            expect(items[0].getAttribute('data-element-id')).toBe(conversations[0].ID);
            expect(items[1].getAttribute('data-element-id')).toBe(conversations[1].ID);
        });

        it('should fallback sorting on Order field', async () => {
            const conversations = [
                { ID: 'id1', Labels: [{ ID: labelID, ContextTime: 1 }], LabelIDs: [labelID], Size: 20, Order: 3 },
                { ID: 'id2', Labels: [{ ID: labelID, ContextTime: 1 }], LabelIDs: [labelID], Size: 20, Order: 2 },
                { ID: 'id3', Labels: [{ ID: labelID, ContextTime: 1 }], LabelIDs: [labelID], Size: 20, Order: 4 },
                { ID: 'id4', Labels: [{ ID: labelID, ContextTime: 1 }], LabelIDs: [labelID], Size: 20, Order: 1 },
            ];

            const expectOrder = (items: HTMLElement[], order: number[]) => {
                expect(items.length).toBe(order.length);
                for (const [i, pos] of order.entries()) {
                    expect(items[i].getAttribute('data-element-id')).toBe(conversations[pos].ID);
                }
            };

            const { rerender, getItems } = await setup({ conversations });
            expectOrder(getItems(), [2, 0, 1, 3]);

            await rerender({ sort: { sort: 'Time', desc: false } });
            expectOrder(getItems(), [3, 1, 0, 2]);

            await rerender({ sort: { sort: 'Size', desc: true } });
            expectOrder(getItems(), [0, 1, 2, 3]);

            await rerender({ sort: { sort: 'Size', desc: false } });
            expectOrder(getItems(), [0, 1, 2, 3]);
        });
    });

    describe('request effect', () => {
        it('should send request for conversations current page', async () => {
            const page = 0;
            const total = PAGE_SIZE + 3;
            const expectedRequest = {
                ...queryConversations({
                    LabelID: labelID,
                    Sort: 'Time',
                    Limit: ELEMENTS_CACHE_REQUEST_SIZE,
                    PageSize: PAGE_SIZE,
                } as any),
                signal: new AbortController().signal,
            };

            const { getItems } = await setup({
                conversations: getElements(PAGE_SIZE),
                page,
                totalConversations: total,
            });

            expect(api).toHaveBeenCalledWith(expectedRequest);

            const items = getItems();
            expect(items.length).toBe(PAGE_SIZE);
        });
    });

    describe('filter unread', () => {
        it('should only show unread conversations if filter is on', async () => {
            const conversations = [element1, element2, element3];

            const { getItems } = await setup({ conversations, filter: { Unread: 1 }, totalConversations: 2 });
            const items = getItems();

            expect(items.length).toBe(2);
        });

        it('should keep in view the conversations when opened while filter is on', async () => {
            const conversations = [element1, element2, element3];
            const message = {
                ID: 'messageID1',
                AddressID: 'AddressID',
                Sender: {},
                ConversationID: element1.ID,
                Flag: MESSAGE_FLAGS.FLAG_RECEIVED,
                LabelIDs: [labelID],
                Attachments: [],
            };

            const { rerender, getItems } = await setup({
                conversations,
                filter: { Unread: 1 },
                totalConversations: 2,
            });

            // A bit complex but the point is to simulate opening the conversation
            addApiMock(`mail/v4/conversations/${element1.ID}`, () => ({
                Conversation: element1,
                Messages: [message],
            }));
            addApiMock(`mail/v4/messages/messageID1`, () => ({ Message: message }));
            addApiMock(`mail/v4/messages/read`, () => ({ UndoToken: { Token: 'Token' } }));
            await rerender({ elementID: element1.ID });

            const items = getItems();
            expect(items.length).toBe(2);
            expect(items[1].classList.contains('read')).toBe(true);
            expect(items[0].classList.contains('read')).toBe(false);

            // Needed because of the message images double render
            await tick();
        });
    });

    describe('page navigation', () => {
        it('should navigate on the last page when the one asked is too big', async () => {
            const conversations = getElements(PAGE_SIZE * 1.5);
            apiMocks['mail/v4/conversations'] = [
                {
                    method: 'get',
                    handler: (args: any) => {
                        const page = args.params.Page;
                        if (page === 10) {
                            return { Total: conversations.length, Conversations: [] };
                        }
                        if (page <= 1) {
                            return { Total: conversations.length, Conversations: conversations.slice(PAGE_SIZE) };
                        }
                    },
                },
            ];

            // Initialize on page 1
            const { rerender, getItems } = await setup({ conversations, page: 0, mockConversations: false });

            // Then ask for page 11
            await rerender({ page: 10 });

            expect(getHistory().location.hash).toBe('#page=2');

            await rerender({ page: 1 });

            const items = getItems();
            expect(items.length).toBe(conversations.length % PAGE_SIZE);
        });

        it('should navigate on the previous one when the current one is emptied', async () => {
            const conversations = getElements(PAGE_SIZE * 1.5);
            apiMocks['mail/v4/conversations'] = [
                {
                    method: 'get',
                    handler: (args: any) => {
                        const page = args.params.Page;
                        if (page === 0) {
                            return { Total: conversations.length, Conversations: conversations.slice(0, PAGE_SIZE) };
                        }
                        if (page === 1) {
                            return { Total: conversations.length, Conversations: conversations.slice(PAGE_SIZE) };
                        }
                    },
                },
            ];
            const labelRequestSpy = jest.fn(() => ({ UndoToken: { Token: 'Token' } }));
            addApiMock(`mail/v4/conversations/label`, labelRequestSpy, 'put');

            const { getByTestId } = await setup({ conversations, page: 1, mockConversations: false });

            const selectAll = getByTestId('toolbar:select-all-checkbox');
            fireEvent.click(selectAll);

            const archive = getByTestId('toolbar:movetoarchive');
            fireEvent.click(archive);

            await sendEvent({ ConversationCounts: [{ LabelID: labelID, Total: PAGE_SIZE, Unread: 0 }] });

            await waitForSpyCall(labelRequestSpy);

            expect(getHistory().location.hash).toBe('');
        });

        it('should show correct number of placeholder navigating on last page', async () => {
            const conversations = getElements(PAGE_SIZE * 1.5);
            apiMocks['mail/v4/conversations'] = [
                {
                    method: 'get',
                    handler: (args: any) => {
                        const page = args.params.Page;
                        if (page === 0) {
                            return { Total: conversations.length, Conversations: conversations.slice(0, PAGE_SIZE) };
                        }
                        if (page === 1) {
                            return new Promise(() => {});
                        }
                    },
                },
            ];

            const { rerender, getItems } = await setup({ conversations, mockConversations: false });

            await rerender({ page: 1 });

            const items = getItems();
            expect(items.length).toBe(conversations.length % PAGE_SIZE);
        });
    });
});
