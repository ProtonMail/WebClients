import { Conversation } from '../models/conversation';

export const getSenders = ({ Senders = [] }: Conversation = {}) => Senders.map(({ Address, Name }) => Name || Address);

export const getRecipients = ({ Recipients = [] }: Conversation) =>
    Recipients.map(({ Address, Name }) => Name || Address);

export const getLabel = ({ Labels = [] }: Conversation, labelID: string) =>
    Labels.find(({ ID = '' }) => ID === labelID);

export const getTime = (conversation: Conversation, labelID: string) =>
    (getLabel(conversation, labelID) || {}).ContextTime || 0;
