import { renderHook } from '@testing-library/react-hooks';

import useMozillaCheck from './useMozillaCheck';
import { useTypedSubscription } from './useSubscription';

jest.mock('./useSubscription');

it('should return false if subscription is still loading', () => {
    jest.mocked(useTypedSubscription).mockReturnValue([undefined, true]);

    let { result } = renderHook(() => useMozillaCheck());

    expect(result.current).toEqual([false, true]);
});

it('should return false if not managed by Mozilla', () => {
    jest.mocked(useTypedSubscription).mockReturnValue([{ isManagedByMozilla: false } as any, false]);

    let { result } = renderHook(() => useMozillaCheck());

    expect(result.current).toEqual([false, false]);
});

it('should return true if managed by Mozilla', () => {
    jest.mocked(useTypedSubscription).mockReturnValue([{ isManagedByMozilla: true } as any, false]);

    let { result } = renderHook(() => useMozillaCheck());

    expect(result.current).toEqual([true, false]);
});
