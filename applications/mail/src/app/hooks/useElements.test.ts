import { useApi } from 'react-components';
import { renderHook, RenderHookResult } from '@testing-library/react-hooks';

import { useElements } from './useElements';
import { range } from 'proton-shared/lib/helpers/array';
import { Element } from '../models/element';
import { queryConversations } from 'proton-shared/lib/api/conversations';

interface SetupArgs {
    elements?: Element[];
    total?: number;
    conversationMode?: boolean;
    inputLabelID?: string;
    pageNumber?: number;
    pageSize?: number;
}

describe('useElements', () => {
    const labelID = 'labelID';
    const element1 = { ID: 'id1', Labels: [{ ID: labelID, ContextTime: 1 }], LabelIDs: [labelID] };
    const element2 = { ID: 'id2', Labels: [{ ID: labelID, ContextTime: 2 }], LabelIDs: [labelID] };
    const element3 = { ID: 'id3', Labels: [{ ID: 'otherLabelID', ContextTime: 3 }], LabelIDs: ['otherLabelID'] };

    const getElements = (count: number, label = labelID): Element[] =>
        range(0, count).map((i) => ({ ID: `id${i}`, Labels: [{ ID: label, ContextTime: i }], LabelIDs: [label] }));

    const api = jest.fn();

    let renderHookResult: RenderHookResult<any, any> | null = null;

    (useApi as jest.Mock).mockReturnValue(api);

    const setup = async ({
        elements = [],
        total = elements.length,
        conversationMode = true,
        inputLabelID = labelID,
        pageNumber = 0,
        pageSize = 50
    }: SetupArgs = {}) => {
        api.mockResolvedValue({ Total: total, Conversations: elements });

        if (renderHookResult === null) {
            renderHookResult = renderHook((props: any = {}) =>
                useElements({ conversationMode, labelID: inputLabelID, pageNumber, pageSize, ...props })
            );
        } else {
            renderHookResult.rerender({ conversationMode, labelID: inputLabelID, pageNumber, pageSize });
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
            const pageSize = 5;
            const result = await setup({ elements: getElements(15), pageSize });
            const [elements] = result.result.current;
            expect(elements.length).toBe(pageSize);
        });

        it('should returns the current page', async () => {
            const pageSize = 5;
            const total = 7;
            const allElements = getElements(total);

            const result = await setup({ elements: allElements.slice(0, pageSize), pageNumber: 0, pageSize });
            await setup({ elements: allElements.slice(pageSize), pageNumber: 1, pageSize });

            const [elements] = result.result.current;
            expect(elements.length).toBe(total - pageSize);
        });
    });

    describe('request effect', () => {
        it('should send request for conversations current page', async () => {
            const Total = 5;
            const expectedRequest = queryConversations({ LabelID: labelID } as any);

            const result = await setup({ elements: getElements(Total) });

            expect(api).toHaveBeenCalledWith(expectedRequest);

            const [elements, loading, total] = result.result.current;

            expect(elements.length).toBe(Total);
            expect(loading).toBe(false);
            expect(total).toBe(Total);
        });
    });
});
