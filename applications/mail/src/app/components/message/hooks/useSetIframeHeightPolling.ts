import { RefObject, useEffect, useRef } from 'react';

import { MESSAGE_IFRAME_ROOT_ID } from '../constants';

const CHECK_INTERVAL = 100;
const ALLOWED_PX_INTERVAL = 10;

/**
 * Checks iframe content height at a defined interval.
 * If height is different from previous height it calls the iframe height update method
 *
 * @param startPolling when to start
 * @param isResizing if true we do not handle height updates
 * @param iframeRef
 */
const useSetIframeHeightPolling = (
    startPolling: boolean,
    isResizing: boolean,
    iframeRef: RefObject<HTMLIFrameElement>
) => {
    // Pass resizing value inside a ref for easier access for the interval scoped function
    const isResizingRef = useRef(false);

    useEffect(() => {
        isResizingRef.current = isResizing;
    }, [isResizing]);

    useEffect(() => {
        if (!startPolling) {
            return;
        }

        let previousHeight = 0;

        const interval = setInterval(() => {
            if (!iframeRef || !iframeRef.current) {
                return;
            }

            const emailContentRoot = iframeRef.current?.contentWindow?.document.getElementById(MESSAGE_IFRAME_ROOT_ID);
            const height = emailContentRoot?.scrollHeight;

            if (!emailContentRoot || height === undefined) {
                return;
            }

            const heightIsOutOfBoudaries =
                height &&
                (height > previousHeight + ALLOWED_PX_INTERVAL || height < previousHeight - ALLOWED_PX_INTERVAL);
            const isResizing = isResizingRef.current === true;

            if (!isResizing && heightIsOutOfBoudaries) {
                previousHeight = height;
                iframeRef.current.style.height = `${height}px`;
            }
        }, CHECK_INTERVAL);

        return () => {
            clearInterval(interval);
        };
    }, [startPolling]);
};

export default useSetIframeHeightPolling;
