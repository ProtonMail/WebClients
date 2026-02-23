import type { PublicKeyReference } from '@proton/crypto';
import type { Epoch, SelfAuditResult } from '@proton/key-transparency/interfaces';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import type { PrimaryAddressKeysForSigning } from '../keys';
import type { Address } from './Address';
import type { Api } from './Api';
import type { ProcessedApiKey } from './EncryptionPreferences';
import type { DecryptedAddressKey, DecryptedKey, KeyPair } from './Key';
import type { FetchedSignedKeyList, SignedKeyList } from './SignedKeyList';
import type { User } from './User';

export enum IGNORE_KT {
    NORMAL,
    EXTERNAL,
    CATCHALL,
}

export interface KTLocalStorageAPI {
    getBlobs: () => Promise<string[]>;
    removeItem: (key: string) => Promise<void | undefined>;
    getItem: (key: string) => Promise<string | null | undefined>;
    setItem: (key: string, value: string) => Promise<void | undefined>;
}

export interface SelfAuditState {
    userKeys: KeyPair[];
    lastSelfAudit: SelfAuditResult | undefined;
    addresses: {
        address: Address;
        addressKeys: DecryptedAddressKey[];
    }[];
}

export interface KeyTransparencyState {
    selfAuditResult?: SelfAuditResult;
}

export type KeyTransparencyVerify = (
    address: Address,
    signedKeyList: SignedKeyList,
    publicKeys: PublicKeyReference[]
) => Promise<void>;
export type PreAuthKTVerify = (userKeys: DecryptedKey[]) => KeyTransparencyVerify;
export type KeyTransparencyCommit = (user: User, userKeys: DecryptedKey[]) => Promise<void>;

export interface PreAuthKTVerifier {
    preAuthKTVerify: PreAuthKTVerify;
    preAuthKTCommit: (userID: string, api: Api) => Promise<void>;
}

export interface KTUserContext {
    ktActivation: KeyTransparencyActivation;
    appName: APP_NAMES;
    getUser: () => Promise<User>;
    getUserKeys: () => Promise<DecryptedKey[]>;
}

export type VerifyOutboundPublicKeys = (data: {
    ktUserContext: KTUserContext;
    email: string;
    /**
     * Optimisations for apps where users with external domains do not have valid keys (e.g. Mail)
     */
    skipVerificationOfExternalDomains: boolean;
    address: {
        keyList: ProcessedApiKey[];
        signedKeyList: FetchedSignedKeyList | null;
    };
    catchAll?: {
        keyList: ProcessedApiKey[];
        signedKeyList: FetchedSignedKeyList | null;
    };
    api: Api;
}) => Promise<{
    addressKTResult?: KeyTransparencyVerificationResult;
    catchAllKTResult?: KeyTransparencyVerificationResult;
}>;

export type SaveSKLToLS = (data: {
    ktUserContext: KTUserContext;
    email: string;
    data: string;
    revision: number;
    expectedMinEpochID: number;
    addressID?: string;
    isCatchall: boolean;
}) => Promise<void>;

export type KeyMigrationKTVerifier = (options: {
    email: string;
    signedKeyList: Partial<FetchedSignedKeyList> | null | undefined;
    api: Api;
}) => Promise<void>;

export enum KeyTransparencyActivation {
    DISABLED,
    LOG_ONLY,
    SHOW_UI,
}

export type GetLatestEpoch = ({ api, forceRefresh }: { api: Api; forceRefresh?: boolean }) => Promise<Epoch>;

export enum KT_VERIFICATION_STATUS {
    VERIFIED_KEYS,
    UNVERIFIED_KEYS,
    VERIFICATION_FAILED,
}

export interface KeyTransparencyVerificationResult {
    status: KT_VERIFICATION_STATUS;
    keysChangedRecently?: boolean;
}

export type UploadMissingSKL = (data: {
    address: Address;
    addressKeys: DecryptedAddressKey[];
    epoch: Epoch;
    ktUserContext: KTUserContext;
    api: Api;
}) => Promise<void>;

export type ResetSelfAudit = (options: {
    api: Api;
    ktActivation: KeyTransparencyActivation;
    user: User;
    keyPassword: string;
    addressesBeforeReset: Address[];
}) => Promise<void>;

export interface ResignSKLWithPrimaryKeyArguments {
    api: Api;
    ktActivation: KeyTransparencyActivation;
    address: Address;
    newPrimaryKeys: PrimaryAddressKeysForSigning;
    formerPrimaryKeys: PrimaryAddressKeysForSigning;
    userKeys: DecryptedKey[];
}

export type ResignSKLWithPrimaryKey = (args: ResignSKLWithPrimaryKeyArguments) => Promise<void>;
