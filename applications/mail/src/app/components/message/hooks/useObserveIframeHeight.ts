import { useIsMounted } from '@proton/components';
import { debounce } from '@proton/shared/lib/helpers/function';
import { wait } from '@proton/shared/lib/helpers/promise';
import { RefObject, useCallback, useEffect, useRef } from 'react';

import { MESSAGE_IFRAME_ROOT_ID } from '../constants';

const ALLOWED_PX_INTERVAL = 10;

/**
 * Observe dom content changes and width changes in order to set content
 *
 * @param startObserving
 * @param iframeRef
 * @param imagesLoaded
 */
const useObserveIframeHeight = (
    startObserving: boolean,
    iframeRef: RefObject<HTMLIFrameElement>,
    imagesLoaded: boolean
) => {
    const isMountedCallback = useIsMounted();
    const prevHeightRef = useRef<number>(0);
    const prevWidthRef = useRef<number>(0);

    const debouncedSetIframeHeight = useCallback(
        debounce(() => {
            if (!isMountedCallback() || !iframeRef || !iframeRef.current) {
                return;
            }

            const emailContentRoot = iframeRef.current?.contentWindow?.document.getElementById(MESSAGE_IFRAME_ROOT_ID);
            const prevHeight = prevHeightRef.current;
            const height = emailContentRoot?.scrollHeight;

            if (!emailContentRoot || height === undefined) {
                return;
            }

            const heightIsOutOfBoudaries =
                height && (height > prevHeight + ALLOWED_PX_INTERVAL || height < prevHeight - ALLOWED_PX_INTERVAL);

            if (heightIsOutOfBoudaries) {
                prevHeightRef.current = height;
                iframeRef.current.style.height = `${height}px`;
            }
        }, 150),
        []
    );

    const debouncedWidthHasChanged = useCallback(
        debounce((entries: ResizeObserverEntry[], iframeRootDiv: HTMLDivElement, callback: () => void) => {
            if (!isMountedCallback()) {
                return;
            }

            const elEntry = entries.find((entry) => entry.target === iframeRootDiv);
            const width = elEntry?.borderBoxSize.map((size) => size.inlineSize)[0];

            if (!width) {
                return;
            }

            const roundedWidth = Math.round(width);
            const hasResized = roundedWidth !== prevWidthRef.current;

            prevWidthRef.current = roundedWidth;

            if (hasResized) {
                callback();
            }
        }, 150),
        []
    );

    useEffect(() => {
        if (imagesLoaded === true) {
            const afterImageLoad = async () => {
                debouncedSetIframeHeight();

                await wait(3500);

                debouncedSetIframeHeight();
            };

            void afterImageLoad();
        }
    }, [imagesLoaded]);

    useEffect(() => {
        if (!startObserving) {
            return;
        }

        // We're ready set some height
        debouncedSetIframeHeight();

        const iframeRootDiv = iframeRef.current?.contentWindow?.document.getElementById(
            MESSAGE_IFRAME_ROOT_ID
        ) as HTMLDivElement;

        const mutationObserver = new MutationObserver(() => {
            debouncedSetIframeHeight();
        });

        const resizeObserver = new ResizeObserver((entries) => {
            debouncedWidthHasChanged(entries, iframeRootDiv, debouncedSetIframeHeight);
        });

        // Observe if something changes in the markup (ex: loading images, showing blockquote)
        mutationObserver.observe(iframeRootDiv, {
            attributes: false,
            childList: true,
            subtree: true,
        });

        // Only checks iframe root div widths changes (window resize or inner resize when column mailbox layout is set)
        resizeObserver.observe(iframeRootDiv);

        return () => {
            mutationObserver.disconnect();
            resizeObserver.disconnect();
            debouncedSetIframeHeight.abort();
            debouncedWidthHasChanged.abort();
        };
    }, [startObserving]);
};

export default useObserveIframeHeight;
