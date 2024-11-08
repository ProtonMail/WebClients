import { renderHook } from '@testing-library/react-hooks';

import { useSubscription } from '@proton/account/subscription/hooks';
import { FREE_SUBSCRIPTION } from '@proton/payments';

import useMozillaCheck from './useMozillaCheck';

jest.mock('@proton/account/subscription/hooks');

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
