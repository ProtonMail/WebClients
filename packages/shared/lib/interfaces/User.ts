import type { Currency } from '@proton/payments';

import type { AccessType } from '../authentication/accessType';
import type { USER_ROLES } from '../constants';
import type { Key } from './Key';

export enum MNEMONIC_STATUS {
    /** Mnemonic has been opted-out in the settings */
    DISABLED = 0,
    /** Mnemonic is enabled but not set (requires user action) */
    ENABLED = 1,
    /**
     * Mnemonic is set but in an old state or compromised and needs to be reset
     *
     * In this case the mnemonic can still be used to recover some old keys (partial recovery data is still
     * available) but not to fully reset an account, since we do not have the guarantee of having the latest user
     * key available.
     */
    OUTDATED = 2,
    /**
     * Mnemonic is OK
     */
    SET = 3,
    /**
     * User should be prompted to enable the mnemonic - alias of 1 for FE
     */
    PROMPT = 4,
}

export enum UserType {
    PROTON = 1,
    MANAGED = 2,
    EXTERNAL = 3,
}

export enum SessionRecoveryState {
    NONE = 0,
    GRACE_PERIOD = 1,
    CANCELLED = 2,
    INSECURE = 3,
    EXPIRED = 4,
}

export enum SessionRecoveryReason {
    NONE = 0,
    CANCELLED = 1,
    AUTHENTICATION = 2,
}

export enum UserLockedFlags {
    BASE_STORAGE_EXCEEDED = 1,
    DRIVE_STORAGE_EXCEEDED = 2,
    STORAGE_EXCEEDED = BASE_STORAGE_EXCEEDED | DRIVE_STORAGE_EXCEEDED,
    ORG_ISSUE_FOR_PRIMARY_ADMIN = 4,
    ORG_ISSUE_FOR_MEMBER = 8,
    USER_WITH_A_DOMAIN = 16,
}

export enum UNPAID_STATE {
    NOT_UNPAID = 0,
    AVAILABLE = 1,
    OVERDUE = 2,
}

export interface User {
    ID: string;
    Name: string;
    UsedSpace: number;
    UsedBaseSpace: number;
    UsedDriveSpace: number;
    Currency: Currency;
    Credit: number;
    MaxSpace: number;
    MaxBaseSpace: number;
    MaxDriveSpace: number;
    MaxUpload: number;
    NumAI: number;
    NumLumo: number;
    Role: USER_ROLES;
    Private: number;
    Type: UserType;
    Subscribed: number;
    Services: number;
    Delinquent: UNPAID_STATE;
    Email: string;
    DisplayName: string;
    OrganizationPrivateKey?: string;
    Keys: Key[];
    DriveEarlyAccess: number;
    ToMigrate: 0 | 1;
    MnemonicStatus: MNEMONIC_STATUS;
    ProductUsedSpace: {
        Calendar: number;
        Contact: number;
        Drive: number;
        Mail: number;
        Pass: number;
    };
    Idle: 0 | 1;
    CreateTime: number;
    Flags: {
        protected: boolean;
        'drive-early-access': boolean;
        'onboard-checklist-storage-granted': boolean;
        'has-temporary-password': boolean;
        'test-account': boolean;
        'no-login': boolean;
        'no-proton-address': boolean;
        'recovery-attempt': boolean;
        'pass-lifetime': boolean;
        'pass-from-sl': boolean;
        sso: boolean;
        'has-a-byoe-address': boolean;
        'delegated-access': boolean;
    };
    AccountRecovery: {
        State: SessionRecoveryState;
        StartTime: number;
        EndTime: number;
        Reason: SessionRecoveryReason | null;
        UID: string;
        IsCurrentSession: boolean;
    } | null;
    LockedFlags?: number;
    Billed?: boolean;
    HasMultipleSubscriptions: boolean;
}

export function isBilledUser(user: User | undefined): boolean {
    if (!user) {
        return false;
    }

    return !!user.Billed;
}

export interface UserInfo {
    isAdmin: boolean;
    isMember: boolean;
    isFree: boolean;
    isPaid: boolean;
    isPrivate: boolean;
    /**
     * isSelf determines if the user has `self` scope, i.e.
     * it's true when the user is signed in normally,
     * and false when an administrator is signed in to the user's non-private account through the organization key
     */
    isSelf: boolean;
    isDelinquent: boolean;
    hasPaidMail: boolean;
    hasPaidVpn: boolean;
    hasPaidDrive: boolean;
    hasPaidPass: boolean;
    hasPaidLumo: boolean;
    hasPaidMeet: boolean;
    hasPassLifetime: boolean;
    canPay: boolean;
    accessType: AccessType;
}

export interface UserModel extends User, UserInfo {}
