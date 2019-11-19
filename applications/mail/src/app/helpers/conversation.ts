import { Conversation } from '../models/conversation';

export const getSenders = ({ Senders = [] }: Conversation = {}) => {
    return Senders.map(({ Address, Name }) => Name || Address);
};

export const getRecipients = ({ Recipients = [] }: Conversation) => {
    return Recipients.map(({ Address, Name }) => Name || Address);
};
