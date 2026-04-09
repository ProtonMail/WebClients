import type { DelegatedAccessStateEnum, DelegatedAccessTypeEnum } from '@proton/shared/lib/interfaces/DelegatedAccess';

export interface IncomingEphemeral {
    [key: string]: boolean | undefined;
}

export type OutgoingEphemeralKeys = 'recover' | 'recover-token' | 'enable';
export interface OutgoingEphemeral {
    [key: `${string}-${OutgoingEphemeralKeys}`]: boolean | undefined;
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
