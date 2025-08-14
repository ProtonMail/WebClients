import { useCallback } from 'react';

import { useLumoDispatch, useLumoSelector } from '../redux/hooks';
import { clearConversationErrors, selectConversationErrors } from '../redux/slices/meta/errors';
import type { LumoState } from '../redux/store';
import type { ConversationId } from '../types';

export const useConversationErrors = (conversationId: ConversationId) => {
    const dispatch = useLumoDispatch();

    const errors = useLumoSelector((state: LumoState) =>
        selectConversationErrors({ errors: state.errors }, conversationId)
    );

    const clearErrors = useCallback(() => {
        dispatch(clearConversationErrors(conversationId));
    }, [dispatch, conversationId]);

    return {
        errors,
        clearErrors,
        hasConversationErrors: errors.length > 0,
    };
};
