import { Recipient } from './message';
import { Label } from './label';

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
    Labels?: Label[];
}
