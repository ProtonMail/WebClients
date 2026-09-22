import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export const getReducedMotion = (): boolean => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return false;
    }

    return window.matchMedia(QUERY).matches;
};

export const useReducedMotion = (): boolean => {
    const [reduced, setReduced] = useState<boolean>(getReducedMotion);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return;
        }

        const query = window.matchMedia(QUERY);
        const onChange = ({ matches }: MediaQueryListEvent) => setReduced(matches);

        query.addEventListener('change', onChange);

        return () => query.removeEventListener('change', onChange);
    }, []);

    return reduced;
};
