import { renderHook } from '@testing-library/react-hooks';

import { setLocation } from '@proton/jest-env/setLocation';

import { partialPublicViewKey, usePartialPublicView } from './usePartialPublicView';

describe('usePartialPublicView', () => {
    beforeEach(() => {
        jest.spyOn(window.history, 'replaceState').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return true when partialPublicView=true is in the URL', () => {
        setLocation(`https://test.com/test?other=param&${partialPublicViewKey}=true`);
        const { result } = renderHook(() => usePartialPublicView());
        expect(result.current).toBe(true);
    });

    it('should return false when partialPublicView=true is not in the URL', () => {
        setLocation('https://test.com/test');
        const { result } = renderHook(() => usePartialPublicView());
        expect(result.current).toBe(false);
    });

    it('should return false when partialPublicView has a different value', () => {
        setLocation(`https://test.com/test?${partialPublicViewKey}=false`);
        const { result } = renderHook(() => usePartialPublicView());
        expect(result.current).toBe(false);
    });

    it('should clean up the URL after checking', () => {
        setLocation(`https://test.com/test?other=param&${partialPublicViewKey}=true`);
        renderHook(() => usePartialPublicView());
        expect(window.history.replaceState).toHaveBeenCalledWith({}, '', 'https://test.com/test?other=param');
    });
});
