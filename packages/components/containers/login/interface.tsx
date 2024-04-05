import { AuthResponse, AuthVersion } from '@proton/shared/lib/authentication/interface';
import { OfflineKey } from '@proton/shared/lib/authentication/offlineKey';
import { APP_NAMES } from '@proton/shared/lib/constants';
import {
    Address,
    Api,
    KeyMigrationKTVerifier,
    PreAuthKTVerifier,
    Address as tsAddress,
    KeySalt as tsKeySalt,
    User as tsUser,
} from '@proton/shared/lib/interfaces';
import { AddressGenerationSetup, ClaimableAddress } from '@proton/shared/lib/keys';

export interface AddressGeneration {
    externalEmailAddress: Address | undefined;
    availableDomains: string[];
    setup: AddressGenerationSetup;
    claimableAddress: ClaimableAddress | undefined;
}

export enum AuthStep {
    LOGIN,
    TWO_FA,
    UNLOCK,
    NEW_PASSWORD,
    SETUP,
    DONE,
}

export interface AuthTypes {
    totp: boolean;
    fido2: boolean;
    unlock: boolean;
}

export interface AuthCacheResult {
    appName: APP_NAMES;
    toApp: APP_NAMES | undefined;
    shouldSetup?: boolean;
    authVersion: AuthVersion;
    authResponse: AuthResponse;
    api: Api;
    data: { user?: tsUser; salts?: tsKeySalt[]; addresses?: Address[] };
    authTypes: AuthTypes;
    username: string;
    persistent: boolean;
    loginPassword: string;
    ignoreUnlock: boolean;
    addressGeneration?: AddressGeneration;
    setupVPN: boolean;
    preAuthKTVerifier: PreAuthKTVerifier;
    keyMigrationKTVerifier: KeyMigrationKTVerifier;
}

export type AuthFlows = 'signup' | 'reset' | 'switch' | 'login' | undefined;

export interface AppIntent {
    app: APP_NAMES;
    ref?: 'product-switch';
}

export interface AuthSession {
    UID: string;
    EventID?: string;
    LocalID: number;
    User: tsUser;
    Addresses?: tsAddress[];
    keyPassword?: string;
    loginPassword?: string;
    path?: string;
    flow?: AuthFlows;
    prompt?: 'login' | null;
    appIntent?: AppIntent;
    persistent: boolean;
    trusted: boolean;
    clientKey: string;
    offlineKey: OfflineKey | undefined;
}

export type AuthActionResponse =
    | {
          to: AuthStep.DONE;
          session: AuthSession;
      }
    | {
          cache: AuthCacheResult;
          to: Exclude<AuthStep, AuthStep.DONE>;
      };

export enum AuthType {
    SRP,
    ExternalSSO,
}
