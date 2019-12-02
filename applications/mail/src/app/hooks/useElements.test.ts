import { useApi } from 'react-components';
import { renderHook, RenderHookResult } from '@testing-library/react-hooks';

import { useElements } from './useElements';
import { range } from 'proton-shared/lib/helpers/array';
import { Element } from '../models/element';
import { queryConversations } from 'proton-shared/lib/api/conversations';
import { Page, Sort, Filter } from '../models/tools';

interface SetupArgs {
    elements?: Element[];
    total?: number;
    conversationMode?: boolean;
    inputLabelID?: string;
    page?: Page;
    sort?: Sort;
    filter?: Filter;
}

describe('useElements', () => {
    const labelID = 'labelID';
    const element1 = { ID: 'id1', Labels: [{ ID: labelID, ContextTime: 1 }], LabelIDs: [labelID], Size: 20 };
    const element2 = { ID: 'id2', Labels: [{ ID: labelID, ContextTime: 2 }], LabelIDs: [labelID], Size: 10 };
    const element3 = { ID: 'id3', Labels: [{ ID: 'otherLabelID', ContextTime: 3 }], LabelIDs: ['otherLabelID'] };

    const getElements = (count: number, label = labelID): Element[] =>
        range(0, count).map((i) => ({ ID: `id${i}`, Labels: [{ ID: label, ContextTime: i }], LabelIDs: [label] }));

    const api = jest.fn();
    (useApi as jest.Mock).mockReturnValue(api);

    let renderHookResult: RenderHookResult<any, any> | null = null;

    const setup = async ({
        elements = [],
        conversationMode = true,
        inputLabelID = labelID,
        page = { page: 0, size: 50, limit: 50, total: elements.length },
        sort = { sort: 'Time', desc: true },
        filter = {}
    }: SetupArgs = {}) => {
        api.mockResolvedValue({ Total: page.total, Conversations: elements });

        if (renderHookResult === null) {
            renderHookResult = renderHook((props: any = {}) =>
                useElements({ conversationMode, labelID: inputLabelID, page, sort, filter, ...props })
            );
        } else {
            renderHookResult.rerender({ conversationMode, labelID: inputLabelID, page, sort, filter });
        }

        await renderHookResult.waitForNextUpdate();
        return renderHookResult;
    };

    afterEach(() => {
        renderHookResult = null;
        [(useApi as jest.Mock, api)].forEach((mock) => mock.mockClear());
    });

    describe('elements memo', () => {
        it('should order by label context time', async () => {
            const result = await setup({ elements: [element1, element2] });
            const [elements] = result.result.current;
            expect(elements).toEqual([element2, element1]);
        });

        it('should filter message with the right label', async () => {
            const result = await setup({ elements: [element1, element2, element3] });
            const [elements] = result.result.current;
            expect(elements.length).toBe(2);
        });

        it('should limit to the page size', async () => {
            const page: Page = { page: 0, size: 5, limit: 5, total: 15 };
            const result = await setup({ elements: getElements(page.total), page });
            const [elements] = result.result.current;
            expect(elements.length).toBe(page.size);
        });

        it('should returns the current page', async () => {
            const page: Page = { page: 0, size: 5, limit: 5, total: 7 };
            const allElements = getElements(page.total);

            const result = await setup({ elements: allElements.slice(0, page.size), page });

            page.page = 1;
            await setup({ elements: allElements.slice(page.size), page });

            const [elements] = result.result.current;
            expect(elements.length).toBe(page.total - page.size);
        });

        it('should returns elements sorted', async () => {
            const elements = [element1, element2];
            const sort: Sort = { sort: 'Size', desc: false };
            let result = await setup({ elements, sort });
            expect(result.result.current[0]).toEqual([element2, element1]);

            sort.desc = true;
            result = await setup({ elements, sort });
            expect(result.result.current[0]).toEqual([element1, element2]);
        });
    });

    describe('request effect', () => {
        it('should send request for conversations current page', async () => {
            const page: Page = { page: 0, size: 5, limit: 5, total: 8 };
            const expectedRequest = queryConversations({
                LabelID: labelID,
                Sort: 'Time',
                Limit: page.limit,
                PageSize: page.size
            } as any);

            const result = await setup({ elements: getElements(page.size), page });

            expect(api).toHaveBeenCalledWith(expectedRequest);

            const [elements, loading, total] = result.result.current;

            expect(elements.length).toBe(page.size);
            expect(loading).toBe(false);
            expect(total).toBe(page.total);
        });
    });
});
