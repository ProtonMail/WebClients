import type { MutableRefObject } from 'react';
import { useEffect, useRef } from 'react';

import { useLinksListing } from './useLinksListing';
import useLinksState from './useLinksState';

type Props = {
    /**
     * Whether or not to load thumbnails with the links.
     */
    loadThumbnails?: boolean;
};

export const useLinksQueue = ({ loadThumbnails }: Props = {}) => {
    const { loadLinksMeta } = useLinksListing();
    const linksState = useLinksState();

    const queue = useRef(new Set<string>());
    const domRefMap = useRef(new Map<string, MutableRefObject<unknown>>());
    const controller = useRef<AbortController | null>(null);
    const promise = useRef<Promise<unknown> | null>(null);

    useEffect(() => {
        return () => {
            controller.current?.abort();
        };
    }, []);

    const processQueue = (shareId: string) =>
        new Promise(async (resolve) => {
            controller.current = new AbortController();

            while (queue.current.size > 0 && !controller.current.signal.aborted) {
                // Remove items from the queue which are no longer visible
                queue.current.forEach((item) => {
                    const ref = domRefMap.current.get(item);

                    if (ref && !ref.current) {
                        queue.current.delete(item);
                        domRefMap.current.delete(item);
                    }
                });

                if (queue.current.size === 0) {
                    break;
                }

                const linkIds = Array.from(queue.current);

                try {
                    await loadLinksMeta(controller.current.signal, `links-${shareId}`, shareId, linkIds, {
                        loadThumbnails,
                    });
                } catch (e) {
                    console.error(e);
                }

                linkIds.forEach((linkId) => {
                    queue.current.delete(linkId);
                    domRefMap.current.delete(linkId);
                });
            }

            controller.current = null;
            resolve(null);
        });

    const addToQueue = (shareId: string, linkId: string, domRef?: React.MutableRefObject<unknown>) => {
        const link = linksState.getLink(shareId, linkId);
        if (link || queue.current.has(linkId)) {
            return;
        }

        queue.current.add(linkId);
        if (domRef) {
            domRefMap.current.set(linkId, domRef);
        }

        // We'll debounce starting the queue for a bit, to collect items to batch
        setTimeout(() => {
            if (!promise.current) {
                promise.current = processQueue(shareId).then(() => {
                    promise.current = null;
                });
            }
        }, 10);
    };

    return {
        addToQueue,
    };
};
