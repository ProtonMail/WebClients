import type { Conversation } from 'proton-mail/models/conversation';

export const getContextValue = (
    conversation: Conversation,
    labelID: string,
    key: 'ContextNumMessages' | 'ContextNumUnread' | 'ContextNumAttachments'
) => {
    const label = conversation.Labels?.find(({ ID }) => ID === labelID);
    return label?.[key] || 0;
};

export const getContextValues = (conversation: Conversation, labelID: string) => {
    return {
        ContextNumMessages: getContextValue(conversation, labelID, 'ContextNumMessages'),
        ContextNumUnread: getContextValue(conversation, labelID, 'ContextNumUnread'),
        ContextNumAttachments: getContextValue(conversation, labelID, 'ContextNumAttachments'),
    };
};

export const getContextNumMessages = (conversation: Conversation, labelID: string) => {
    return getContextValue(conversation, labelID, 'ContextNumMessages');
};

export const getContextNumUnread = (conversation: Conversation, labelID: string) => {
    return getContextValue(conversation, labelID, 'ContextNumUnread');
};

export const getContextNumAttachments = (conversation: Conversation, labelID: string) => {
    return getContextValue(conversation, labelID, 'ContextNumAttachments');
};
