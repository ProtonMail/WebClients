import type { ChallengeResult } from '@proton/challenge/interface';
import { getInfo } from '@proton/shared/lib/api/auth';
import { getApiError, getIsConnectionIssue } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getApiWithAbort } from '@proton/shared/lib/api/helpers/customConfig';
import type { ClaimedAddressID, InfoResponse } from '@proton/shared/lib/authentication/interface';
import loginWithFallback from '@proton/shared/lib/authentication/loginWithFallback';
import { API_CUSTOM_ERROR_CODES, HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import type { Api } from '@proton/shared/lib/interfaces';

/**
 * Fails every candidate the same way, so trying the next one wouldn't help: the connection, the sign-in being
 * stopped, or a limit on requests (the auth requests skip the API's handling of 429, and a cancelled human
 * verification still fails).
 */
const isRequestError = (error: unknown) => {
    const { status, code } = getApiError(error);
    return (
        getIsConnectionIssue(error) ||
        (error instanceof Error && error.name === 'AbortError') ||
        status === HTTP_ERROR_CODES.TOO_MANY_REQUESTS ||
        code === API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED
    );
};

/**
 * The candidate signs in some other way than with a password: the sign-in would be sent to the SSO or SRP form for
 * the address the user typed, which isn't this account's, so the candidate is skipped instead.
 */
const isOtherAuthMethodError = (error: unknown) => {
    const { code } = getApiError(error);
    return code === API_CUSTOM_ERROR_CODES.AUTH_SWITCH_TO_SSO || code === API_CUSTOM_ERROR_CODES.AUTH_SWITCH_TO_SRP;
};

/**
 * No candidate accepted the password. `cause` is the last wrong-password response, or the first candidate's error when
 * none could even be tried, for a caller that has nothing better to show.
 */
export class ClaimedAddressNoMatchError extends Error {
    name = 'ClaimedAddressNoMatchError';

    constructor(cause: unknown) {
        super('No claimed address accepted the password', { cause });
    }
}

/**
 * Sign in to an account whose address was claimed, and so is disabled and no longer resolvable by email. Each
 * candidate ID from `ClaimedAddresses` is sent back with the email it was returned for, but nothing says up front which
 * one belongs to the password the user typed, and an SRP challenge is consumed by the attempt that uses it. So we
 * take them one at a time, and move on from a candidate that rejects the password or can't be signed in to with one:
 * its auth info fails, the SRP checks reject it before the password is sent, or it signs in with another method.
 * Anything else the sign-in itself fails with is the answer, as is a failure of the request that would fail the next
 * candidate too. (An account on a legacy auth version hashes its own username into the proof, so it reads as a wrong
 * password.)
 *
 * When none accepts the password it fails with a `ClaimedAddressNoMatchError`. Stopping the sign-in (`signal`) aborts
 * the request in flight, and with it the candidates left.
 */
export const loginWithClaimedAddress = async ({
    email,
    claimedAddressIDs,
    password,
    payload,
    persistent,
    api,
    signal,
}: {
    /** The address the candidates were returned for; the API only resolves them with it. */
    email: string;
    claimedAddressIDs: ClaimedAddressID[];
    password: string;
    payload: ChallengeResult;
    persistent: boolean;
    api: Api;
    signal?: AbortSignal;
}) => {
    let wrongPassword: unknown;
    let unusable: unknown;
    // Every request carries the signal, the candidate's sign-in included
    const abortableApi: Api = signal ? getApiWithAbort(api, signal) : api;

    for (const id of claimedAddressIDs) {
        if (signal?.aborted) {
            throw new DOMException('The sign-in was stopped', 'AbortError');
        }

        let infoResult: InfoResponse;
        try {
            infoResult = await abortableApi<InfoResponse>(getInfo({ username: email, claimedAddressID: id }));
        } catch (error) {
            if (isRequestError(error)) {
                throw error;
            }
            unusable ??= error;
            continue;
        }

        try {
            const { result, authVersion } = await loginWithFallback({
                api: abortableApi,
                credentials: { username: email, password },
                claimedAddressID: id,
                initialAuthInfo: infoResult,
                payload,
                persistent,
            });
            return { id, result, authVersion };
        } catch (error) {
            if (getApiError(error).code === API_CUSTOM_ERROR_CODES.INVALID_LOGIN) {
                wrongPassword = error;
                continue;
            }
            // Without a response, it failed before the password was sent: the SRP checks for this candidate
            const failedBeforePassword = getApiError(error).status === undefined && !isRequestError(error);
            if (failedBeforePassword || isOtherAuthMethodError(error)) {
                unusable ??= error;
                continue;
            }
            throw error;
        }
    }

    throw new ClaimedAddressNoMatchError(wrongPassword ?? unusable ?? new Error('Missing claimed address'));
};

/**
 * SRP sign-in with username and password; falls back to older auth versions when needed.
 *
 * A password the username's account rejects may still be the one of an account its address belonged to before an
 * organization claimed it, which the auth info lists as `ClaimedAddresses`: then it signs in to that one instead, to
 * recover it, and `claimedAddressID` says which. Matching none of them is the same wrong password.
 */
export const loginWithPassword = async ({
    username,
    password,
    payload,
    persistent,
    api,
    signal,
}: {
    username: string;
    password: string;
    payload: ChallengeResult;
    persistent: boolean;
    api: Api;
    /** Stops trying the claimed addresses' candidates, aborting the request in flight. */
    signal?: AbortSignal;
}) => {
    const infoResult = await api<InfoResponse>(getInfo({ username }));
    try {
        const { result, authVersion } = await loginWithFallback({
            api,
            credentials: { username, password },
            initialAuthInfo: infoResult,
            payload,
            persistent,
        });
        return { result, authVersion, claimedAddressID: undefined };
    } catch (error) {
        const claimedAddressIDs = infoResult.ClaimedAddresses ?? [];
        if (!claimedAddressIDs.length || getApiError(error).code !== API_CUSTOM_ERROR_CODES.INVALID_LOGIN) {
            throw error;
        }
        try {
            const { id, result, authVersion } = await loginWithClaimedAddress({
                email: username,
                claimedAddressIDs,
                password,
                payload,
                persistent,
                api,
                signal,
            });
            return { result, authVersion, claimedAddressID: id };
        } catch (claimedError) {
            throw claimedError instanceof ClaimedAddressNoMatchError ? error : claimedError;
        }
    }
};
