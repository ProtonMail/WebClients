import { useCallback, useEffect, useRef } from 'react';

import { c } from 'ttag';

import { queryShareMeta } from '@proton/shared/lib/api/drive/share';
import type { ShareMeta } from '@proton/shared/lib/interfaces/drive/share';

import { useDebouncedRequest } from '../../../store/_api';
import { useSdkErrorHandler } from '../../../utils/errorHandling/useSdkErrorHandler';
import { useDirectShareInfoStore } from './directShareInfo.store';

interface QueuedItem {
    shareId: string;
    onProcessed: (sharedInfo: { sharedOn: number; sharedBy: string } | null) => void;
}

/*
 * Hook for loading shared info with concurrency control.
 * Processes shareId requests individually with a maximum of 5 concurrent requests.
 */
export const useSharedInfoBatcher = () => {
    const debouncedRequest = useDebouncedRequest();
    const { handleError } = useSdkErrorHandler();
    const { setSharedInfo, getSharedInfo, hasSharedInfo } = useDirectShareInfoStore();

    const queue = useRef<QueuedItem[]>([]);
    const activeRequests = useRef<Set<string>>(new Set());

    const maxConcurrency = 10;

    const processNextItems = useCallback(async () => {
        while (queue.current.length > 0 && activeRequests.current.size < maxConcurrency) {
            const queuedItem = queue.current.shift();
            if (!queuedItem) {
                break;
            }

            activeRequests.current.add(queuedItem.shareId);

            void (async () => {
                try {
                    const Share = await debouncedRequest<ShareMeta>(queryShareMeta(queuedItem.shareId));
                    const sharedOn = Share.Memberships[0].CreateTime;
                    const sharedBy = Share.Memberships[0].Inviter;
                    const sharedInfo = { sharedOn, sharedBy };

                    setSharedInfo(queuedItem.shareId, sharedInfo);
                    queuedItem.onProcessed(sharedInfo);
                } catch (error) {
                    handleError(error, {
                        fallbackMessage: c('Error').t`We were not able to load some of your shared items info`,
                        showNotification: false,
                    });
                    setSharedInfo(queuedItem.shareId, null);
                    queuedItem.onProcessed(null);
                } finally {
                    activeRequests.current.delete(queuedItem.shareId);
                    void processNextItems();
                }
            })();
        }
    }, [debouncedRequest, handleError, setSharedInfo]);

    const loadSharedInfo = useCallback(
        (shareId: string, onProcessed: (sharedInfo: { sharedOn: number; sharedBy: string } | null) => void) => {
            if (!shareId) {
                onProcessed(null);
                return;
            }

            if (hasSharedInfo(shareId)) {
                const cachedInfo = getSharedInfo(shareId);
                onProcessed(cachedInfo ?? null);
                return;
            }

            const isAlreadyQueued = queue.current.some((queuedItem) => queuedItem.shareId === shareId);
            const isAlreadyProcessing = activeRequests.current.has(shareId);

            if (isAlreadyQueued || isAlreadyProcessing) {
                return;
            }

            const queuedItem: QueuedItem = {
                shareId,
                onProcessed,
            };

            queue.current.push(queuedItem);
            void processNextItems();
        },
        [processNextItems, hasSharedInfo, getSharedInfo]
    );

    useEffect(() => {
        const currentQueue = queue.current;
        const currentActiveRequests = activeRequests.current;

        return () => {
            currentQueue.length = 0;
            currentActiveRequests.clear();
        };
    }, []);

    return { loadSharedInfo };
};
