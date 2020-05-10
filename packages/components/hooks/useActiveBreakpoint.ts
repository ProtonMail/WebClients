import { useState, useEffect, useMemo } from 'react';
import { debounce } from 'proton-shared/lib/helpers/function';

const getBreakpoint = () => {
    const bodyEl = document.querySelector('body');
    if (!bodyEl) {
        return '';
    }
    return window
        .getComputedStyle(bodyEl, ':before')
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

    return useMemo(() => {
        const isDesktop = breakpoint === 'desktop';
        const isTablet = breakpoint === 'tablet';
        const isMobile = breakpoint === 'mobile';
        const isTinyMobile = breakpoint === 'tinymobile';

        return {
            breakpoint,
            isDesktop,
            isTablet,
            isMobile,
            isTinyMobile,
            isNarrow: isMobile || isTinyMobile
        };
    }, [breakpoint]);
};

export default useActiveBreakpoint;
