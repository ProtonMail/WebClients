import { SIEVE_VERSION, SieveBranch } from '@proton/sieve/src/interface';

// bit 0 = unencrypted/encrypted, bit 1: internal/external
export enum ForwardingType {
    InternalUnencrypted = 0,
    InternalEncrypted = 1,
    ExternalUnencrypted = 2,
    ExternalEncrypted = 3,
}

export enum ForwardingState {
    Pending = 0,
    Active = 1,
    Outdated = 2,
    Paused = 3,
    Rejected = 4,
}

export interface AddressForwarding {
    ID: string;
    CreateTime: number;
    State: ForwardingState;
    Type: ForwardingType;
    Filter: {
        Tree: SieveBranch[];
        Version: SIEVE_VERSION;
        Sieve: string;
    } | null;
}

interface ForwardingKey {
    PrivateKey: string;
    ActivationToken: string;
}

export interface IncomingAddressForwarding extends AddressForwarding {
    ForwardeeAddressID: string;
    ForwarderEmail: string;
    ForwardingKeys?: ForwardingKey[];
}

export interface OutgoingAddressForwarding extends AddressForwarding {
    ForwarderAddressID: string;
    ForwardeeEmail: string;
}
