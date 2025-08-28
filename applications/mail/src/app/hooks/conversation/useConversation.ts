import { useCallback, useEffect, useState } from 'react';

import { useEventManager } from '@proton/components';
import useIsMounted from '@proton/hooks/useIsMounted';
import { isAlwaysMessageLabels } from '@proton/mail/helpers/location';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { useMailDispatch, useMailSelector, useMailStore } from 'proton-mail/store/hooks';

import { LOAD_RETRY_COUNT, LOAD_RETRY_DELAY } from '../../constants';
import { hasError, hasErrorType } from '../../helpers/errors';
import type { Conversation } from '../../models/conversation';
import { initialize, load as loadAction, retryLoading } from '../../store/conversations/conversationsActions';
import {
    allConversations,
    conversationByID,
    conversationsByIDs,
} from '../../store/conversations/conversationsSelectors';
import type { ConversationErrors, ConversationState } from '../../store/conversations/conversationsTypes';
import { useGetElementsFromIDs } from '../mailbox/useElements';

export interface ConversationStateOptional {
    Conversation?: Conversation;
    Messages?: Message[];
    loadRetry: number;
    errors: ConversationErrors;
}

export const useGetConversation = () => {
    const store = useMailStore();
    return useCallback((ID: string) => conversationByID(store.getState(), { ID }), []);
};

export const useGetAllConversations = () => {
    const store = useMailStore();
    return useCallback(() => allConversations(store.getState()), []);
};

export const useGetConversationsByIDs = () => {
    const store = useMailStore();
    return useCallback((IDs: string[]) => conversationsByIDs(store.getState(), IDs), []);
};

interface ReturnValue {
    conversationID: string;
    conversation: ConversationStateOptional | undefined;
    pendingRequest: boolean;
    loadingConversation: boolean;
    loadingMessages: boolean;
    numMessages: number | undefined;
    handleRetry: () => void;
}

interface UseConversation {
    (conversationID: string, messageID?: string): ReturnValue;
}

export const useConversation: UseConversation = (inputConversationID, messageID) => {
    const dispatch = useMailDispatch();
    const getElementsFromIDs = useGetElementsFromIDs();
    const getConversation = useGetConversation();
    const isMounted = useIsMounted();
    const { call } = useEventManager();
    const conversationState = useMailSelector((state) => conversationByID(state, { ID: inputConversationID }));
    const currentLabelID = useMailSelector((state) => state.elements.params.labelID);

    const init = (conversationID: string): ConversationStateOptional | undefined => {
        if (conversationState) {
            // Conversation updated from elements can be desynchronized with messages in store
            if (conversationState.Conversation.NumMessages !== conversationState.Messages?.length) {
                void call();
            }
            return conversationState;
        }

        const [conversationFromElementsState] = getElementsFromIDs([conversationID]);

        const newConversationState: ConversationState = {
            Conversation: { ID: conversationID },
            Messages: undefined,
            loadRetry: 0,
            errors: {},
        };

        if (conversationFromElementsState) {
            newConversationState.Conversation = conversationFromElementsState;
        }

        dispatch(initialize(newConversationState));

        return {
            Conversation: undefined,
            Messages: undefined,
            loadRetry: 0,
            errors: {},
        };
    };

    const [conversationID, setConversationID] = useState(inputConversationID);
    const [pendingRequest, setPendingRequest] = useState(false);
    const [conversation, setConversation] = useState<ConversationStateOptional | undefined>(() => init(conversationID));

    const load = async (conversationID: string, messageID: string | undefined) => {
        // Don't load conversation data in message-only folders like deleted, drafts, sent, etc.
        if (currentLabelID && isAlwaysMessageLabels(currentLabelID)) {
            return;
        }

        const existingConversation = getConversation(conversationID);
        if ((existingConversation?.loadRetry || 0) > LOAD_RETRY_COUNT) {
            // Max retries reach, aborting
            return;
        }
        if (hasErrorType(existingConversation?.errors, 'notExist')) {
            // Conversation not exist or invalid id, retrying will not help, aborting
            return;
        }

        if (isMounted()) {
            setPendingRequest(true);
        }
        await dispatch(loadAction({ conversationID, messageID }));

        const updatedConversation = getConversation(conversationID);

        if (
            updatedConversation &&
            hasError(updatedConversation.errors) &&
            !hasErrorType(updatedConversation.errors, 'notExist')
        ) {
            await wait(LOAD_RETRY_DELAY);
        }
        if (isMounted()) {
            setPendingRequest(false);
        }
    };

    useEffect(() => {
        if (pendingRequest) {
            return;
        }

        const conversationInState = init(inputConversationID);
        setConversationID(inputConversationID);
        setConversation(conversationInState);

        if (!conversationInState || !conversationInState.Messages || !conversationInState.Messages.length) {
            void load(inputConversationID, messageID);
        }
    }, [inputConversationID, messageID, pendingRequest, conversation?.loadRetry]);

    useEffect(() => {
        if (conversationState) {
            setConversation(conversationState);
        }
    }, [conversationState]);

    const handleRetry = useCallback(() => {
        dispatch(retryLoading({ ID: conversationID }));
    }, [conversationID]);

    const loadingError = hasError(conversation?.errors) && (conversation?.loadRetry || 0) > LOAD_RETRY_COUNT;
    const loadingConversation = !loadingError && conversation?.Conversation?.Subject === undefined;
    const loadingMessages = !loadingError && !conversation?.Messages?.length;
    const numMessages = conversation?.Messages?.length || conversation?.Conversation?.NumMessages;

    return {
        conversationID,
        conversation,
        pendingRequest,
        loadingConversation,
        loadingMessages,
        numMessages,
        handleRetry,
    };
};
