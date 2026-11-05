/** Delegated access states applicable to both incoming or outgoing delegated access */
export enum DelegatedAccessStateEnum {
    Disabled = 0,
    Enabled = 1,
    /** (Emergency access only) the contact/user has been granted access */
    Accessible = 2,
    /** (Social recovery only) the contact/user has been asked to help with key re-activation  */
    Recoverable = 3,
}

export enum DelegatedAccessTypeEnum {
    EmergencyAccess = 1,
    SocialRecovery = 2,
}

export interface IncomingDelegatedAccessOutput {
    DelegatedAccessID: string;
    State: DelegatedAccessStateEnum;
    Types: DelegatedAccessTypeEnum;
    TargetAddressID: string;
    SourceEmail: string;
    AccessibleTime: null | number;
    TriggerDelay: number;
    CreateTime: number;
    RecoveryToken: string | null;
}

export interface OutgoingDelegatedAccessOutput {
    DelegatedAccessID: string;
    State: DelegatedAccessStateEnum;
    Types: DelegatedAccessTypeEnum;
    TargetEmail: string;
    SourceAddressID: string;
    AccessibleTime: null | number;
    TriggerDelay: number;
    CreateTime: number;
    RecoveryToken: string | null;
    RecoverableTime: null | number;
}
