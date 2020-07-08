import { RenderHookResult, act } from '@testing-library/react-hooks';
import { range } from 'proton-shared/lib/helpers/array';
import { queryConversations } from 'proton-shared/lib/api/conversations';
import { wait } from 'proton-shared/lib/helpers/promise';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';

import { useElements } from './useElements';
import { Element } from '../models/element';
import { Page, Sort, Filter, SearchParameters } from '../models/tools';
import {
    renderHook,
    clearAll,
    addApiMock,
    api,
    triggerEvent,
    addApiResolver,
    addToCache
} from '../helpers/test/helper';
import { ConversationLabel, Conversation } from '../models/conversation';
import { Event } from '../models/event';

interface SetupArgs {
    elements?: Element[];
    total?: number;
    conversationMode?: boolean;
    inputLabelID?: string;
    page?: Page;
    sort?: Sort;
    filter?: Filter;
    search?: SearchParameters;
}

describe('useElements', () => {
    const labelID = 'labelID';
    const element1 = { ID: 'id1', Labels: [{ ID: labelID, ContextTime: 1 }], LabelIDs: [labelID], Size: 20 } as Element;
    const element2 = { ID: 'id2', Labels: [{ ID: labelID, ContextTime: 2 }], LabelIDs: [labelID], Size: 10 } as Element;
    const element3 = {
        ID: 'id3',
        Labels: [{ ID: 'otherLabelID', ContextTime: 3 }],
        LabelIDs: ['otherLabelID']
    } as Element;
    const defaultSort = { sort: 'Time', desc: true } as Sort;
    const defaultFilter = {};
    const defaultSearch = {};

    const getElements = (count: number, label = labelID): Element[] =>
        range(0, count).map((i) => ({
            ID: `id${i}`,
            Labels: [{ ID: label, ContextTime: i }] as ConversationLabel[],
            LabelIDs: [label]
        }));

    let renderHookResult: RenderHookResult<any, any> | null = null;

    const setup = async ({
        elements = [],
        conversationMode = true,
        inputLabelID = labelID,
        page = { page: 0, size: 50, limit: 50, total: elements.length },
        sort = defaultSort,
        filter = defaultFilter,
        search = defaultSearch
    }: SetupArgs = {}) => {
        const counts = { LabelID: inputLabelID, Total: page.total };
        addToCache('ConversationCounts', conversationMode ? [counts] : []);
        addToCache('MessageCounts', conversationMode ? [] : [counts]);
        addApiMock('conversations', () => ({ Total: page.total, Conversations: elements }));

        if (renderHookResult === null) {
            renderHookResult = renderHook((props: any = {}) =>
                useElements({ conversationMode, labelID: inputLabelID, page, sort, filter, search, ...props })
            );
            await renderHookResult.waitForNextUpdate();
        } else {
            renderHookResult.rerender({ conversationMode, labelID: inputLabelID, page, sort, filter });
        }

        return renderHookResult;
    };

    const sendEvent = async (event: Event) => {
        await act(async () => {
            triggerEvent(event);
            await wait(0);
        });
    };

    beforeEach(() => {
        renderHookResult = null;
        clearAll();
    });

    describe('elements memo', () => {
        it('should order by label context time', async () => {
            const hook = await setup({ elements: [element1, element2] });
            expect(hook.result.current.elements).toEqual([element2, element1]);
        });

        it('should filter message with the right label', async () => {
            const hook = await setup({
                page: { page: 0, size: 50, limit: 50, total: 2 },
                elements: [element1, element2, element3]
            });
            expect(hook.result.current.elements.length).toBe(2);
        });

        it('should limit to the page size', async () => {
            const page: Page = { page: 0, size: 5, limit: 5, total: 15 };
            const hook = await setup({ elements: getElements(page.total), page });
            expect(hook.result.current.elements.length).toBe(page.size);
        });

        it('should returns the current page', async () => {
            const page1: Page = { page: 0, size: 5, limit: 5, total: 7 };
            const page2: Page = { ...page1, page: 1 };
            const allElements = getElements(page1.total);

            const hook = await setup({ elements: allElements.slice(0, page1.size), page: page1 });
            await act(async () => {
                await setup({ elements: allElements.slice(page2.size), page: page2 });
            });
            expect(hook.result.current.elements.length).toBe(page1.total - page1.size);
        });

        it('should returns elements sorted', async () => {
            const elements = [element1, element2];
            const sort1: Sort = { sort: 'Size', desc: false };
            const sort2: Sort = { sort: 'Size', desc: true };

            let hook = await setup({ elements, sort: sort1 });
            expect(hook.result.current.elements).toEqual([element2, element1]);

            await act(async () => {
                hook = await setup({ elements, sort: sort2 });
            });
            expect(hook.result.current.elements).toEqual([element1, element2]);
        });
    });

    describe('request effect', () => {
        it('should send request for conversations current page', async () => {
            const page: Page = { page: 0, size: 5, limit: 5, total: 8 };
            const expectedRequest = {
                ...queryConversations({
                    LabelID: labelID,
                    Sort: 'Time',
                    Limit: page.limit,
                    PageSize: page.size
                } as any),
                signal: new AbortController().signal
            };

            const result = await setup({ elements: getElements(page.size), page });

            expect(api).toHaveBeenCalledWith(expectedRequest);

            const { labelID: resultLabelID, elements, loading, total } = result.result.current;

            expect(resultLabelID).toBe(labelID);
            expect(elements.length).toBe(page.size);
            expect(loading).toBe(false);
            expect(total).toBe(page.total);
        });
    });

    describe('event handling', () => {
        it('should add to the cache a message which is not existing yet', async () => {
            // Usefull to receive incoming mail or draft without having to reload the list

            const page: Page = { page: 0, size: 5, limit: 5, total: 3 };
            const hook = await setup({ elements: getElements(page.total), page });

            const element = { ID: 'id3', Labels: [{ ID: labelID }], LabelIDs: [labelID] };
            await sendEvent({
                ConversationCounts: [{ LabelID: labelID, Total: page.total + 1, Unread: 0 }],
                Conversations: [{ ID: element.ID, Action: EVENT_ACTIONS.CREATE, Conversation: element as Conversation }]
            });
            expect(hook.result.current.elements.length).toBe(4);
        });

        it('should not add to the cache a message which is not existing when a search is active', async () => {
            // When a search is active, all the cache will be shown, we can't accept any updated message
            // But we will refresh the request each time

            const page: Page = { page: 0, size: 5, limit: 5, total: 3 };
            const search = { keyword: 'test' } as SearchParameters;
            const hook = await setup({ elements: getElements(page.total), page, search });

            const element = { ID: 'id3', Labels: [{ ID: labelID }], LabelIDs: [labelID] };
            await sendEvent({
                Conversations: [{ ID: element.ID, Action: EVENT_ACTIONS.CREATE, Conversation: element as Conversation }]
            });
            expect(hook.result.current.elements.length).toBe(3);
            expect(api.mock.calls.length).toBe(2);
        });

        it('should reload the list on an update event if a filter is active', async () => {
            const page: Page = { page: 0, size: 5, limit: 5, total: 3 };
            const filter = { Unread: 1 } as Filter;
            const hook = await setup({ elements: getElements(page.total), page, filter });

            const ID = 'id0';
            await sendEvent({
                Conversations: [{ ID, Action: EVENT_ACTIONS.UPDATE, Conversation: { ID } as Conversation }]
            });
            expect(hook.result.current.elements.length).toBe(3);
            expect(api.mock.calls.length).toBe(2);
        });

        it('should not reload the list on an update event if has list from start', async () => {
            const page: Page = { page: 0, size: 5, limit: 5, total: 3 };
            const hook = await setup({ elements: getElements(page.total), page });

            const ID = 'id0';
            await sendEvent({
                Conversations: [{ ID, Action: EVENT_ACTIONS.UPDATE, Conversation: { ID } as Conversation }]
            });
            expect(hook.result.current.elements.length).toBe(3);
            expect(api.mock.calls.length).toBe(1);
        });

        it('should reload the list on an update event if has not list from start', async () => {
            const page: Page = { page: 2, size: 5, limit: 5, total: 32 };
            const hook = await setup({ elements: getElements(page.size), page });

            const ID = 'id0';
            await sendEvent({
                Conversations: [{ ID, Action: EVENT_ACTIONS.UPDATE, Conversation: { ID } as Conversation }]
            });
            expect(hook.result.current.elements.length).toBe(5);
            expect(api.mock.calls.length).toBe(2);
        });

        it('should reload the list on an delete event if a search is active', async () => {
            const page: Page = { page: 0, size: 5, limit: 5, total: 3 };
            const search = { keyword: 'test' } as SearchParameters;
            const hook = await setup({ elements: getElements(page.total), page, search });

            const ID = 'id10';
            await sendEvent({
                Conversations: [{ ID, Action: EVENT_ACTIONS.DELETE, Conversation: { ID } as Conversation }]
            });
            expect(hook.result.current.elements.length).toBe(3);
            expect(api.mock.calls.length).toBe(2);
        });

        it('should reload the list on count event and expected length not matched', async () => {
            // The updated counter should trigger a check on the expected length

            const page: Page = { page: 0, size: 5, limit: 5, total: 3 };
            const elements = getElements(page.total);
            await setup({ elements, page });

            await sendEvent({
                ConversationCounts: [{ LabelID: labelID, Total: 10, Unread: 10 }]
            });

            expect(api.mock.calls.length).toBe(2);
        });

        it('should not reload the list on count event when a search is active', async () => {
            // If a search is active, the expected length computation has no meaning

            const page: Page = { page: 0, size: 5, limit: 5, total: 3 };
            const search = { keyword: 'test' } as SearchParameters;
            const elements = getElements(page.total);
            await setup({ elements, page, search });

            await sendEvent({
                ConversationCounts: [{ LabelID: labelID, Total: 10, Unread: 10 }]
            });

            expect(api.mock.calls.length).toBe(1);
        });

        it('should reload the list if the last element has been updated', async () => {
            // If the last element of the list has been updated by an event
            // We're not sure that the sort is good so the cache has to be reset

            const setTime = (element: Element, time: number) => {
                ((element as Conversation).Labels as ConversationLabel[])[0].ContextTime = time;
                return element;
            };

            const page: Page = { page: 0, size: 5, limit: 5, total: 5 };
            const elements = getElements(page.total);
            elements.forEach((element, i) => setTime(element, i + 10));
            await setup({ elements, page });

            const element = setTime({ ...elements[4] }, 0);
            await sendEvent({
                Conversations: [{ ID: element.ID || '', Action: EVENT_ACTIONS.UPDATE_FLAGS, Conversation: element }]
            });

            expect(api.mock.calls.length).toBe(2);
        });

        it('should not show the loader if not live cache but params has not changed', async () => {
            const resolve = addApiResolver('conversations');

            const page: Page = { page: 0, size: 5, limit: 5, total: 5 };
            const search = { keyword: 'test' } as SearchParameters;
            const elements = getElements(page.total);

            const hook = renderHook((props: any = {}) =>
                useElements({
                    conversationMode: true,
                    labelID,
                    page,
                    sort: defaultSort,
                    filter: defaultFilter,
                    search,
                    ...props
                })
            );

            // First load pending
            expect(hook.result.current.loading).toBe(true);

            resolve({ Total: page.total, Conversations: elements });

            await hook.waitForNextUpdate();

            // First load finished
            expect(hook.result.current.loading).toBe(false);

            const element = elements[0];
            await sendEvent({
                Conversations: [{ ID: element.ID || '', Action: EVENT_ACTIONS.UPDATE_FLAGS, Conversation: element }]
            });

            // Event triggered a reload, load is pending but it's hidded to the user
            expect(hook.result.current.loading).toBe(false);
            expect(hook.result.current.elements.length).toBe(5);

            await act(async () => {
                resolve({ Total: page.total, Conversations: elements });
                await wait(0);
            });

            // Load finished
            expect(hook.result.current.loading).toBe(false);
        });

        it('should show the loader if not live cache and params has changed', async () => {
            const resolve = addApiResolver('conversations');

            const page: Page = { page: 0, size: 5, limit: 5, total: 5 };
            const search = { keyword: 'test' } as SearchParameters;
            const elements = getElements(page.total);

            const hook = renderHook((props: any = {}) =>
                useElements({
                    conversationMode: true,
                    labelID,
                    page,
                    sort: defaultSort,
                    filter: defaultFilter,
                    search,
                    ...props
                })
            );

            // First load pending
            expect(hook.result.current.loading).toBe(true);

            resolve({ Total: page.total, Conversations: elements });

            await hook.waitForNextUpdate();

            // First load finished
            expect(hook.result.current.loading).toBe(false);

            hook.rerender({ search: { keyword: 'changed' } as SearchParameters });

            // Params has changed, cache is reseted
            expect(hook.result.current.loading).toBe(true);
            expect(hook.result.current.elements.length).toBe(0);

            await act(async () => {
                resolve({ Total: page.total, Conversations: elements });
                await wait(0);
            });

            // Load finished
            expect(hook.result.current.loading).toBe(false);
        });
    });
});
