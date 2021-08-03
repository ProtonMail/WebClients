import { createContext, useContext, useEffect, useRef } from 'react';

import { DownloadInfo, ThumbnailMeta } from '../../interfaces/transfer';
import useDrive from '../../hooks/drive/useDrive';
import useFiles from '../../hooks/drive/useFiles';
import { useDriveCache } from '../DriveCache/DriveCacheProvider';
import useAsyncQueue from '../../hooks/util/useAsyncQueue';
import { MAX_THREADS_PER_DOWNLOAD } from '../../constants';
import { DownloadControls } from './download';
import useNavigate from '../../hooks/drive/useNavigate';

interface DownloadProviderState {
    addToDownloadQueue: (meta: ThumbnailMeta, downloadInfo: DownloadInfo) => void;
}

const ThumbnailsDownloadContext = createContext<DownloadProviderState | null>(null);

const getDownloadIdString = ({
    shareId,
    linkId,
    modifyTime,
}: {
    shareId: string;
    linkId: string;
    modifyTime: number;
}) => {
    return shareId + linkId + modifyTime.toString();
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
    const { downloadDriveFile } = useFiles();
    const { loadLinkCachedThumbnailURL } = useDrive();
    const asyncQueue = useAsyncQueue(MAX_THREADS_PER_DOWNLOAD);
    const queueLinkCache = useRef<Set<string>>(new Set());
    const controls = useRef<Record<string, DownloadControls>>({});
    const cache = useDriveCache();
    const navigation = useNavigate();

    const cancelDownloads = () => {
        queueLinkCache.current.forEach((id) => {
            controls.current[id]?.cancel();
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
        return loadLinkCachedThumbnailURL(shareId, linkId, async (downloadUrl: string): Promise<Uint8Array[]> => {
            const { contents, controls: downloadControls } = await downloadDriveFile(shareId, linkId, [
                {
                    Index: 1,
                    URL: downloadUrl,
                },
            ]);
            controls.current[downloadId] = downloadControls;

            contents
                .catch((e: Error) => {
                    console.warn(e);
                })
                .finally(() => {
                    delete controls.current[downloadId];
                });

            return contents;
        });
    };

    const addToDownloadQueue = (meta: ThumbnailMeta, downloadInfo: DownloadInfo) => {
        const linkMeta = cache.get.linkMeta(downloadInfo.ShareID, downloadInfo.LinkID);
        const downloadIdString = getDownloadIdString({
            shareId: downloadInfo.ShareID,
            linkId: downloadInfo.LinkID,
            modifyTime: meta.modifyTime,
        });

        if (
            linkMeta?.ThumbnailIsLoading ||
            linkMeta?.CachedThumbnailURL ||
            queueLinkCache.current.has(downloadIdString)
        ) {
            return;
        }

        queueLinkCache.current.add(downloadIdString);
        asyncQueue.addToQueue(() => {
            return handleThumbnailDownload(downloadInfo.ShareID, downloadInfo.LinkID, downloadIdString);
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

export const useThumbnailsDownloadProvider = () => {
    const state = useContext(ThumbnailsDownloadContext);
    if (!state) {
        throw new Error('Trying to use uninitialized ThumbnailsDonwloadProvider');
    }
    return state;
};
