import type {
    PrivateKeyReference,
    PrivateKeyReferenceV4,
    PrivateKeyReferenceV6,
    PublicKeyReference,
} from '@proton/crypto';

import type { RequireSome } from './utils';

export interface KeyWithRecoverySecret extends Key {
    RecoverySecret: string;
    RecoverySecretSignature: string;
}

export interface Key {
    ID: string;
    Primary: 1 | 0;
    Active: 1 | 0;
    Flags?: number; // Only available for address keys
    Fingerprint: string;
    Fingerprints: string[];
    Version: number;
    Activation?: string;
    PrivateKey: string; // armored key
    Token?: string;
    Signature?: string; // Only available for address keys
    RecoverySecret?: string | null; // Only available for user keys
    RecoverySecretSignature?: string | null; // Only available for user keys
    AddressForwardingID?: string | null; // Only available for address keys
    GroupMemberID?: string | null; // Only available for address keys
}

export type AddressKey = RequireSome<Key, 'Flags' | 'Signature' | 'AddressForwardingID'>;
export type UserKey = RequireSome<Key, 'RecoverySecret' | 'RecoverySecretSignature'>;

export interface KeyPair<PrivateKeyReferenceWithVersion extends PrivateKeyReference = PrivateKeyReference> {
    privateKey: PrivateKeyReferenceWithVersion;
    publicKey: PublicKeyReference;
}

export interface KeysPair {
    privateKeys: PrivateKeyReference[];
    publicKeys: PublicKeyReference[];
}

export interface DecryptedKey<PrivateKeyReferenceWithVersion extends PrivateKeyReference = PrivateKeyReference>
    extends KeyPair<PrivateKeyReferenceWithVersion> {
    ID: string;
}

export interface DecryptedAddressKey<PrivateKeyReferenceWithVersion extends PrivateKeyReference = PrivateKeyReference>
    extends KeyPair<PrivateKeyReferenceWithVersion> {
    ID: string;
    Flags: number;
    Primary: 1 | 0;
}

export interface InactiveKey {
    Key: Key;
    fingerprint?: string;
}

export interface ActiveKey<
    PrivateKeyReferenceWithVersion extends PrivateKeyReference = PrivateKeyReferenceV4 | PrivateKeyReferenceV6,
> extends DecryptedKey<PrivateKeyReferenceWithVersion> {
    fingerprint: string;
    flags: number;
    primary: 1 | 0;
    sha256Fingerprints: string[];
}

export type ActiveKeyWithVersion = ActiveKey<PrivateKeyReferenceV6> | ActiveKey<PrivateKeyReferenceV4>;

/**
 * Users who have generated a v6 address key might have two primary keys instead of one.
 * This is because a v6 address key can only be marked as primary alongside a v4 key,
 * for compatibility reasons with Proton apps/clients that do not support encrypting to v6 keys.
 * We store v4 and v6 keys separately to make it easier to implement primary key changes and checks,
 * and to help keep track of the key versions being used with TS support.
 */
export interface ActiveAddressKeysByVersion {
    v4: ActiveKey<PrivateKeyReferenceV4>[]; // one or more
    v6: ActiveKey<PrivateKeyReferenceV6>[]; // zero or more
}

export const isActiveKeyV6 = (activeKey: ActiveKey): activeKey is ActiveKey<PrivateKeyReferenceV6> =>
    activeKey.privateKey.isPrivateKeyV6();
