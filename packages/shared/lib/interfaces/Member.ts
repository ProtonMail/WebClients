import { Key } from './Key';
import { MEMBER_PRIVATE, MEMBER_ROLE, MEMBER_TYPE } from '../constants';

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
}
