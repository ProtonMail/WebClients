import React, { createContext, ReactNode, useContext } from 'react';
import { useInstance } from 'react-components';
import createCache, { Cache } from 'proton-shared/lib/helpers/cache';
import createLRU from 'proton-shared/lib/helpers/lru';
import { Attachment } from '../models/attachment';
import { DecryptResultPmcrypto } from 'pmcrypto';

export interface BlobInfo {
    url: string;
    data: Uint8Array;
    attachment: Attachment;
}

export type AttachmentsCache = Cache<string, DecryptResultPmcrypto>;

/**
 * Attachment context containing the Attachment cache
 */
const AttachmentContext = createContext<AttachmentsCache>(null as any);

/**
 * Hook returning the Attachment cache
 */
export const useAttachmentCache = () => useContext(AttachmentContext);

/**
 * Provider for the attachments cache and embedded content
 */
const AttachmentProvider = ({ children }: { children?: ReactNode }) => {
    const cache: AttachmentsCache = useInstance(() => {
        return createCache(
            createLRU<string, DecryptResultPmcrypto>({ max: 50 })
        );
    });

    return <AttachmentContext.Provider value={cache}>{children}</AttachmentContext.Provider>;
};

export default AttachmentProvider;
