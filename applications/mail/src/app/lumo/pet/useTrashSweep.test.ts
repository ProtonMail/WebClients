import { act, renderHook } from '@testing-library/react';

import type { LumoAgentItem } from '@proton/llm/lib/lumoAgent/ui/types';
import { ConfirmStatus } from '@proton/llm/lib/lumoAgent/ui/types';

import { SWEEP_MS } from './catSpriteManifest';
import { useTrashSweep } from './useTrashSweep';

const trashCard = (id: number, status: ConfirmStatus): LumoAgentItem => ({
    id,
    kind: 'confirm',
    action: { type: 'move_emails', ids: ['email-a1b2c3'], folder: null, location: 'trash' },
    labels: {},
    status,
});

const renderSweep = (items: LumoAgentItem[]) =>
    renderHook(({ items }) => useTrashSweep(items), { initialProps: { items } });

describe('useTrashSweep', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('sweeps once when a trash is applied, then stops', () => {
        const { result, rerender } = renderSweep([trashCard(1, ConfirmStatus.APPLYING)]);
        expect(result.current).toBe(false);

        rerender({ items: [trashCard(1, ConfirmStatus.APPLIED)] });
        expect(result.current).toBe(true);

        act(() => jest.advanceTimersByTime(SWEEP_MS));
        expect(result.current).toBe(false);
    });

    it('does not replay a trash applied before it mounted', () => {
        const { result } = renderSweep([trashCard(1, ConfirmStatus.APPLIED)]);

        expect(result.current).toBe(false);
    });

    it('stops at once when the conversation is cleared mid-sweep', () => {
        const { result, rerender } = renderSweep([]);
        rerender({ items: [trashCard(1, ConfirmStatus.APPLIED)] });

        rerender({ items: [] });

        expect(result.current).toBe(false);
    });
});
