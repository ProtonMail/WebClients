import { useMemo } from 'react';

import { type ImageLimitInfo, getImageLimitInfo } from '../../llm/attachments';
import { useLumoSelector } from '../../redux/hooks';
import { selectContextFilters, selectProvisionalAttachments } from '../../redux/selectors';
import type { Message } from '../../types';

/**
 * Computes which images in the conversation will be sent vs. dropped (most-recent-N
 * rule). Respects files-sidebar exclusions and includes images attached in the
 * composer that have not been sent yet. The result is memoized on its inputs.
 */
export const useImageLimitInfo = (messageChain: Message[]): ImageLimitInfo => {
    const provisionalAttachments = useLumoSelector(selectProvisionalAttachments);
    const contextFilters = useLumoSelector(selectContextFilters);
    return useMemo(
        () => getImageLimitInfo(messageChain, provisionalAttachments, contextFilters),
        [messageChain, provisionalAttachments, contextFilters]
    );
};
