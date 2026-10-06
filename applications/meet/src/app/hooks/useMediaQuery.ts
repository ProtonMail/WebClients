import { useEffect, useState } from 'react';

export const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

    useEffect(() => {
        const mql = window.matchMedia(query);
        const listener = (e: MediaQueryListEvent) => setMatches(e.matches);

        setMatches(mql.matches);
        mql.addEventListener('change', listener);

        return () => mql.removeEventListener('change', listener);
    }, [query]);

    return matches;
};
