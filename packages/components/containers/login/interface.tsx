import { AuthResponse, AuthVersion } from '@proton/shared/lib/authentication/interface';
import { Api, KeySalt as tsKeySalt, User as tsUser, Address as tsAddress } from '@proton/shared/lib/interfaces';

export enum AuthStep {
    LOGIN,
    TOTP,
    U2F,
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
    loginPassword: string;
    hasGenerateKeys: boolean;
    ignoreUnlock: boolean;
}

export type AuthFlows = 'signup' | 'reset' | 'switch' | undefined;

export interface AuthSession {
    UID: string;
    User: tsUser;
    Addresses?: tsAddress[];
    EventID?: string;
    keyPassword?: string;
    LocalID?: number;
    path?: string;
    flow?: AuthFlows;
}
export type AuthActionResponse =
    | {
          to: AuthStep.DONE;
          session: AuthSession;
      }
    | {
          cache: AuthCacheResult;
          to: AuthStep.LOGIN | AuthStep.TOTP | AuthStep.NEW_PASSWORD | AuthStep.U2F | AuthStep.UNLOCK;
      };
