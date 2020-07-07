import { useEffect } from 'react';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';

import { Message } from '../models/message';
import { hasLabel } from '../helpers/elements';
import { useMessageCache } from '../containers/MessageProvider';
import { ConversationResult } from './useConversation';
import { useConversationCache } from '../containers/ConversationProvider';

const { TRASH } = MAILBOX_LABEL_IDS;

export const useShouldMoveOutMessage = (labelID: string, message: Message | undefined, onBack: () => void) => {
    const messageCache = useMessageCache();

    const isTrashed = hasLabel(message || {}, TRASH);

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
                if (changedID === message?.ID && !messageCache.has(changedID)) {
                    onBack();
                }
            }),
        [messageCache, message?.ID]
    );
};

export const useShouldMoveOutConversation = (
    labelID: string,
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
};
