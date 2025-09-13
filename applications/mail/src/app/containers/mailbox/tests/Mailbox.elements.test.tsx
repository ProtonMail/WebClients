import { fireEvent, screen } from '@testing-library/react';

import { queryConversations } from '@proton/shared/lib/api/conversations';
import { DEFAULT_MAIL_PAGE_SIZE } from '@proton/shared/lib/constants';
import type { Sort } from '@proton/shared/lib/mail/search';

import { addApiMock, api, clearAll, waitForSpyCall } from '../../../helpers/test/helper';
import type { Element } from '../../../models/element';
import { getElements, props, sendEvent, setup } from './Mailbox.test.helpers';

jest.setTimeout(20000);

jest.mock('proton-mail/metrics/useMailELDTMetric', () => ({
    useMailELDTMetric: () => {
        return { stopELDTMetric: jest.fn() };
    },
}));

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

    beforeEach(() => clearAll());

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
            const total = DEFAULT_MAIL_PAGE_SIZE + 5;
            const { getItems } = await setup({
                conversations: getElements(total),
                page: 0,
                totalConversations: total,
            });
            const items = getItems();

            expect(items.length).toBe(DEFAULT_MAIL_PAGE_SIZE);
        });

        it('should returns the current page', async () => {
            const page1 = 0;
            const page2 = 1;
            const total = DEFAULT_MAIL_PAGE_SIZE + 2;
            const conversations = getElements(total);

            const { rerender, getItems } = await setup({
                conversations,
                totalConversations: total,
                page: page1,
            });
            let items = getItems();
            expect(items.length).toBe(DEFAULT_MAIL_PAGE_SIZE);

            await rerender({ page: page2 });
            items = getItems();
            expect(items.length).toBe(2);
        });

        it('should returns elements sorted', async () => {
            const conversations = [element1, element2];
            const sort1: Sort = { sort: 'Size', desc: false };
            const sort2: Sort = { sort: 'Size', desc: true };

            const { rerender, getItems } = await setup({
                conversations,
                sort: sort1,
            });
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
                {
                    ID: 'id1',
                    Labels: [{ ID: labelID, ContextTime: 1 }],
                    LabelIDs: [labelID],
                    Size: 20,
                    Order: 3,
                },
                {
                    ID: 'id2',
                    Labels: [{ ID: labelID, ContextTime: 1 }],
                    LabelIDs: [labelID],
                    Size: 20,
                    Order: 2,
                },
                {
                    ID: 'id3',
                    Labels: [{ ID: labelID, ContextTime: 1 }],
                    LabelIDs: [labelID],
                    Size: 20,
                    Order: 4,
                },
                {
                    ID: 'id4',
                    Labels: [{ ID: labelID, ContextTime: 1 }],
                    LabelIDs: [labelID],
                    Size: 20,
                    Order: 1,
                },
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
            const total = DEFAULT_MAIL_PAGE_SIZE + 3;
            const expectedRequest = {
                ...queryConversations({
                    LabelID: labelID,
                    Sort: 'Time',
                    Limit: DEFAULT_MAIL_PAGE_SIZE,
                    PageSize: DEFAULT_MAIL_PAGE_SIZE,
                    Page: 0,
                }),
                signal: new AbortController().signal,
            };

            const { getItems } = await setup({
                conversations: getElements(DEFAULT_MAIL_PAGE_SIZE),
                page,
                totalConversations: total,
            });

            expect(api).toHaveBeenNthCalledWith(3, expectedRequest);

            const items = getItems();
            expect(items.length).toBe(DEFAULT_MAIL_PAGE_SIZE);
        });
    });

    describe('filter unread', () => {
        it('should only show unread conversations if filter is on', async () => {
            const conversations = [element1, element2, element3];

            const { getItems } = await setup({
                conversations,
                filter: { Unread: 1 },
                totalConversations: 2,
            });
            const items = getItems();

            expect(items.length).toBe(2);
        });
    });

    describe('page navigation', () => {
        it('should navigate on the last page when the one asked is too big', async () => {
            const conversations = getElements(DEFAULT_MAIL_PAGE_SIZE * 1.5);
            addApiMock(
                'mail/v4/conversations',
                (args: any) => {
                    const page = args.params.Page;
                    if (page === 1) {
                        return {
                            Total: conversations.length,
                            Conversations: conversations.slice(DEFAULT_MAIL_PAGE_SIZE),
                        };
                    }

                    if (page === 0) {
                        return {
                            Total: conversations.length,
                            Conversations: conversations.slice(0, DEFAULT_MAIL_PAGE_SIZE),
                        };
                    }

                    return {
                        Total: conversations.length,
                        Conversations: [],
                    };
                },
                'get'
            );

            // Initialize on page 1
            const { rerender, getItems, history } = await setup({
                conversations,
                page: 0,
                mockConversations: false,
            });

            // Then ask for page 11
            await rerender({ page: 10 });

            expect(history.location.hash).toBe('#page=2');

            await rerender({ page: 1 });

            const items = getItems();
            expect(items.length).toBe(conversations.length % DEFAULT_MAIL_PAGE_SIZE);
        });

        it('should navigate on the previous one when the current one is emptied', async () => {
            const conversations = getElements(DEFAULT_MAIL_PAGE_SIZE * 1.5);
            addApiMock(
                'mail/v4/conversations',
                (args) => {
                    const page = args.params.Page;
                    if (page === 0) {
                        return {
                            Total: conversations.length,
                            Conversations: conversations.slice(0, DEFAULT_MAIL_PAGE_SIZE),
                        };
                    }
                    if (page === 1) {
                        return {
                            Total: conversations.length,
                            Conversations: conversations.slice(DEFAULT_MAIL_PAGE_SIZE),
                        };
                    }

                    return {
                        Total: conversations.length,
                        Conversations: [],
                    };
                },
                'get'
            );
            const labelRequestSpy = jest.fn(() => ({
                UndoToken: { Token: 'Token' },
            }));
            addApiMock(`mail/v4/conversations/label`, labelRequestSpy, 'put');

            const { store, history } = await setup({
                conversations,
                page: 1,
                mockConversations: false,
            });

            const selectAll = screen.getByTestId('toolbar:select-all-checkbox');
            fireEvent.click(selectAll);

            const archive = screen.getByTestId('toolbar:movetoarchive');
            fireEvent.click(archive);

            await sendEvent(store, {
                ConversationCounts: [
                    {
                        LabelID: labelID,
                        Total: DEFAULT_MAIL_PAGE_SIZE,
                        Unread: 0,
                    },
                ],
            });

            await waitForSpyCall({ spy: labelRequestSpy });

            expect(history.location.hash).toBe('');
        });

        it('should show correct number of placeholder navigating on last page', async () => {
            const conversations = getElements(DEFAULT_MAIL_PAGE_SIZE * 1.5);
            addApiMock(
                'mail/v4/conversations',
                (args: any) => {
                    const page = args.params.Page;
                    if (page === 0) {
                        return {
                            Total: conversations.length,
                            Conversations: conversations.slice(0, DEFAULT_MAIL_PAGE_SIZE),
                        };
                    }
                    if (page === 1) {
                        return new Promise(() => {});
                    }
                },
                'get'
            );

            const { rerender, getItems } = await setup({
                conversations,
                mockConversations: false,
            });

            await rerender({ page: 1 });

            const items = getItems();
            expect(items.length).toBe(DEFAULT_MAIL_PAGE_SIZE);
        });
    });
});
