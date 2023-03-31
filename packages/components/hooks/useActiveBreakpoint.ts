import { useEffect, useMemo, useState } from 'react';

import debounce from '@proton/utils/debounce';

const getBreakpoint = () => {
    const bodyEl = document.querySelector('body');
    if (!bodyEl) {
        return '';
    }
    return window.getComputedStyle(bodyEl, ':before').getPropertyValue('content').replace(/['"]+/g, '');
};

/** Contains React state setter of each instantiated hooks */
const callbackStack: Set<Function> = new Set();
const onResize = () => {
    const result = getBreakpoint();
    for (let callback of callbackStack.values()) {
        callback(result);
    }
};
const onResizeDebounced = debounce(onResize, 250);

const useActiveBreakpoint = () => {
    const [breakpoint, setBreakpoint] = useState(() => getBreakpoint());

    useEffect(() => {
        if (callbackStack.size === 0) {
            window.addEventListener('load', onResize);
            window.addEventListener('resize', onResizeDebounced);
        }
        callbackStack.add(setBreakpoint);
        return () => {
            callbackStack.delete(setBreakpoint);
            if (callbackStack.size === 0) {
                window.removeEventListener('load', onResize);
                window.removeEventListener('resize', onResizeDebounced);
            }
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
            isNarrow: isMobile || isTinyMobile,
        };
    }, [breakpoint]);
};

export default useActiveBreakpoint;
