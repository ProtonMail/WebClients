import { ContactGroup } from './contact';

export interface Address {
    ID?: string;
    Email?: string;
    DisplayName?: string;
    Priority?: number;
    Receive?: number;
    Status?: number;
    Order?: number;
    Send?: number;
    Signature?: string;
}

export type RecipientType = 'ToList' | 'CCList' | 'BCCList';
export const recipientTypes: RecipientType[] = ['ToList', 'CCList', 'BCCList'];

export interface Recipient {
    Name?: string;
    Address?: string;
    Group?: string;
}

export interface RecipientGroup {
    group?: ContactGroup;
    recipients: Recipient[];
}

export interface RecipientOrGroup {
    recipient?: Recipient;
    group?: RecipientGroup;
}
