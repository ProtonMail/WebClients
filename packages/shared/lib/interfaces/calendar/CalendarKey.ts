import { OpenPGPKey } from 'pmcrypto';

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
    privateKey: OpenPGPKey;
    publicKey: OpenPGPKey;
}

export interface InactiveCalendarKey {
    Key: CalendarKey;
    error: Error;
}
