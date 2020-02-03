export interface MemberPassphrase {
    MemberID: string;
    Passphrase: string;
    Signature: string;
}

export interface Invitation {
    CalendarID: string;
    PassphraseID: string;
    InvitationID: string;
    Status: number;
    CreateTime: number;
    ExpirationTime: number;
    Permissions: number;
    Email: string;
}

export interface Passphrase {
    ID: string;
    Flags: number;
    MemberPassphrases: MemberPassphrase[];
    Invitations: Invitation[];
}
