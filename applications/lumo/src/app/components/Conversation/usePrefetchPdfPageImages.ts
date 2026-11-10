import { useEffect, useMemo } from 'react';

import { ensureRecentPdfPageImages } from '../../services/files/pdfPageImages';
import type { Attachment, Message } from '../../types';

const whenIdle = (callback: () => void) => {
    if (typeof requestIdleCallback === 'function') {
        const handle = requestIdleCallback(callback, { timeout: 3000 });
        return () => cancelIdleCallback(handle);
    }
    const handle = setTimeout(callback, 200);
    return () => clearTimeout(handle);
};

/**
 * Renders the pages of the conversation's most recent PDFs while the browser is idle, so the first
 * message sent after opening the conversation does not wait for them. Pages are not persisted, so a
 * PDF loaded from storage has none until this runs. Sending still renders any that are missing.
 */
export const usePrefetchPdfPageImages = (messageChain: Message[]) => {
    const pdfs = useMemo(
        () =>
            messageChain
                .flatMap((message) => message.attachments ?? [])
                .filter((attachment) => attachment.mimeType === 'application/pdf'),
        [messageChain]
    );
    // Only a change of the set of PDFs should re-run this, not every new message in the chain.
    const key = pdfs.map((attachment) => attachment.id).join(',');

    useEffect(() => {
        if (!key) {
            return;
        }
        return whenIdle(() => {
            ensureRecentPdfPageImages(pdfs as Attachment[]).catch(() => undefined);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);
};
