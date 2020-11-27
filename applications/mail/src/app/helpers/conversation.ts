import { Conversation } from '../models/conversation';

type LabelValue = 'NumMessages' | 'NumUnread' | 'Time' | 'Size' | 'NumAttachments';
type LabelContextValue =
    | 'ContextNumMessages'
    | 'ContextNumUnread'
    | 'ContextTime'
    | 'ContextSize'
    | 'ContextNumAttachments';

export const getSenders = ({ Senders = [] }: Conversation = {}) => Senders;

export const getRecipients = ({ Recipients = [] }: Conversation) => Recipients;

export const getConversationContextValue = (
    conversation: Conversation | undefined,
    value: LabelValue,
    labelID: string | undefined
) => {
    const matchingLabel = conversation?.Labels?.find((label) => label.ID === labelID);
    const matchingValue = matchingLabel?.[`Context${value}` as LabelContextValue];

    if (matchingValue !== undefined) {
        return matchingValue;
    }
    if (conversation?.[value] !== undefined) {
        return conversation[value] as number;
    }

    return 0;
};

export const getNumAttachments = (conversation: Conversation = {}, labelID: string | undefined) =>
    getConversationContextValue(conversation, 'NumAttachments', labelID);

export const hasAttachments = (conversation: Conversation = {}, labelID: string | undefined) =>
    getNumAttachments(conversation, labelID) > 0;

export const getNumUnread = (conversation: Conversation = {}, labelID: string | undefined) =>
    getConversationContextValue(conversation, 'NumUnread', labelID);

export const isUnread = (conversation: Conversation = {}, labelID: string | undefined) =>
    getNumUnread(conversation, labelID) !== 0;

export const getNumMessages = (conversation: Conversation | undefined, labelID: string | undefined) =>
    getConversationContextValue(conversation, 'NumMessages', labelID);

export const getTime = (conversation: Conversation | undefined, labelID: string | undefined) =>
    getConversationContextValue(conversation, 'Time', labelID);

export const getSize = (conversation: Conversation | undefined, labelID: string | undefined) =>
    getConversationContextValue(conversation, 'Size', labelID);

/**
 * Returns a map of boolean with all labels on the conversation and for each true if all messages have the label and false if not
 */
export const getLabelIDs = (conversation: Conversation | undefined, contextLabelID: string | undefined) => {
    const contextNumMessages = getNumMessages(conversation, contextLabelID);

    return (
        conversation?.Labels?.reduce<{ [labelID: string]: boolean | undefined }>((acc, label) => {
            acc[label.ID] = label.ContextNumMessages === contextNumMessages;
            return acc;
        }, {}) || {}
    );
};
