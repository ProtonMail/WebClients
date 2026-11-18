import { act, renderHook } from '@testing-library/react';

import type { Condition } from '../interfaces';
import useFilterConditions from './useFilterConditions';

describe('useFilterConditions', () => {
    const condition = { id: 'test' } as Condition;
    const initialConditions = [condition];
    const onChangeConditions = vi.fn();

    it('should generate an initial condition', () => {
        const { result } = renderHook(() => useFilterConditions());
        expect(result.current.conditions).toHaveLength(1);
    });

    it('should handle initial conditions', () => {
        const { result } = renderHook(() => useFilterConditions(initialConditions));
        expect(result.current.conditions).toEqual(initialConditions);
    });

    it('should add a condition', () => {
        const { result } = renderHook(() => useFilterConditions(initialConditions, onChangeConditions));
        act(() => result.current.onAddCondition());
        expect(result.current.conditions).toHaveLength(2);
        expect(onChangeConditions).toHaveBeenCalled();
    });

    it('should delete a condition', () => {
        const { result } = renderHook(() => useFilterConditions(initialConditions, onChangeConditions));
        act(() => result.current.onDeleteCondition(0));
        expect(result.current.conditions).toHaveLength(0);
        expect(onChangeConditions).toHaveBeenCalled();
    });

    it('should update a condition', () => {
        const { result } = renderHook(() => useFilterConditions(initialConditions, onChangeConditions));
        act(() => result.current.onUpdateCondition(0, condition));
        expect(result.current.conditions).toEqual([condition]);
        expect(onChangeConditions).toHaveBeenCalled();
    });
});
