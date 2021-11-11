import { useCallback, useEffect, useState } from 'react';
import { wait } from '@proton/shared/lib/helpers/promise';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { useApi } from '@proton/components';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { Conversation } from '../../models/conversation';
import { useGetElementsFromIDs } from '../mailbox/useElements';
import { LOAD_RETRY_COUNT, LOAD_RETRY_DELAY } from '../../constants';
import { hasError, hasErrorType } from '../../helpers/errors';
import { ConversationErrors, ConversationState } from '../../logic/conversations/conversationsTypes';
import { allConversations, conversationByID } from '../../logic/conversations/conversationsSelectors';
import { RootState } from '../../logic/store';
import { initialize, load as loadAction, retryLoading } from '../../logic/conversations/conversationsActions';

export interface ConversationStateOptional {
    Conversation?: Conversation;
    Messages?: Message[];
    loadRetry: number;
    errors: ConversationErrors;
}

export const useGetConversation = () => {
    const store = useStore<RootState>();
    return useCallback((ID: string) => conversationByID(store.getState(), { ID }), []);
};

export const useGetAllConversations = () => {
    const store = useStore<RootState>();
    return useCallback(() => allConversations(store.getState()), []);
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
    const dispatch = useDispatch();
    const api = useApi();
    const getElementsFromIDs = useGetElementsFromIDs();
    const getConversation = useGetConversation();

    const conversationState = useSelector((state: RootState) => conversationByID(state, { ID: inputConversationID }));

    const init = (conversationID: string): ConversationStateOptional | undefined => {
        if (conversationState) {
            dispatch(initialize(conversationState as ConversationState));
            return conversationState;
        }

        const [conversationFromElementsState] = getElementsFromIDs([conversationID]);

        if (conversationFromElementsState) {
            dispatch(
                initialize({
                    Conversation: conversationFromElementsState,
                    Messages: undefined,
                    loadRetry: 0,
                    errors: {},
                } as ConversationState)
            );

            return { Conversation: conversationFromElementsState, Messages: undefined, loadRetry: 0, errors: {} };
        }

        return { Conversation: undefined, Messages: undefined, loadRetry: 0, errors: {} };
    };

    const [conversationID, setConversationID] = useState(inputConversationID);
    const [pendingRequest, setPendingRequest] = useState(false);
    const [conversation, setConversation] = useState<ConversationStateOptional | undefined>(() => init(conversationID));

    const load = async (conversationID: string, messageID: string | undefined) => {
        const existingConversation = getConversation(conversationID);
        if ((existingConversation?.loadRetry || 0) > LOAD_RETRY_COUNT) {
            // Max retries reach, aborting
            return;
        }
        if (hasErrorType(existingConversation?.errors, 'notExist')) {
            // Conversation not exist or invalid id, retrying will not help, aborting
            return;
        }

        setPendingRequest(true);
        (await dispatch(loadAction({ api, conversationID, messageID }))) as any as Promise<any>;

        const updatedConversation = getConversation(conversationID);
        if (
            updatedConversation &&
            hasError(updatedConversation.errors) &&
            !hasErrorType(updatedConversation.errors, 'notExist')
        ) {
            await wait(LOAD_RETRY_DELAY);
        }
        setPendingRequest(false);
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
    }, [inputConversationID, messageID, pendingRequest]);

    useEffect(() => {
        if (conversationState) {
            setConversation(conversationState);
        }
    }, [conversationState]);

    const handleRetry = useCallback(() => {
        dispatch(retryLoading({ ID: conversationID }));
    }, [conversationID]);

    const loadingError = hasError(conversation?.errors) && (conversation?.loadRetry || 0) > LOAD_RETRY_COUNT;
    const loadingConversation = !loadingError && !conversation?.Conversation;
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
