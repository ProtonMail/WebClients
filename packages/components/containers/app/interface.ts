import { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';

import { AuthSession } from '../login/interface';

export type OnLoginCallbackArguments = AuthSession;
export type ProtonLoginCallback = (data: OnLoginCallbackArguments) => void;
export type OnLoginCallbackResult = { state: 'complete' | 'input' };
export type OnLoginCallback = (data: OnLoginCallbackArguments) => Promise<OnLoginCallbackResult>;

export interface PrivateAuthenticationStore extends AuthenticationStore {
    UID: string;
}

export interface PublicAuthenticationStore {
    login: ProtonLoginCallback;
}
