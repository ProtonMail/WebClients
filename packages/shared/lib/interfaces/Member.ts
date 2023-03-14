import { MEMBER_PRIVATE, MEMBER_ROLE, MEMBER_TYPE } from '../constants';
import { Key } from './Key';

export interface PartialMemberAddress {
    ID: string;
    Email: string;
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
    "2faStatus": number;
}
