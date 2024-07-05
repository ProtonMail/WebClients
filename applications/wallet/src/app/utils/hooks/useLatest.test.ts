import { renderHook } from '@testing-library/react-hooks';

import useLatest from './useLatest';

describe('useLatest', () => {
    it('should have the value of latest', () => {
        let myValue = 0;
        const { result, rerender } = renderHook(() => useLatest(myValue));

        expect(result.current.current).toBe(0);

        myValue = 2;
        rerender();
        expect(result.current.current).toBe(2);

        myValue = 0;
        rerender();
        expect(result.current.current).toBe(0);
    });
});
