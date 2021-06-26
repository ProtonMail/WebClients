import { getConversation } from 'proton-shared/lib/api/conversations';
import { useCallback } from 'react';
import { useApi } from 'react-components';
import { useUpdateConversationCache } from '../../containers/ConversationProvider';
import { isNetworkError } from '../../helpers/errors';
import { ConversationCacheEntry, ConversationErrors, ConversationResult } from '../../models/conversation';

export type LoadConversation = (ID: string, messageID: string | undefined) => Promise<ConversationCacheEntry>;

export const useLoadConversation = (): LoadConversation => {
    const api = useApi();
    const updateCache = useUpdateConversationCache();

    return useCallback(async (ID: string, messageID: string | undefined) => {
        try {
            const result = (await api(getConversation(ID, messageID))) as ConversationResult;
            return updateCache(ID, ({ loadRetry }) => ({
                ...result,
                loadRetry: loadRetry + 1,
                errors: { network: [], unknown: [] },
            }));
        } catch (error) {
            const errors: ConversationErrors = {};
            if (isNetworkError(error)) {
                errors.network = [error];
            } else {
                errors.unknown = [error];
            }
            return updateCache(ID, ({ loadRetry }) => ({
                loadRetry: loadRetry + 1,
                errors,
            }));
        }
    }, []);
};
