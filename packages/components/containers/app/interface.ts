import { User as tsUser } from 'proton-shared/lib/interfaces';
import { AuthenticationStore } from 'proton-shared/lib/authentication/createAuthenticationStore';

export interface OnLoginCallbackArguments {
    UID: string;
    EventID?: string;
    keyPassword?: string;
    User?: tsUser;
    LocalID?: number;
    pathname?: string;
}
export type ProtonLoginCallback = (data: OnLoginCallbackArguments) => void;
export type OnLoginCallback = (data: OnLoginCallbackArguments) => Promise<void>;

export interface PrivateAuthenticationStore extends AuthenticationStore {
    UID: string;
    localID?: number;
    logout: () => void;
}

export interface PublicAuthenticationStore {
    login: ProtonLoginCallback;
}
