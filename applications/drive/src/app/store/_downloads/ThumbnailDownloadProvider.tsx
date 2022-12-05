import { createContext, useContext, useEffect, useMemo, useRef } from 'react';

import { MAX_THREADS_PER_DOWNLOAD } from '@proton/shared/lib/drive/constants';

import useNavigate from '../../hooks/drive/useNavigate';
import { logError } from '../../utils/errorHandling';
import { createAsyncQueue } from '../../utils/parallelRunners';
import { useLink } from '../_links';
import useDownload from './useDownload';

interface DownloadProviderState {
    addToDownloadQueue: (shareId: string, linkId: string, activeRevisionId?: string) => void;
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
export const ThumbnailsDownloadProvider = ({ children }: any) => {
    const { loadLinkThumbnail } = useLink();
    const { downloadThumbnail } = useDownload();
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
            const { contents, abortController, verifiedPromise } = await downloadThumbnail(
                ac.signal,
                shareId,
                linkId,
                downloadUrl,
                downloadToken
            );

            ac.signal.addEventListener('abort', () => {
                abortController.abort();
            });
            if (ac.signal.aborted) {
                abortController.abort();
            }

            return { contents, verifiedPromise };
        })
            .catch(logError)
            .finally(() => {
                delete controls.current[downloadId];
            });
    };

    const addToDownloadQueue = async (shareId: string, linkId: string, activeRevisionId?: string) => {
        const downloadIdString = getDownloadIdString({
            shareId,
            linkId,
            activeRevisionId,
        });

        if (queueLinkCache.current.has(downloadIdString)) {
            return;
        }
        queueLinkCache.current.add(downloadIdString);
        asyncQueue.addToQueue(() => {
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
