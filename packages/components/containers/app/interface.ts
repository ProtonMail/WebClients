import type { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';
import type { ResumedSessionResult } from '@proton/shared/lib/authentication/persistedSessionHelper';

/** A signed-in session handed to the login callback; the account app extends it with how it got there. */
export interface AuthSession {
    loginPassword?: string;
    path?: string;
    data: ResumedSessionResult;
}

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
