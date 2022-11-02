import { AuthResponse, AuthVersion } from '@proton/shared/lib/authentication/interface';
import { APP_NAMES } from '@proton/shared/lib/constants';
import {
    Address,
    Api,
    Address as tsAddress,
    KeySalt as tsKeySalt,
    User as tsUser,
} from '@proton/shared/lib/interfaces';
import { InternalAddressGenerationSetup } from '@proton/shared/lib/keys';

export interface InternalAddressGeneration {
    externalEmailAddress: Address | undefined;
    availableDomains: string[];
    setup: InternalAddressGenerationSetup;
    claimableAddress: { username: string; domain: string } | undefined;
}

export enum AuthStep {
    LOGIN,
    TWO_FA,
    UNLOCK,
    NEW_PASSWORD,
    GENERATE_INTERNAL,
    DONE,
}

export interface AuthTypes {
    totp: boolean;
    fido2: boolean;
    unlock: boolean;
}

export interface AuthCacheResult {
    appName: APP_NAMES;
    authVersion: AuthVersion;
    authResult: AuthResponse;
    api: Api;
    authApi: Api;
    userSaltResult?: [tsUser, tsKeySalt[]];
    authTypes: AuthTypes;
    username: string;
    persistent: boolean;
    loginPassword: string;
    hasGenerateKeys: boolean;
    hasInternalAddressSetup: boolean;
    hasTrustedDeviceRecovery: boolean;
    ignoreUnlock: boolean;
    internalAddressSetup?: InternalAddressGeneration;
}

export type AuthFlows = 'signup' | 'reset' | 'switch' | undefined;

export interface AppIntent {
    app: APP_NAMES;
    ref?: 'product-switch';
}

export interface AuthSession {
    UID: string;
    User: tsUser;
    Addresses?: tsAddress[];
    EventID?: string;
    keyPassword?: string;
    LocalID?: number;
    path?: string;
    flow?: AuthFlows;
    appIntent?: AppIntent;
    persistent: boolean;
    trusted: boolean;
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
