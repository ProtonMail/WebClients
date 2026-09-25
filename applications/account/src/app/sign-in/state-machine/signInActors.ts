/**
 * The sign-in machine's actor: building the auth state after the first authentication. The steps have their own
 * (`credentialsActors`, `passwordAccountActors`, `ssoActors`), built from the same services.
 * `useSignInMachine` provides them; the machines only take their types, so tests provide fakes.
 */
import { fromPromise } from 'xstate';

import { createKeyMigrationKTVerifier, createPreAuthKTVerifier } from '@proton/key-transparency/shared';
import { type AuthTypes, getAuthTypes } from '@proton/shared/lib/authentication/twoFactor';
import type { KeyTransparencyActivation } from '@proton/shared/lib/interfaces';

import type { AuthSession } from '../../content/authSession';
import type { PrimaryAuthResult } from '../steps/credentials/state-machine/credentialsActors';
import type { SignInAuthState, SignInServices } from './signInAuthState';

/** What `createAuthState` builds: the auth state both account flows share, and the auth types only the password account flow uses. */
export interface CreatedAuth {
    auth: SignInAuthState;
    authTypes: AuthTypes;
}

export interface SignInActorServices extends SignInServices {
    getKtActivation: () => Promise<KeyTransparencyActivation>;
    /** Warms up the sign-in page, once per page; the requests wait for it. It never fails. */
    prepare: () => Promise<void>;
    /** Runs before the first request of an attempt: loads the crypto worker, then starts the auth session. */
    startAuth: () => Promise<void>;
    /** Starts the unauthenticated session. */
    onStartAuth: () => Promise<void>;
    onLogin: (session: AuthSession) => Promise<unknown>;
}

export const createSignInActors = (services: SignInActorServices) => {
    return {
        /** The domains request that prepares the sign-in; the requests wait for it (see `createCredentialsActors`). */
        prepareSignIn: fromPromise<void>(() => services.prepare()),
        createAuthState: fromPromise<CreatedAuth, PrimaryAuthResult>(async ({ input }) => {
            const activation = await services.getKtActivation();
            const auth: SignInAuthState = {
                credentials: {
                    authType: input.authType,
                    authVersion: input.authVersion,
                    authResponse: input.authResponse,
                    username: input.username,
                    persistent: input.persistent,
                    loginPassword: input.password,
                },
                account: {},
                keyTransparency: {
                    activation,
                    preAuthKTVerifier: createPreAuthKTVerifier(activation),
                    keyMigrationKTVerifier: createKeyMigrationKTVerifier(activation),
                },
            };
            return {
                auth,
                authTypes: getAuthTypes({ info: input.authResponse, app: services.appName, location: window.location }),
            };
        }),
    };
};

export type SignInActors = ReturnType<typeof createSignInActors>;
