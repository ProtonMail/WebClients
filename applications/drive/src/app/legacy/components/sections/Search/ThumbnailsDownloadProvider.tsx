import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';

import { logError } from '@proton/drive/legacy/errorHandling';
import { MAX_THREADS_PER_DOWNLOAD } from '@proton/shared/lib/drive/constants';

import { createAsyncQueue } from '../../../../utils/parallelRunners';
import useDriveNavigation from '../../../hooks/drive/useNavigate';
import { useDriveCrypto } from '../../../store/_crypto';
import { useLink } from '../../../store/_links';
import { getCacheKey, useThumbnailCacheStore } from '../../../zustand/download/thumbnail.store';
import { downloadThumbnail as downloadThumbnailPure } from './downloadThumbnail';

interface ThumbnailsDownloadState {
    addToDownloadQueue: (
        shareId: string,
        linkId: string,
        activeRevisionId?: string,
        domRef?: React.MutableRefObject<unknown>
    ) => void;
}

const ThumbnailsDownloadContext = createContext<ThumbnailsDownloadState | null>(null);

const getDownloadId = (shareId: string, linkId: string, activeRevisionId?: string) =>
    shareId + linkId + (activeRevisionId || '');

export const ThumbnailsDownloadProvider = ({ children }: { children: React.ReactNode }) => {
    const { loadLinkThumbnail, getLinkPrivateKey, getLinkSessionKey, getLink } = useLink();
    const { getVerificationKey } = useDriveCrypto();
    const { getThumbnail, addThumbnail } = useThumbnailCacheStore();
    const navigation = useDriveNavigation();

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

    const downloadThumbnail = (
        abortSignal: AbortSignal,
        shareId: string,
        linkId: string,
        url: string,
        token: string,
        activeRevisionId?: string
    ) => {
        const cacheKey = getCacheKey(linkId, shareId, activeRevisionId);
        return downloadThumbnailPure(
            url,
            token,
            async () => {
                const [privateKey, sessionKey] = await Promise.all([
                    getLinkPrivateKey(abortSignal, shareId, linkId),
                    getLinkSessionKey(abortSignal, shareId, linkId),
                ]);
                const link = await getLink(abortSignal, shareId, linkId);
                const addressPublicKeys = !link.isAnonymous
                    ? await getVerificationKey(link.activeRevision?.signatureEmail)
                    : undefined;
                return { privateKey, sessionKeys: sessionKey, addressPublicKeys };
            },
            () => getThumbnail(cacheKey),
            (data: Uint8Array<ArrayBuffer>) => {
                void addThumbnail(cacheKey, data);
            }
        );
    };

    const handleThumbnailDownload = (
        shareId: string,
        linkId: string,
        downloadId: string,
        activeRevisionId?: string
    ) => {
        const ac = new AbortController();
        controls.current[downloadId] = ac;

        return loadLinkThumbnail(ac.signal, shareId, linkId, async (downloadUrl, downloadToken) => {
            return downloadThumbnail(ac.signal, shareId, linkId, downloadUrl, downloadToken, activeRevisionId);
        })
            .catch(logError)
            .finally(() => {
                delete controls.current[downloadId];
            });
    };

    const addToDownloadQueue = (
        shareId: string,
        linkId: string,
        activeRevisionId?: string,
        domRef?: React.MutableRefObject<unknown>
    ) => {
        const downloadId = getDownloadId(shareId, linkId, activeRevisionId);

        if (queueLinkCache.current.has(downloadId) || (domRef && !domRef.current)) {
            return;
        }
        queueLinkCache.current.add(downloadId);

        asyncQueue.addToQueue(() => {
            if (domRef && !domRef.current) {
                queueLinkCache.current.delete(downloadId);
                return Promise.resolve();
            }
            return handleThumbnailDownload(shareId, linkId, downloadId, activeRevisionId);
        });
    };

    return (
        <ThumbnailsDownloadContext.Provider value={{ addToDownloadQueue }}>
            {children}
        </ThumbnailsDownloadContext.Provider>
    );
};

export const useThumbnailsDownload = () => {
    const state = useContext(ThumbnailsDownloadContext);
    if (!state) {
        throw new Error('Trying to use uninitialized ThumbnailsDownloadProvider');
    }
    return state;
};
