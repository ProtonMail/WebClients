import { Key } from 'proton-shared/lib/interfaces';

export interface KeyData {
    Code: number;
    RecipientType: number;
    MIMEType: string;
    Keys: Key[];
    SignedKeyList: any[];
    Warnings: any[];
}
