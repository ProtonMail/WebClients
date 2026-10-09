/**
 * The credentials machine's actors, built from the app's services; `useSignInMachine` provides them. Every request
 * waits for the page's preparation first.
 */
import { fromPromise } from 'xstate';

import type { ChallengeResult } from '@proton/challenge/interface';
import { auth, getInfo } from '@proton/shared/lib/api/auth';
import type {
    AuthResponse,
    AuthVersion,
    ClaimedAddressID,
    InfoResponse,
    SSOInfoResponse,
} from '@proton/shared/lib/authentication/interface';
import { handleExternalSSOLogin } from '@proton/shared/lib/authentication/ssoExternalLogin';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';

import type { ClaimedAddressRecovery } from '../../../auth/claimedAddress';
import { AuthType } from '../../../auth/interface';
import { ClaimedAddressNoMatchError, loginWithClaimedAddress, loginWithPassword } from '../../../auth/passwordLogin';
import type { SignInActorServices } from '../../../state-machine/signInActors';
import { rethrowCredentialsError } from './credentialsErrors';

/** What the username step (auto) and the SSO form submit: the server decides how the account signs in. */
export interface UsernameFormValues {
    username: string;
    persistent: boolean;
}

/** What the password forms submit. */
export interface CredentialsFormValues extends UsernameFormValues {
    password: string;
    /** Anti-abuse challenge result, sent with the password authentication; the form collects it on submit. */
    payload: ChallengeResult;
}

/** A successful first authentication (password or SSO), before second factors and key unlock. */
export interface PrimaryAuthResult {
    authType: AuthType;
    authResponse: AuthResponse;
    authVersion: AuthVersion;
    /** What the user typed, also when it reached the account a claimed address belonged to. */
    username: string;
    password: string;
    persistent: boolean;
    /** Set when the account was reached through the claimed-address recovery flow. */
    claimedAddress?: ClaimedAddressRecovery;
}

export interface SSOProviderResult {
    uid: string | undefined;
    token: string;
}

/** How the account signs in, from the username alone: with its SSO provider, or with a password. */
export type AccountType = { type: 'sso'; ssoInfo: SSOInfoResponse } | { type: 'srp' };

/** The token the identity provider handed over, from its window (with the session `uid`) or its redirect. */
export interface SSOTokenInput {
    uid: string | undefined;
    token: string | undefined;
    username: string;
    persistent: boolean;
}

/** Proving ownership of a claimed address: the password of the account it belonged to, for its candidate IDs. */
export interface ClaimedAddressAuthInput {
    claimedAddresses: ClaimedAddressID[];
    /** The address the user typed, which the candidates were returned for. */
    email: string;
    password: string;
    payload: ChallengeResult;
    persistent: boolean;
}

export const createCredentialsActors = (services: SignInActorServices) => {
    const { api } = services;
    /** Before the first request of an attempt: wait for the page's preparation, then prepare the attempt. */
    const beforeRequest = async () => {
        await services.preparePage();
        await services.prepareAttempt();
    };
    return {
        startAuthSession: fromPromise<void>(() => services.startAuthSession()),
        fetchAccountType: fromPromise<AccountType, { username: string }>(async ({ input }) => {
            await beforeRequest();
            const info = await api<SSOInfoResponse | InfoResponse>(
                getInfo({ username: input.username, intent: 'Auto' })
            ).catch(rethrowCredentialsError);
            if ('SSOChallengeToken' in info) {
                return { type: 'sso', ssoInfo: info };
            }
            if ('Modulus' in info) {
                return { type: 'srp' };
            }
            throw new Error('Invalid response from server');
        }),
        fetchSSOInfo: fromPromise<SSOInfoResponse, { username: string }>(async ({ input }) => {
            await beforeRequest();
            return api<SSOInfoResponse>(getInfo({ username: input.username, intent: 'SSO' })).catch(
                rethrowCredentialsError
            );
        }),
        /**
         * A password the address's account rejects may still be the one of an account the address belonged to before an
         * organization claimed it: then it signs in to that account instead, to recover it.
         */
        authenticateWithPassword: fromPromise<PrimaryAuthResult, CredentialsFormValues>(async ({ input, signal }) => {
            await beforeRequest();
            const { result, authVersion, claimedAddressID } = await loginWithPassword({ ...input, api, signal }).catch(
                rethrowCredentialsError
            );
            return {
                authType: AuthType.Srp,
                authResponse: result,
                authVersion,
                username: input.username,
                password: input.password,
                persistent: input.persistent,
                claimedAddress: claimedAddressID ? { id: claimedAddressID } : undefined,
            };
        }),
        /**
         * Stopping the actor (cancel, back, unmount) aborts the provider window. It opens with the SSO info's challenge
         * token; checked here, so a missing one fails the step like a request instead of opening the window empty.
         */
        authorizeWithSSOProvider: fromPromise<SSOProviderResult, { token: string | undefined }>(
            async ({ input, signal }) => {
                if (!input.token) {
                    throw new Error('Missing SSO challenge token');
                }
                return handleExternalSSOLogin({ token: input.token, signal });
            }
        ),
        authenticateWithSSOToken: fromPromise<PrimaryAuthResult, SSOTokenInput>(
            async ({ input: { uid, token, username, persistent } }) => {
                if (!token) {
                    throw new Error('Missing SSO token');
                }
                await services.preparePage();
                const config = auth({ SSOResponseToken: token }, persistent);
                const authResponse = await api<AuthResponse>(uid ? withUIDHeaders(uid, config) : config);
                return {
                    authType: AuthType.ExternalSSO,
                    authVersion: 4,
                    authResponse,
                    username,
                    password: '',
                    persistent,
                };
            }
        ),
        /**
         * Proves ownership of a claimed address, from the claimed choice, with the password of its old account. A
         * password that matches none of its candidates fails with the last wrong-password response; stopping the actor
         * stops trying them.
         */
        authenticateWithClaimedAddress: fromPromise<PrimaryAuthResult, ClaimedAddressAuthInput>(
            async ({ input, signal }) => {
                await beforeRequest();
                const { id, result, authVersion } = await loginWithClaimedAddress({
                    email: input.email,
                    claimedAddressIDs: input.claimedAddresses,
                    password: input.password,
                    payload: input.payload,
                    persistent: input.persistent,
                    api,
                    signal,
                }).catch((error: unknown) =>
                    // The last wrong password, shown inline; or why none of them could be tried
                    rethrowCredentialsError(error instanceof ClaimedAddressNoMatchError ? error.cause : error)
                );
                return {
                    authType: AuthType.Srp,
                    authResponse: result,
                    authVersion,
                    username: input.email,
                    password: input.password,
                    persistent: input.persistent,
                    claimedAddress: { id },
                };
            }
        ),
    };
};

export type CredentialsActors = ReturnType<typeof createCredentialsActors>;
