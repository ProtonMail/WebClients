import { act, renderHook } from '@testing-library/react';

import type { LumoAgentItem } from '@proton/llm/lib/lumoAgent/ui/types';

import { CatActivity } from './catPose';
import { MIN_ACTIVITY_MS, useCatActivity } from './useCatActivity';

const searchChip: LumoAgentItem = { id: 1, kind: 'chip', tool: 'search', label: 'Searched', payload: '' };
const reply: LumoAgentItem = { id: 2, kind: 'reply', text: 'Found three.' };

const renderActivity = () =>
    renderHook<CatActivity | null, { items: LumoAgentItem[] }>(({ items }) => useCatActivity(items, true), {
        initialProps: { items: [searchChip] },
    });

describe('useCatActivity', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('holds a quick activity for the minimum time', () => {
        const { result, rerender } = renderActivity();

        act(() => jest.advanceTimersByTime(200));
        rerender({ items: [searchChip, reply] });
        expect(result.current).toBe(CatActivity.SEARCH);

        act(() => jest.advanceTimersByTime(MIN_ACTIVITY_MS - 200));
        expect(result.current).toBeNull();
    });

    it('ends a long activity as soon as it is over', () => {
        const { result, rerender } = renderActivity();

        act(() => jest.advanceTimersByTime(MIN_ACTIVITY_MS));
        rerender({ items: [searchChip, reply] });

        expect(result.current).toBeNull();
    });
});
