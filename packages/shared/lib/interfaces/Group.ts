import type { Address } from './Address';
import type { RoleAssignment } from './OrganizationRole';

export enum GroupPermissions {
    NobodyCanSend = 0,
    GroupMembersCanSend = 1,
    OrgMembersCanSend = 2,
    EveryoneCanSend = 3,
}

export enum GroupFlags {
    None = 0,
    System = 1 << 0,
    Drive = 1 << 1,
    Scim = 1 << 2,
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
    Address: Address;
    CreateTime?: number;
    Permissions?: GroupPermissions;
    Flags?: GroupFlags;
    MemberCount?: number;
}

export type EnhancedGroup = Group & {
    roleState: 'initial' | 'stale' | 'pending' | 'rejected' | 'full';
    GroupOrganizationRoles: RoleAssignment[];
};
