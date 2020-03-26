import { ContactGroup } from 'proton-shared/lib/interfaces/ContactGroup';

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
