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
    externalEmailAddress?: Address;
    availableDomains: string[];
    setup: InternalAddressGenerationSetup;
}

export enum AuthStep {
    LOGIN,
    TWO_FA,
    UNLOCK,
    NEW_PASSWORD,
    GENERATE_INTERNAL,
    DONE,
}

export interface AuthCacheResult {
    authVersion: AuthVersion;
    authResult: AuthResponse;
    api: Api;
    authApi: Api;
    userSaltResult?: [tsUser, tsKeySalt[]];
    hasTotp: boolean;
    hasU2F: boolean;
    hasUnlock: boolean;
    username: string;
    persistent: boolean;
    loginPassword: string;
    hasGenerateKeys: boolean;
    hasInternalAddressSetup: boolean;
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
