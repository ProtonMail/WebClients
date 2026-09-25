import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { AuthResponse, AuthVersion } from '@proton/shared/lib/authentication/interface';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type {
    Address,
    Api,
    KeyMigrationKTVerifier,
    KeySalt,
    KeyTransparencyActivation,
    PreAuthKTVerifier,
    User,
} from '@proton/shared/lib/interfaces';

import type { AuthType } from '../auth/interface';
import type { LoginFlowContext } from '../auth/loginFlowContext';

/**
 * What the sign-in machine knows about the attempt after the first authentication.
 * It is replaced, never mutated: actors return a new one and the machine assigns it.
 */
export interface SignInAuthState {
    credentials: {
        authType: AuthType;
        authVersion: AuthVersion;
        authResponse: AuthResponse;
        username: string;
        persistent: boolean;
        /** Needed until the keys are unlocked or set up; it goes when the account flow ends. */
        loginPassword: string;
    };
    account: {
        user?: User;
        salts?: KeySalt[];
        addresses?: Address[];
    };
    /**
     * Key transparency for this attempt. The verifiers collect checks during key setup and commit them when
     * the session is created, so they are created once per attempt and carried as an opaque handle.
     */
    keyTransparency: {
        activation: KeyTransparencyActivation;
        preAuthKTVerifier: PreAuthKTVerifier;
        keyMigrationKTVerifier: KeyMigrationKTVerifier;
    };
}

/** App-level dependencies the auth helpers need; they come from React, never from machine context. */
export interface SignInServices {
    api: Api;
    appName: APP_NAMES;
    productParam: ProductParam;
}

/** The inputs every auth step takes besides account data; built per call from the auth state and services. */
export const toLoginFlowContext = (auth: SignInAuthState, services: SignInServices): LoginFlowContext => ({
    api: services.api,
    appName: services.appName,
    productParam: services.productParam,
    username: auth.credentials.username,
    persistent: auth.credentials.persistent,
    authResponse: auth.credentials.authResponse,
    authVersion: auth.credentials.authVersion,
    ktActivation: auth.keyTransparency.activation,
    preAuthKTVerifier: auth.keyTransparency.preAuthKTVerifier,
    keyMigrationKTVerifier: auth.keyTransparency.keyMigrationKTVerifier,
});
