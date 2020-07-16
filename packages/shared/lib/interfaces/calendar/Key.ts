export enum KeyFlags {
    INACTIVE = 0,
    ACTIVE = 1,
    PRIMARY = 2,
}

export interface Key {
    ID: string;
    CalendarID: string;
    PrivateKey: string;
    PassphraseID: string;
    Flags: KeyFlags;
}
