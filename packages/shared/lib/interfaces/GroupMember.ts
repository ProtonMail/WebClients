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
}

export enum GroupMemberPermissions {
    CanSend = 0,
    CantSend = 1,
}

export interface GroupMemberAddressPendingKey {
    PrivateKey: string; // armored key
    ActivationToken: string; // armored
}

export interface GroupMember {
    ID: string;
    Type: GROUP_MEMBER_TYPE;
    AddressID: string;
    Email: string;
    State: GROUP_MEMBER_STATE;
    GroupMemberAddressPendingKey?: GroupMemberAddressPendingKey;
}

// really just a special group member
export interface GroupMembership {
    Name: string;
    Address: string;
    Status: string;
    Keys: GroupMemberAddressPendingKey;
    AddressID: string;
    ID: string;
}
