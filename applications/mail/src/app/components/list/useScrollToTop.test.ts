import { useState } from 'react';

import { renderHook } from '@testing-library/react-hooks';

import useScrollToTop from './useScrollToTop';

describe('useScrollToTop', () => {
    it('should scroll to top', () => {
        renderHook(() => {
            const ref = { current: { scrollTop: 10 } } as React.RefObject<HTMLElement>;
            useScrollToTop(ref, []);
            if (!ref.current) {
                throw new Error('ref.current is undefined');
            }
            expect(ref.current.scrollTop).toBe(0);
        });
    });

    it('should scroll to top if dependencies are changing', () => {
        renderHook(() => {
            const ref = { current: { scrollTop: 10 } } as React.RefObject<HTMLElement>;
            const [dependencies, setDependencies] = useState([1]);
            if (!ref.current) {
                throw new Error('ref.current is undefined');
            }
            useScrollToTop(ref, dependencies);
            expect(ref.current.scrollTop).toBe(0);
            ref.current.scrollTop = 10;
            expect(ref.current.scrollTop).toBe(10);
            setDependencies([2]);
            expect(ref.current.scrollTop).toBe(0);
        });
    });
});
