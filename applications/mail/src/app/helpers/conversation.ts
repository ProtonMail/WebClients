import { Conversation } from '../models/conversation';

export const getSenders = ({ Senders = [] }: Conversation = {}) => Senders;

export const getRecipients = ({ Recipients = [] }: Conversation) => Recipients;

export const getNumAttachments = (conversation: Conversation = {}, labelID: string | undefined) => {
    const labelNum = conversation.Labels?.find((label) => label.ID === labelID)?.ContextNumAttachments;

    if (labelNum !== undefined) {
        return labelNum;
    }
    if (conversation.ContextNumAttachments !== undefined) {
        return conversation.ContextNumAttachments;
    }
    if (conversation.NumAttachments !== undefined) {
        return conversation.NumAttachments;
    }

    return 0;
};

export const hasAttachments = (conversation: Conversation = {}, labelID: string | undefined) =>
    getNumAttachments(conversation, labelID) > 0;

export const isUnread = (conversation: Conversation = {}, labelID: string | undefined) => {
    const labelUnread = conversation.Labels?.find((label) => label.ID === labelID)?.ContextNumUnread;

    if (labelUnread !== undefined) {
        return labelUnread !== 0;
    }
    if (conversation.ContextNumUnread !== undefined && conversation.ContextNumUnread !== 0) {
        return conversation.ContextNumUnread !== 0;
    }
    if (conversation.NumUnread !== undefined) {
        return conversation.NumUnread !== 0;
    }

    return false;
};
