import { ContactGroup } from 'proton-shared/lib/interfaces/contacts';

export type RecipientType = 'ToList' | 'CCList' | 'BCCList';
export const recipientTypes: RecipientType[] = ['ToList', 'CCList', 'BCCList'];

export interface Recipient {
    Name?: string;
    Address?: string;
    ContactID?: string;
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
