import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';

import type { VERIFICATION_STATUS } from '@proton/crypto';
import { MAX_THREADS_PER_DOWNLOAD } from '@proton/shared/lib/drive/constants';

import useNavigate from '../../hooks/drive/useNavigate';
import { logError } from '../../utils/errorHandling';
import { createAsyncQueue } from '../../utils/parallelRunners';
import { useLink } from '../_links';

interface DownloadProviderState {
    /**
     * Adds a thumbnail to the download queue.
     *
     * @param domRef If provided, will cancel the query if `ref.current` is null
     *               when the queue processes the thumbnail. This is useful to
     *               avoid processing items which are no longer visible.
     */
    addToDownloadQueue: (
        shareId: string,
        linkId: string,
        activeRevisionId?: string,
        domRef?: React.MutableRefObject<unknown>
    ) => void;
}

const ThumbnailsDownloadContext = createContext<DownloadProviderState | null>(null);

const getDownloadIdString = ({
    shareId,
    linkId,
    activeRevisionId,
}: {
    shareId: string;
    linkId: string;
    activeRevisionId?: string;
}) => {
    return shareId + linkId + (activeRevisionId || '');
};

/*
    ThumbnailsDownloadProvider is used to keep the number of simultaneous requests sent
    by a browser under control. Before implementing this, we had all thumbnails request
    being sent at one single moment, which filled up the browser request queue. Thus, having
    a folder with lots of images, you couldn't make any request, unless ALL thumbnail are
    loaded and the browser queue is freed (Example: one couldn't load a file preview right
    away after clicking on a file, and had to wait untill all thumbnails are done loading).

    This provider ensured that we load thumbnails by small portions, leaving a window for
    other requests to get to a queue in between them.
*/
export const ThumbnailsDownloadProvider = ({
    children,
    downloadThumbnail,
}: {
    downloadThumbnail: (
        signal: AbortSignal,
        shareId: string,
        linkId: string,
        downloadUrl: string,
        downloadToken: string
    ) => Promise<{
        contents: Promise<Uint8Array[]>;
        verifiedPromise: Promise<VERIFICATION_STATUS>;
    }>;
    children: React.ReactNode;
}) => {
    const { loadLinkThumbnail } = useLink();
    const navigation = useNavigate();

    const asyncQueue = useMemo(() => createAsyncQueue(MAX_THREADS_PER_DOWNLOAD), []);
    const queueLinkCache = useRef<Set<string>>(new Set());
    const controls = useRef<Record<string, AbortController>>({});

    const cancelDownloads = () => {
        queueLinkCache.current.forEach((id) => {
            controls.current[id]?.abort();
        });
        queueLinkCache.current = new Set();

        asyncQueue.clearQueue();
    };

    useEffect(() => {
        const handlerId = navigation.addListener(() => {
            cancelDownloads();
        });

        return () => navigation.removeListener(handlerId);
    }, []);

    const handleThumbnailDownload = (shareId: string, linkId: string, downloadId: string) => {
        const ac = new AbortController();
        controls.current[downloadId] = ac;

        return loadLinkThumbnail(ac.signal, shareId, linkId, async (downloadUrl: string, downloadToken: string) => {
            return downloadThumbnail(ac.signal, shareId, linkId, downloadUrl, downloadToken);
        })
            .catch(logError)
            .finally(() => {
                delete controls.current[downloadId];
            });
    };

    // See JSDoc comment in the interface on top of this file.
    const addToDownloadQueue = (
        shareId: string,
        linkId: string,
        activeRevisionId?: string,
        domRef?: React.MutableRefObject<unknown>
    ) => {
        const downloadIdString = getDownloadIdString({
            shareId,
            linkId,
            activeRevisionId,
        });

        if (queueLinkCache.current.has(downloadIdString) || (domRef && !domRef.current)) {
            return;
        }
        queueLinkCache.current.add(downloadIdString);

        asyncQueue.addToQueue(() => {
            if (domRef && !domRef.current) {
                // No download was initiated, so removed it from the cache
                queueLinkCache.current.delete(downloadIdString);
                return Promise.resolve();
            }
            return handleThumbnailDownload(shareId, linkId, downloadIdString);
        });
    };

    return (
        <ThumbnailsDownloadContext.Provider
            value={{
                addToDownloadQueue,
            }}
        >
            {children}
        </ThumbnailsDownloadContext.Provider>
    );
};

export const useThumbnailsDownload = () => {
    const state = useContext(ThumbnailsDownloadContext);
    if (!state) {
        throw new Error('Trying to use uninitialized ThumbnailsDonwloadProvider');
    }
    return state;
};
