import { Key } from './Key';

export interface Member {
    ID: string;
    Role: number;
    Private: number;
    Type: number;
    ToMigrate: 0 | 1;
    MaxSpace: number;
    MaxVPN: number;
    Name: string;
    UsedSpace: number;
    Self: number;
    Subscriber: number;
    Keys: Key[];
    PublicKey: string;
}
