import { User as tsUser } from 'proton-shared/lib/interfaces';
import { AuthenticationStore } from 'proton-shared/lib/authentication/createAuthenticationStore';

export type LoginFlows = 'welcome' | 'welcome-full' | 'signup' | undefined;

export interface OnLoginCallbackArguments {
    UID: string;
    User: tsUser;
    EventID?: string;
    keyPassword?: string;
    LocalID?: number;
    path?: string;
    flow?: LoginFlows;
}
export type ProtonLoginCallback = (data: OnLoginCallbackArguments) => void;
export type OnLoginCallback = (data: OnLoginCallbackArguments) => Promise<void>;

export interface PrivateAuthenticationStore extends AuthenticationStore {
    UID: string;
    localID?: number;
    logout: (type?: 'soft') => void;
}

export interface PublicAuthenticationStore {
    login: ProtonLoginCallback;
}
