export enum DelegatedAccessStateEnum {
    Disabled = 0,
    Enabled = 1,
}

export enum DelegatedAccessTypeEnum {
    EmergencyAccess = 1,
    SocialRecovery = 2,
}

export interface IncomingEphemeral {
    [key: string]: boolean | undefined;
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
}
