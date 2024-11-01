import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const NAVIGATION_MARK = 'react-router-navigation';

export const useReactRouterNavigationLog = () => {
    const location = useLocation();
    const prevLocationRef = useRef(location);

    useEffect(() => {
        const prevLocation = prevLocationRef.current;
        prevLocationRef.current = location;

        // Don't log if it's the initial render
        if (prevLocation === location) {
            return;
        }

        performance.mark(NAVIGATION_MARK);
    }, [location]);
};
