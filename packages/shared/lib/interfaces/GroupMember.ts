export enum GROUP_MEMBER_STATE {
    PENDING = 0,
    ACTIVE = 1,
    OUTDATED = 2,
    PAUSED = 3,
    REJECTED = 4,
}

export enum GROUP_MEMBER_TYPE {
    INTERNAL = 0,
    EXTERNAL = 1,
    INTERNAL_TYPE_EXTERNAL = 2,
}

export enum GROUP_MEMBER_PERMISSIONS {
    NONE = 0, // 0000
    SEND = 1 << 0, // 0001
    LEAVE = 1 << 1, // 0010
}

export enum GROUP_MEMBERSHIP_STATUS {
    ACTIVE = 'active',
    UNANSWERED = 'unanswered',
}

export interface GroupMemberAddressPendingKey {
    PrivateKey: string; // armored key
    ActivationToken: string; // armored
}

export interface GroupMember {
    ID: string;
    Type: GROUP_MEMBER_TYPE;
    AddressID?: string;
    // the backend is currently returning Id but it should use ID
    // TODO(plavarin): 2024-07-23, remove when fixed
    AddressId?: string;
    Email: string;
    State: GROUP_MEMBER_STATE;
    Permissions: GROUP_MEMBER_PERMISSIONS;
    GroupMemberAddressPendingKey?: GroupMemberAddressPendingKey;
    GroupId?: string; // here until BE change is merged, should prefer GroupID
    GroupID: string;
}

// really just a special group member
export interface GroupMembership {
    Name: string;
    Address: string;
    Status: string;
    Keys: GroupMemberAddressPendingKey;
    AddressID: string;
    ID: string;
    Permissions: number;
}

export interface GroupMembershipReturn {
    Group: {
        Name: string;
        Address: string;
    };
    State: number;
    ForwardingKeys: GroupMemberAddressPendingKey;
    AddressId: string;
    ID: string;
    Permissions: number;
}
