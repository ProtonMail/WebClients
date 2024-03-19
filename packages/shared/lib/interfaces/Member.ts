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

export interface Member {
    ID: string;
    Role: MEMBER_ROLE;
    Private: MEMBER_PRIVATE;
    Type: MEMBER_TYPE;
    AccessToOrgKey: MEMBER_ORG_KEY_STATE;
    ToMigrate: 0 | 1 | 2;
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
    State: MEMBER_STATE;
    TwoFactorRequiredTime: number;
    SSO: 1 | 0;
}

export type EnhancedMember = Member &
    (
        | { addressState: 'stale' | 'partial' | 'pending' | 'rejected' }
        | {
              addressState: 'full';
              Addresses: Address[];
          }
    );
