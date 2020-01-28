import { Conversation } from '../models/conversation';

export const getSenders = ({ Senders = [] }: Conversation = {}) => Senders;

export const getRecipients = ({ Recipients = [] }: Conversation) => Recipients;
