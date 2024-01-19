import { renderHook } from '@testing-library/react-hooks';

import { FREE_SUBSCRIPTION } from '@proton/shared/lib/constants';

import useMozillaCheck from './useMozillaCheck';
import { useSubscription } from './useSubscription';

jest.mock('./useSubscription');

it('should return false if subscription is still loading', () => {
    jest.mocked(useSubscription).mockReturnValue([undefined as any, true]);

    const { result } = renderHook(() => useMozillaCheck());

    expect(result.current).toEqual([false, true]);
});

it('should return false if not managed by Mozilla', () => {
    jest.mocked(useSubscription).mockReturnValue([{ isManagedByMozilla: false } as any, false]);

    const { result } = renderHook(() => useMozillaCheck());

    expect(result.current).toEqual([false, false]);
});

it('should return true if managed by Mozilla', () => {
    jest.mocked(useSubscription).mockReturnValue([{ isManagedByMozilla: true } as any, false]);

    const { result } = renderHook(() => useMozillaCheck());

    expect(result.current).toEqual([true, false]);
});

it('should return false if subscription is free', () => {
    jest.mocked(useSubscription).mockReturnValue([FREE_SUBSCRIPTION as any, false]);

    const { result } = renderHook(() => useMozillaCheck());

    expect(result.current).toEqual([false, false]);
});
