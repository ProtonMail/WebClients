import { AuthResponse, AuthVersion } from 'proton-shared/lib/authentication/interface';
import { KeySalt as tsKeySalt, User as tsUser } from 'proton-shared/lib/interfaces';

export enum FORM {
    LOGIN,
    TOTP,
    U2F,
    UNLOCK,
    NEW_PASSWORD,
}

export interface AuthCacheResult {
    authVersion?: AuthVersion;
    authResult?: AuthResponse;
    userSaltResult?: [tsUser, tsKeySalt[]];
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
