import type { Address } from '@proton/shared/lib/interfaces/Address';

import type { ADDRESS_STATUS, ADDRESS_TYPE, MEMBER_PRIVATE, MEMBER_ROLE, MEMBER_TYPE } from '../constants';
import type { Key } from './Key';

export interface PartialMemberAddress {
    ID: string;
    Email: string;
    Status: ADDRESS_STATUS;
    Type: ADDRESS_TYPE;
    Permissions: number;
}

export enum MEMBER_STATE {
    STATUS_DISABLED = 0,
    STATUS_ENABLED = 1,
    STATUS_INVITED = 2,
}

export enum MEMBER_ORG_KEY_STATE {
    /** The member does not and should not have access to the org key (e.g. not an admin) */
    NoKey = 0,
    /** The member has full access to the most recent copy of the org key */
    Active = 1,
    /** The member does not have access to the most recent copy of the org key (including legacy keys) */
    Missing = 2,
    /** The member has been invited to but needs to activate the most recent copy of the org key */
    Pending = 3,
}

export interface MemberInvitationData {
    Address: string;
    Revision: number;
}

export enum MemberUnprivatizationState {
    Declined,
    Pending,
    Ready,
}

export enum CreateMemberMode {
    Password,
    Invitation,
}

export interface PublicMemberUnprivatizationOutput {
    State: MemberUnprivatizationState;
    InvitationData: string;
    InvitationSignature: string;
    InvitationEmail: string;
    AdminEmail: string;
    OrgKeyFingerprintSignature: string;
    OrgPublicKey: string;
    PrivateIntent: false;
}

export type PrivateMemberUnprivatizationOutput = {
    State: MemberUnprivatizationState;
    InvitationData: null;
    InvitationSignature: null;
    InvitationEmail: string;
    AdminEmail: string;
    OrgKeyFingerprintSignature: null;
    OrgPublicKey: null;
    PrivateIntent: true;
};
export type MemberUnprivatizationOutput = PublicMemberUnprivatizationOutput | PrivateMemberUnprivatizationOutput;

export type MemberUnprivatization = {
    State: MemberUnprivatizationState;
    PrivateKeys: string[] | null;
    ActivationToken: string | null;
    PrivateIntent: boolean;
    InvitationData: string | null;
    InvitationSignature: string | null;
    InvitationEmail: string | null;
};

export type MemberUnprivatizationReadyForUnprivatization = {
    State: MemberUnprivatizationState.Ready;
    PrivateKeys: string[];
    ActivationToken: string;
    PrivateIntent: false;
    InvitationData: string;
    InvitationSignature: string;
    InvitationEmail: string;
};

export type MemberUnprivatizationReadyForUnprivatizationApproval = {
    State: MemberUnprivatizationState.Ready;
    PrivateKeys: string[];
    ActivationToken: string;
    PrivateIntent: false;
    InvitationData: null;
    InvitationSignature: null;
    InvitationEmail: null;
};

export interface Member {
    ID: string;
    Role: MEMBER_ROLE;
    Private: MEMBER_PRIVATE;
    Type: MEMBER_TYPE;
    AccessToOrgKey: MEMBER_ORG_KEY_STATE;
    ToMigrate: 0 | 1 | 2;
    MaxSpace: number;
    MaxVPN: number;
    NumAI: number;
    Name: string;
    UsedSpace: number;
    Self: number;
    Subscriber: number;
    Keys: Key[];
    PublicKey: string;
    BrokenSKL: 0 | 1;
    Addresses?: PartialMemberAddress[];
    '2faStatus': number;
    State: MEMBER_STATE;
    TwoFactorRequiredTime: number;
    SSO: 1 | 0;
    Unprivatization: null | MemberUnprivatization;
}

export interface MemberReadyForUnprivatization extends Member {
    Unprivatization: MemberUnprivatizationReadyForUnprivatization;
}

export interface MemberReadyForUnprivatizationApproval extends Member {
    Unprivatization: MemberUnprivatizationReadyForUnprivatization;
}

export type EnhancedMember = Member &
    (
        | { addressState: 'stale' | 'partial' | 'pending' | 'rejected' }
        | {
              addressState: 'full';
              Addresses: Address[];
          }
    );
