import { PrivateKeyReference, PublicKeyReference } from '@proton/crypto';

export enum CalendarKeyFlags {
    INACTIVE = 0,
    ACTIVE = 1,
    PRIMARY = 2,
}

export interface CalendarKey {
    ID: string;
    CalendarID: string;
    PrivateKey: string;
    PassphraseID: string;
    Flags: CalendarKeyFlags;
}

export interface DecryptedCalendarKey {
    Key: CalendarKey;
    privateKey: PrivateKeyReference;
    publicKey: PublicKeyReference;
}

export interface InactiveCalendarKey {
    Key: CalendarKey;
    error: Error;
}

export interface ReenableKeyResponse {
    Code: number;
    Key: CalendarKey;
}
