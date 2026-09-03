import { act, renderHook } from '@testing-library/react';

import { useSearchParams } from './useSearchParams';

const mockHistory = {
    push: jest.fn(),
    replace: jest.fn(),
};
let mockLocation = { pathname: '/users', search: '?tab=all', hash: '#section' };

jest.mock('react-router-dom', () => ({
    useHistory: () => mockHistory,
    useLocation: () => mockLocation,
}));

describe('useSearchParams', () => {
    beforeEach(() => {
        mockHistory.push.mockClear();
        mockHistory.replace.mockClear();
        mockLocation = { pathname: '/users', search: '?tab=all', hash: '#section' };
    });

    it('returns the current location search params as URLSearchParams', () => {
        const { result } = renderHook(() => useSearchParams());
        const [searchParams] = result.current;

        expect(searchParams).toBeInstanceOf(URLSearchParams);
        expect(searchParams.get('tab')).toBe('all');
    });

    it('pushes by default, preserving pathname and hash', () => {
        const { result } = renderHook(() => useSearchParams());
        const [, setSearchParams] = result.current;

        act(() => {
            setSearchParams({ tab: 'settings' });
        });

        expect(mockHistory.push).toHaveBeenCalledTimes(1);
        expect(mockHistory.replace).not.toHaveBeenCalled();
        expect(mockHistory.push).toHaveBeenCalledWith('/users?tab=settings#section', undefined);
    });

    it('replaces the history entry when replace is true', () => {
        const { result } = renderHook(() => useSearchParams());
        const [, setSearchParams] = result.current;

        act(() => {
            setSearchParams({ tab: 'settings' }, { replace: true });
        });

        expect(mockHistory.replace).toHaveBeenCalledTimes(1);
        expect(mockHistory.push).not.toHaveBeenCalled();
        expect(mockHistory.replace).toHaveBeenCalledWith('/users?tab=settings#section', undefined);
    });

    it('passes the state option through to the history call', () => {
        const { result } = renderHook(() => useSearchParams());
        const [, setSearchParams] = result.current;

        act(() => {
            setSearchParams({ tab: 'settings' }, { state: { from: 'dashboard' } });
        });

        expect(mockHistory.push).toHaveBeenCalledWith('/users?tab=settings#section', { from: 'dashboard' });
    });

    it('clears the query string when passed undefined', () => {
        const { result } = renderHook(() => useSearchParams());
        const [, setSearchParams] = result.current;

        act(() => {
            setSearchParams(undefined);
        });

        expect(mockHistory.push).toHaveBeenCalledWith('/users#section', undefined);
    });

    it.each([
        ['string', 'a=1&b=2'],
        ['URLSearchParams', new URLSearchParams('a=1&b=2')],
        [
            'array of pairs',
            [
                ['a', '1'],
                ['b', '2'],
            ],
        ],
    ])('accepts %s input', (_label, input) => {
        const { result } = renderHook(() => useSearchParams());
        const [, setSearchParams] = result.current;

        act(() => {
            setSearchParams(input);
        });

        expect(mockHistory.push).toHaveBeenCalledWith('/users?a=1&b=2#section', undefined);
    });

    it('serializes object input via getSearchParamString', () => {
        const { result } = renderHook(() => useSearchParams());
        const [, setSearchParams] = result.current;

        act(() => {
            setSearchParams({ ids: [1, 2], keep: 0, drop: null, alsoDrop: '', stay: 'yes' });
        });

        expect(mockHistory.push).toHaveBeenCalledWith('/users?ids=1&ids=2&keep=0&stay=yes#section', undefined);
    });

    it('supports a functional updater receiving the current search params', () => {
        const updater = jest.fn((current: URLSearchParams) => ({ tab: `${current.get('tab')}+new` }));
        const { result } = renderHook(() => useSearchParams());
        const [, setSearchParams] = result.current;

        act(() => {
            setSearchParams(updater);
        });

        expect(updater).toHaveBeenCalledWith(expect.any(URLSearchParams));
        expect(mockHistory.push).toHaveBeenCalledWith('/users?tab=all%2Bnew#section', undefined);
    });

    it('gives the functional updater the latest search after a location change', () => {
        const { result, rerender } = renderHook(() => useSearchParams());

        mockLocation = { ...mockLocation, search: '?tab=updated' };
        rerender();

        act(() => {
            const [, setSearchParams] = result.current;
            setSearchParams((current) => ({ tab: `${current.get('tab')}!` }));
        });

        expect(mockHistory.push).toHaveBeenCalledWith('/users?tab=updated%21#section', undefined);
    });

    it('applies initParams on mount', () => {
        renderHook(() => useSearchParams({ page: 2 }));

        expect(mockHistory.push).toHaveBeenCalledTimes(1);
        expect(mockHistory.push).toHaveBeenCalledWith('/users?page=2#section', undefined);
    });

    it('does not navigate on mount without initParams', () => {
        renderHook(() => useSearchParams());

        expect(mockHistory.push).not.toHaveBeenCalled();
        expect(mockHistory.replace).not.toHaveBeenCalled();
    });
});
