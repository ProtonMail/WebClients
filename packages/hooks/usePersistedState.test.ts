import { act, renderHook } from '@testing-library/react-hooks';

import { usePersistedState } from './usePersistedState';

const KEY = 'persisted-key';

describe('usePersistedState', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should return null when storage is empty and no initialValue given', () => {
        const { result } = renderHook(() => usePersistedState(KEY));
        expect(result.current[0]).toEqual(null);
    });

    it('should return initialValue when storage is empty', () => {
        const { result } = renderHook(() => usePersistedState(KEY, { initialValue: 'light' }));
        expect(result.current[0]).toEqual('light');
    });

    it('should read an existing entry from storage', () => {
        localStorage.setItem(KEY, JSON.stringify({ value: 'dark', at: Date.now() }));
        const { result } = renderHook(() => usePersistedState(KEY, { initialValue: 'light' }));
        expect(result.current[0]).toEqual('dark');
    });

    it('should update state and persist on setValue', () => {
        const { result } = renderHook(() => usePersistedState<string>(KEY));

        act(() => {
            result.current[1]('dark');
        });

        expect(result.current[0]).toEqual('dark');
        expect(JSON.parse(localStorage.getItem(KEY) ?? '{}')).toMatchObject({ value: 'dark' });
    });

    it('should round-trip values without changing their type', () => {
        const values: unknown[] = ['42', 42, true, { a: 1 }, [1, 2]];
        for (const value of values) {
            localStorage.clear();
            const { result, unmount } = renderHook(() => usePersistedState<string | number | boolean | object>(KEY));
            act(() => {
                result.current[1](value as string | number | boolean | object);
            });
            unmount();

            const { result: remounted } = renderHook(() => usePersistedState<string | number | boolean | object>(KEY));
            expect(remounted.current[0]).toEqual(value);
        }
    });

    it('should fall back to initialValue and purge when the entry is expired', () => {
        localStorage.setItem(KEY, JSON.stringify({ value: 'dark', at: Date.now() - 2000 }));
        const { result } = renderHook(() => usePersistedState(KEY, { initialValue: 'light', maxAge: 1000 }));

        expect(result.current[0]).toEqual('light');
        expect(localStorage.getItem(KEY)).toBeNull();
    });

    it('should keep the stored value when not expired', () => {
        localStorage.setItem(KEY, JSON.stringify({ value: 'dark', at: Date.now() }));
        const { result } = renderHook(() => usePersistedState(KEY, { initialValue: 'light', maxAge: 1000 }));
        expect(result.current[0]).toEqual('dark');
    });

    it('should respect maxAge 0 (always expired)', () => {
        localStorage.setItem(KEY, JSON.stringify({ value: 'dark', at: Date.now() }));
        const { result } = renderHook(() => usePersistedState(KEY, { maxAge: 0 }));
        expect(result.current[0]).toEqual(null);
    });

    it('should treat fresh entries written with setValue as not expired', () => {
        const { result } = renderHook(() => usePersistedState<string>(KEY, { maxAge: 60_000 }));
        act(() => {
            result.current[1]('dark');
        });
        expect(result.current[0]).toEqual('dark');
    });

    it('should reset to initialValue on clear', () => {
        const { result } = renderHook(() => usePersistedState(KEY, { initialValue: 'light' }));

        act(() => {
            result.current[1]('dark');
        });
        expect(result.current[0]).toEqual('dark');

        act(() => {
            result.current[2]();
        });

        expect(result.current[0]).toEqual('light');
        expect(localStorage.getItem(KEY)).toBeNull();
    });

    it('should purge a corrupt entry and fall back to initialValue', () => {
        localStorage.setItem(KEY, 'not-json{');
        const { result } = renderHook(() => usePersistedState(KEY, { initialValue: 'light' }));

        expect(result.current[0]).toEqual('light');
        expect(localStorage.getItem(KEY)).toBeNull();
    });

    it('should keep working in memory when storage writes throw', () => {
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('QuotaExceededError');
        });
        const { result } = renderHook(() => usePersistedState<string>(KEY));

        act(() => {
            result.current[1]('dark');
        });

        expect(result.current[0]).toEqual('dark');
    });
});
