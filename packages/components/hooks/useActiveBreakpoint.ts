import { useEffect, useMemo, useState } from 'react';

import debounce from '@proton/utils/debounce';

const getActiveBreakpoint = () => {
    const bodyEl = document.querySelector('body');
    if (!bodyEl) {
        return '';
    }
    return window.getComputedStyle(bodyEl, ':before').getPropertyValue('content').replace(/['"]+/g, '');
};

/** Contains React state setter of each instantiated hooks */
const callbackStack: Set<Function> = new Set();
const onResize = () => {
    const result = getActiveBreakpoint();
    for (let callback of callbackStack.values()) {
        callback(result);
    }
};
const onResizeDebounced = debounce(onResize, 250);

export interface Breakpoints {
    activeBreakpoint: string;
    viewportWidth: {
        // Defined in CSS
        xsmall: boolean;
        small: boolean;
        medium: boolean;
        large: boolean;
        xlarge: boolean;
        '2xlarge': boolean;

        // Custom ones
        '<=small': boolean;
        '>=large': boolean;
    };
}

const useActiveBreakpoint = () => {
    const [activeBreakpoint, setActiveBreakpoint] = useState(() => getActiveBreakpoint());

    useEffect(() => {
        if (callbackStack.size === 0) {
            window.addEventListener('load', onResize);
            window.addEventListener('resize', onResizeDebounced);
        }
        callbackStack.add(setActiveBreakpoint);
        return () => {
            callbackStack.delete(setActiveBreakpoint);
            if (callbackStack.size === 0) {
                window.removeEventListener('load', onResize);
                window.removeEventListener('resize', onResizeDebounced);
            }
        };
    }, []);

    return useMemo((): Breakpoints => {
        /*
            isLargeDesktop  = 2xlarge
            isMediumDesktop = xlarge
            isSmallDesktop  = large
            isTablet        = medium
            isMobile        = small
            isTinyMobile    = xsmall
            --
            isDesktop = >=large
            isNarrow  = <=small
        */
        const viewportWidth = {
            // Defined in CSS
            xsmall: activeBreakpoint === 'xsmall',
            small: activeBreakpoint === 'small',
            medium: activeBreakpoint === 'medium',
            large: activeBreakpoint === 'large',
            xlarge: activeBreakpoint === 'xlarge',
            '2xlarge': activeBreakpoint === '2xlarge',

            // Custom ones
            '<=small': false,
            '>=large': false,
        };

        viewportWidth['<=small'] = viewportWidth.small || viewportWidth.xsmall;
        viewportWidth['>=large'] = viewportWidth['2xlarge'] || viewportWidth.xlarge || viewportWidth.large;

        return {
            activeBreakpoint,
            viewportWidth,
        };
    }, [activeBreakpoint]);
};

export default useActiveBreakpoint;
