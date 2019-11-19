import { Recipient } from './message';

export interface Conversation {
    ID?: string;
    Subject?: string;
    Size?: number;
    Time?: number;
    ContextTime?: number;
    NumMessages?: number;
    Senders?: Recipient[];
    Recipients?: Recipient[];
    NumUnread?: number;
}
