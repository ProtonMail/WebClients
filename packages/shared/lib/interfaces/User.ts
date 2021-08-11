import { Key } from './Key';
import { USER_ROLES } from '../constants';

export enum MNEMONIC_STATUS {
    DISABLED = 0,
    ENABLED = 1,
    OUTDATED = 2,
    SET = 3,
}

export interface User {
    ID: string;
    Name: string;
    UsedSpace: number;
    Currency: string;
    Credit: number;
    MaxSpace: number;
    MaxUpload: number;
    Role: USER_ROLES;
    Private: number;
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
    canPay: boolean;
}
