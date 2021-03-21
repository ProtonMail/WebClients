import { AuthenticationStore } from 'proton-shared/lib/authentication/createAuthenticationStore';
import { AuthSession } from '../login/interface';

export type OnLoginCallbackArguments = AuthSession;
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
