import { AuthResponse, AuthVersion } from 'proton-shared/lib/authentication/interface';
import { Api, KeySalt as tsKeySalt, User as tsUser } from 'proton-shared/lib/interfaces';

export enum FORM {
    LOGIN,
    TOTP,
    U2F,
    UNLOCK,
    NEW_PASSWORD,
}

export interface AuthCacheResult {
    authVersion: AuthVersion;
    authResult: AuthResponse;
    authApi: Api;
    userSaltResult?: [tsUser, tsKeySalt[]];
    hasTotp: boolean;
    hasU2F: boolean;
    hasUnlock: boolean;
}

export interface LoginModel {
    username: string;
    password: string;
    totp: string;
    isTotpRecovery: boolean;
    keyPassword: string;
    newPassword: string;
    confirmNewPassword: string;
    form: FORM;
}
