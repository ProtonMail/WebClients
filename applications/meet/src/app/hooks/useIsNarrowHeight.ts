import { useEffect, useState } from 'react';

export const useIsNarrowHeight = () => {
    // Build the media query string once
    const query = `(max-height: 640px)`; // Align with Tailwind value

    // Initialise from the current match status
    const [isNarrowHeight, setIsNarrowHeight] = useState(() => window.matchMedia(query).matches);

    useEffect(() => {
        const mql = window.matchMedia(query);
        const listener = (e: MediaQueryListEvent) => setIsNarrowHeight(e.matches);

        // Newer browsers: addEventListener
        mql.addEventListener('change', listener);

        return () => mql.removeEventListener('change', listener);
    }, [query]);

    return isNarrowHeight;
};
