import { useLayoutEffect, useRef } from 'react';

import { getScrollParent } from '@proton/shared/lib/helpers/dom';

/**
 * Opens a screen at the top, as a new page would: the page stays mounted between screens, so its scroll container
 * would keep the last screen's offset. The public layout renders that container, so this finds it from a marker. First
 * in a screen's body, so a field the screen focuses still scrolls into view.
 */
export const ScrollToTop = () => {
    const markerRef = useRef<HTMLSpanElement>(null);
    useLayoutEffect(() => {
        getScrollParent(markerRef.current).scrollTop = 0;
    }, []);
    return <span ref={markerRef} hidden />;
};
