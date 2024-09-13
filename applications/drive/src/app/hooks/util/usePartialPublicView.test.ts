import { renderHook } from '@testing-library/react-hooks';

import { partialPublicViewKey, usePartialPublicView } from './usePartialPublicView';

describe('usePartialPublicView', () => {
    let originalWindowLocation: Location;
    let originalWindowHistory: History;

    beforeEach(() => {
        originalWindowLocation = window.location;
        originalWindowHistory = window.history;

        Object.defineProperty(window, 'location', {
            writable: true,
            value: { ...originalWindowLocation, search: '', pathname: '/test', hash: '' },
        });

        Object.defineProperty(window, 'history', {
            writable: true,
            value: {
                ...originalWindowHistory,
                pushState: jest.fn(),
            },
        });
    });

    afterEach(() => {
        Object.defineProperty(window, 'location', {
            writable: true,
            value: originalWindowLocation,
        });

        Object.defineProperty(window, 'history', {
            writable: true,
            value: originalWindowHistory,
        });
    });

    it('should return true when partialPublicView=true is in the URL', () => {
        window.location.search = `?other=param&${partialPublicViewKey}=true`;
        const { result } = renderHook(() => usePartialPublicView());
        expect(result.current).toBe(true);
    });

    it('should return false when partialPublicView=true is not in the URL', () => {
        window.location.search = '';
        const { result } = renderHook(() => usePartialPublicView());
        expect(result.current).toBe(false);
    });

    it('should return false when partialPublicView has a different value', () => {
        window.location.search = `?${partialPublicViewKey}=false`;
        const { result } = renderHook(() => usePartialPublicView());
        expect(result.current).toBe(false);
    });

    it('should clean up the URL after checking', () => {
        window.location.search = `?other=param&${partialPublicViewKey}=true`;
        renderHook(() => usePartialPublicView());
        expect(window.history.pushState).toHaveBeenCalledWith({}, '', '/test?other=param');
    });
});
