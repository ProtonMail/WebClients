import { useCache } from 'react-components';
import { BinaryResult } from 'pmcrypto';
import { Attachment } from '../models/attachment';

const CACHE_KEY = 'Attachments';

export interface BlobInfo {
    url: string;
    isContentLocation: boolean;
}

export type AttachmentsDataCache = Map<string, BinaryResult>;
export type AttachmentsBlobsCache = Map<string, BlobInfo>;
export type AttachmentsCidsCache = Map<string, Map<string, Attachment>>;
// export type AttachmentsUploadQueue = Map<string, File[]>;

export interface AttachmentsCache {
    data: AttachmentsDataCache;
    blobs: AttachmentsBlobsCache;
    cids: AttachmentsCidsCache;
    // uploads: AttachmentsUploadQueue;
}

export const useAttachmentsCache = (): AttachmentsCache => {
    const globalCache = useCache();

    if (!globalCache.has(CACHE_KEY)) {
        globalCache.set(CACHE_KEY, {
            data: new Map(),
            blobs: new Map(),
            cids: new Map()
            // uploads: []
        });
    }

    return globalCache.get(CACHE_KEY);
};
