import { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';

import { AuthSession } from '../login/interface';

export type OnLoginCallbackArguments = AuthSession;
export type ProtonLoginCallback = (data: OnLoginCallbackArguments) => void;
export type OnLoginCallback = (data: OnLoginCallbackArguments) => Promise<void>;

export interface PrivateAuthenticationStore extends AuthenticationStore {
    UID: string;
    localID?: number;
    logout: (options?: {
        /**
         * A soft logout does not remove the session from the server.
         * It only removes local session information.
         */
        type?: 'soft';
        clearDeviceRecoveryData?: boolean;
    }) => void;
    onLogout: (cb: () => Promise<void>) => () => void;
}

export interface PublicAuthenticationStore {
    login: ProtonLoginCallback;
}
