import { PublicKeyReference } from '@proton/crypto';

import { Address } from './Address';
import { AddressKey, DecryptedKey } from './Key';
import { FetchedSignedKeyList, SignedKeyList } from './SignedKeyList';

export enum IGNORE_KT {
    NORMAL,
    EXTERNAL,
    CATCHALL,
}

export interface ArmoredKeyWithFlags {
    Flags: number;
    PublicKey: string;
    Primary?: 0 | 1;
}

export interface KTLocalStorageAPI {
    getBlobs: () => Promise<string[]>;
    removeItem: (key: string) => Promise<void | undefined>;
    getItem: (key: string) => Promise<string | null | undefined>;
    setItem: (key: string, value: string) => Promise<void | undefined>;
}

export interface KeyTransparencyState {
    selfAuditPromise: Promise<void>;
    ktLSAPI: KTLocalStorageAPI;
}

export type KeyTransparencyVerify = (
    address: Address,
    signedKeyList: SignedKeyList,
    publicKeys: PublicKeyReference[]
) => Promise<void>;
export type PreAuthKTVerify = (userKeys: DecryptedKey[]) => KeyTransparencyVerify;
export type KeyTransparencyCommit = (userKeys: DecryptedKey[]) => Promise<void>;

export interface PreAuthKTVerifier {
    preAuthKTVerify: PreAuthKTVerify;
    preAuthKTCommit: (userID: string) => Promise<void>;
}

export type VerifyOutboundPublicKeys = (
    keyList: ArmoredKeyWithFlags[],
    email: string,
    SignedKeyList: FetchedSignedKeyList | null,
    IgnoreKT?: IGNORE_KT
) => Promise<void>;

export type KeyMigrationKTVerifier = (
    email: string,
    keyList: AddressKey[],
    SignedKeyList: FetchedSignedKeyList | null
) => Promise<void>;

export type FixMultiplePrimaryKeys = (address: Address) => Promise<void>;
