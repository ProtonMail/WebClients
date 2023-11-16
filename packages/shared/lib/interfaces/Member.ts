import { MEMBER_PRIVATE, MEMBER_ROLE, MEMBER_TYPE } from '../constants';
import { Key } from './Key';

export interface PartialMemberAddress {
    ID: string;
    Email: string;
}

export enum FAMILY_PLAN_INVITE_STATE {
    STATUS_DISABLED = 0,
    STATUS_ENABLED = 1,
    STATUS_INVITED = 2,
}

export interface Member {
    ID: string;
    Role: MEMBER_ROLE;
    Private: MEMBER_PRIVATE;
    Type: MEMBER_TYPE;
    ToMigrate: 0 | 1;
    MaxSpace: number;
    MaxVPN: number;
    Name: string;
    UsedSpace: number;
    Self: number;
    Subscriber: number;
    Keys: Key[];
    PublicKey: string;
    BrokenSKL: 0 | 1;
    Addresses?: PartialMemberAddress[];
    '2faStatus': number;
    State?: FAMILY_PLAN_INVITE_STATE; //This is only available for the family invitations
    TwoFactorRequiredTime: number;
    SSO: 1 | 0;
}
