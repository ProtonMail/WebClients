import { Attachment } from 'proton-shared/lib/interfaces/mail/Message';
import React, { createContext, ReactNode, useContext } from 'react';
import { useInstance } from 'react-components';
import createCache, { Cache } from 'proton-shared/lib/helpers/cache';
import createLRU from 'proton-shared/lib/helpers/lru';
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

interface Props {
    children?: ReactNode;
    cache?: AttachmentsCache; // Only for testing purposes
}

/**
 * Provider for the attachments cache and embedded content
 */
const AttachmentProvider = ({ children, cache: testCache }: Props) => {
    const realCache: AttachmentsCache = useInstance(() => {
        return createCache(
            createLRU<string, DecryptResultPmcrypto>({ max: 50 })
        );
    });

    const cache = testCache || realCache;

    return <AttachmentContext.Provider value={cache}>{children}</AttachmentContext.Provider>;
};

export default AttachmentProvider;
