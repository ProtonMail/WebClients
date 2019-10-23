import { useState, useEffect, useMemo } from 'react';
import { debounce } from 'proton-shared/lib/helpers/function';

const getBreakpoint = () => {
    return window
        .getComputedStyle(document.querySelector('body'), ':before')
        .getPropertyValue('content')
        .replace(/['"]+/g, '');
};

const useActiveBreakpoint = () => {
    const [breakpoint, setBreakpoint] = useState(() => getBreakpoint());

    useEffect(() => {
        const onResize = debounce(() => {
            setBreakpoint(getBreakpoint());
        }, 250);

        window.addEventListener('resize', onResize);

        return () => {
            window.removeEventListener('resize', onResize);
        };
    }, []);

    return useMemo(
        () => ({
            breakpoint,
            isDesktop: breakpoint === 'desktop',
            isTablet: breakpoint === 'tablet',
            isMobile: breakpoint === 'mobile'
        }),
        [breakpoint]
    );
};

export default useActiveBreakpoint;
