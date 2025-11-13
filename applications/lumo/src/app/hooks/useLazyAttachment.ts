import { useEffect } from 'react';

import { useLumoDispatch, useLumoSelector } from '../redux/hooks';
import { selectAttachmentById } from '../redux/selectors';
import { pullAttachmentRequest } from '../redux/slices/core/attachments';
import type { Attachment, AttachmentId } from '../types';

/**
 * Hook for lazy-loading attachments. Returns SWR-style interface.
 * Automatically triggers download if attachment data is not present.
 *
 * @param attachmentId - The ID of the attachment to load
 * @returns {data, isLoading, error} - Attachment data, loading state, and error if any
 */
export function useLazyAttachment(attachmentId: AttachmentId | undefined): {
    data: Attachment | undefined;
    isLoading: boolean;
    error?: string;
} {
    const dispatch = useLumoDispatch();
    const attachment = useLumoSelector((state) => (attachmentId ? selectAttachmentById(attachmentId)(state) : undefined));
    const loadingState = useLumoSelector((state) => (attachmentId ? state.attachmentLoadingState[attachmentId] : undefined));

    useEffect(() => {
        // Trigger download if:
        // 1. We have an attachment ID
        // 2. Attachment exists in Redux (shallow reference from message)
        // 3. Attachment has no data yet
        // 4. Not currently loading
        // 5. No error state
        if (attachmentId && attachment && !attachment.data && !loadingState?.loading && !loadingState?.error) {
            dispatch(pullAttachmentRequest({ id: attachmentId }));
        }
    }, [attachmentId, attachment, attachment?.data, loadingState?.loading, loadingState?.error, dispatch]);

    return {
        data: attachment,
        isLoading: loadingState?.loading || false,
        error: loadingState?.error,
    };
}
