export enum ServiceAccountState {
    Disabled = 0,
    Active = 1,
    NoTokens = 2,
    NoManager = 3,
}

export interface ServiceAccountManager {
    MemberID: string;
    DelegatedAccessID: string;
}

export interface ServiceAccount {
    MemberID: string;
    UserID: string;
    AddressID: string;
    Name: string;
    Email: string;
    State: ServiceAccountState;
    CreateTime: number;
    Managers: ServiceAccountManager[];
}

export interface ServiceAccountInput {
    Name: string;
    Email: string;
}

export interface ServiceAccountAccessInput {
    TargetEmail: string;
    /** The service account address whose primary key signed `UserKeyToken`. */
    SourceAddressID: string;
    UserKeyToken: string;
    UserKeys: { UserKeyID: string; PrivateKey: string }[];
}
