import { useEffect } from 'react';

import { useLumoDispatch, useLumoSelector } from '../redux/hooks';
import { selectAttachmentByIdOptional, selectAttachmentLoadingStateOptional } from '../redux/selectors';
import { pullAttachmentRequest } from '../redux/slices/core/attachments';
import { attachmentDataCache } from '../services/attachmentDataCache';
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
    const attachment = useLumoSelector(selectAttachmentByIdOptional(attachmentId));
    const loadingState = useLumoSelector(selectAttachmentLoadingStateOptional(attachmentId));

    useEffect(() => {
        // Trigger download if:
        // 1. We have an attachment ID
        // 2. Attachment exists in Redux (shallow reference from message)
        // 3. Attachment has no data in Redux AND no data in cache
        // 4. Not currently loading
        // 5. No error state
        if (
            attachmentId &&
            attachment &&
            !attachment.data &&
            !attachmentDataCache.getData(attachmentId) &&
            attachment.spaceId &&
            !loadingState?.loading &&
            !loadingState?.error
        ) {
            dispatch(pullAttachmentRequest({ id: attachmentId, spaceId: attachment.spaceId }));
        }
    }, [attachmentId, attachment, attachment?.data, loadingState?.loading, loadingState?.error, dispatch]);

    return {
        data: attachment,
        isLoading: loadingState?.loading || false,
        error: loadingState?.error,
    };
}
