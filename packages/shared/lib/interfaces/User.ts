import { USER_ROLES } from '../constants';
import { Key } from './Key';
import { Currency } from './Subscription';

export enum MNEMONIC_STATUS {
    DISABLED = 0,
    ENABLED = 1,
    OUTDATED = 2,
    SET = 3,
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

export interface User {
    ID: string;
    Name: string;
    UsedSpace: number;
    Currency: Currency;
    Credit: number;
    MaxSpace: number;
    MaxUpload: number;
    Role: USER_ROLES;
    Private: number;
    Type: UserType;
    Subscribed: number;
    Services: number;
    Delinquent: number;
    Email: string;
    DisplayName: string;
    OrganizationPrivateKey?: string;
    Keys: Key[];
    DriveEarlyAccess: number;
    ToMigrate: 0 | 1;
    MnemonicStatus: MNEMONIC_STATUS;
    Idle: 0 | 1;
    CreateTime: number;
    Flags: {
        protected: boolean;
        'drive-early-access': boolean;
        'onboard-checklist-storage-granted': boolean;
        'has-temporary-password': boolean;
        'test-account': boolean;
        'no-login': boolean;
        'recovery-attempt': boolean;
        sso: boolean;
    };
    AccountRecovery: {
        State: SessionRecoveryState;
        StartTime: number;
        EndTime: number;
        Reason: SessionRecoveryReason | null;
        UID: string;
    } | null;
}

export interface UserModel extends User {
    isAdmin: boolean;
    isMember: boolean;
    isFree: boolean;
    isPaid: boolean;
    isPrivate: boolean;
    isSubUser: boolean;
    isDelinquent: boolean;
    hasNonDelinquentScope: boolean;
    hasPaidMail: boolean;
    hasPaidVpn: boolean;
    hasPaidDrive: boolean;
    canPay: boolean;
}
