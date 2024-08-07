import type { Address } from './Address';

export enum GroupPermissions {
    NobodyCanSend = 0,
    GroupMembersCanSend = 1,
    OrgMembersCanSend = 2,
    EveryoneCanSend = 3,
}

export enum GroupFlags {
    None = 0,
}

export enum GroupMemberType {
    Internal = 0,
    External = 1,
}

export interface ProxyInstances {
    PgpVersion: number;
    GroupAddressKeyFingerprint: string;
    GroupMemberAddressKeyFingerprint: string;
    ProxyParam: string;
}

export interface Group {
    ID: string;
    Name: string;
    Description: string;
    Address: Address | { Email: string; ID?: string };
    CreateTime?: number;
    Permissions?: GroupPermissions;
    Flags?: GroupFlags;
    MemberCount?: number;
}
