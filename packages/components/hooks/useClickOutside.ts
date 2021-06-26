import { useEffect, RefObject } from 'react';

const useClickOutside = (ref: RefObject<HTMLDivElement>, fn: () => void) => {
    const listener = (e: MouseEvent | TouchEvent) => {
        if (ref.current && e.target && !ref.current.contains(e.target as Node)) {
            fn();
        }
    };

    useEffect(() => {
        document.addEventListener('click', listener, { passive: true });
        document.addEventListener('touchstart', listener, { passive: true });

        return () => {
            document.removeEventListener('click', listener);
            document.removeEventListener('touchstart', listener);
        };
    });
};

export default useClickOutside;
