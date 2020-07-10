import { useEffect } from 'react';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';

import { MessageExtended } from '../models/message';
import { hasLabel } from '../helpers/elements';
import { useMessageCache } from '../containers/MessageProvider';
import { ConversationResult } from './useConversation';
import { useConversationCache } from '../containers/ConversationProvider';

const { TRASH } = MAILBOX_LABEL_IDS;

export const useShouldMoveOutMessage = (labelID: string, message: MessageExtended | undefined, onBack: () => void) => {
    const messageCache = useMessageCache();

    const isTrashed = hasLabel(message?.data || {}, TRASH);

    // Move out of trashed message
    useEffect(() => {
        if (labelID !== TRASH && isTrashed) {
            onBack();
        }
    }, [labelID, isTrashed]);

    // Move out of deleted message
    useEffect(
        () =>
            messageCache.subscribe((changedID: string) => {
                if (changedID === message?.localID && !messageCache.has(changedID)) {
                    onBack();
                }
            }),
        [messageCache, message?.localID]
    );

    // Move out of a non existing message
    useEffect(() => {
        if (!message?.actionStatus && message?.data?.ID && !message?.data?.Subject) {
            onBack();
        }
    }, [message?.actionStatus, message?.data]);
};

export const useShouldMoveOutConversation = (
    labelID: string,
    loading: boolean,
    conversationData: ConversationResult | undefined,
    onBack: () => void
) => {
    const conversationCache = useConversationCache();

    const { Conversation: conversation, Messages: messages } = conversationData || {};
    const numTrashedMessages = conversation?.Labels?.find((label) => label.ID === TRASH)?.ContextNumMessages || 0;
    const isTrashed = numTrashedMessages > 0 && numTrashedMessages === messages?.length;

    // Move out of trashed conversation
    useEffect(() => {
        if (labelID !== TRASH && isTrashed) {
            onBack();
        }
    }, [labelID, isTrashed]);

    // Move out of deleted conversation
    useEffect(
        () =>
            conversationCache.subscribe((changedID: string) => {
                if (changedID === conversation?.ID && !conversationCache.has(changedID)) {
                    onBack();
                }
            }),
        [conversationCache, conversation?.ID]
    );

    // Move out of a non existing conversation
    useEffect(() => {
        if (!loading && !conversationData) {
            onBack();
        }
    }, [loading, conversationData]);
};
