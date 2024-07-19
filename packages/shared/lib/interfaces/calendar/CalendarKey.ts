import type { PrivateKeyReference, PublicKeyReference } from '@proton/crypto';
import type { CALENDAR_FLAGS } from '@proton/shared/lib/calendar/constants';
import type { ApiResponse } from '@proton/shared/lib/interfaces';

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

interface CalendarMemberPassphrase {
    MemberID: string;
    Passphrase: string;
    Signature: string;
}

export interface CalendarPassphrase {
    ID: string;
    CalendarID: string;
    Flags: CALENDAR_FLAGS;
    MemberPassphrases: CalendarMemberPassphrase[];
}

export interface DecryptedCalendarKey {
    Key: CalendarKey;
    privateKey: PrivateKeyReference;
    publicKey: PublicKeyReference;
}

export interface ReenableKeyResponse extends ApiResponse {
    Key: CalendarKey;
}
