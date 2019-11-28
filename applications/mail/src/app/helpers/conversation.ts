import { Conversation } from '../models/conversation';

export const getSenders = ({ Senders = [] }: Conversation = {}) => Senders.map(({ Address, Name }) => Name || Address);

export const getRecipients = ({ Recipients = [] }: Conversation) =>
    Recipients.map(({ Address, Name }) => Name || Address);
