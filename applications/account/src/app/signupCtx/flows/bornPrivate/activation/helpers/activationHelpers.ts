import { createPreAuthKTVerifier } from '@proton/key-transparency/shared';
import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { getInfo } from '@proton/shared/lib/api/auth';
import { getAuthAPI } from '@proton/shared/lib/api/helpers/customConfig';
import { updatePassword } from '@proton/shared/lib/api/settings';
import { getUser, unlockPasswordChanges } from '@proton/shared/lib/api/user';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { ResumedSessionResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { Api, KeyTransparencyActivation, User } from '@proton/shared/lib/interfaces';
import { handleSetupKeys } from '@proton/shared/lib/keys';
import { srpAuth, srpVerify } from '@proton/shared/lib/srp';

import { authenticateDonationUser } from '../../emailReservation/helpers/emailReservationRequests';

export interface ActivationParams {
    reservedEmail: string;
    activationCode: string;
}

/**
 * Decodes the base64 hash fragment from the activation URL.
 * Reverses the encoding performed by `getActivationUrl()` in emailReservationHelpers.
 *
 * The hash contains a base64-encoded string of the form:
 *   username=<encodeURIComponent(email)>&activationCode=<encodeURIComponent(code)>
 */
export const decodeActivationParams = (hash: string): ActivationParams | null => {
    try {
        const base64String = hash.startsWith('#') ? hash.slice(1) : hash;
        if (!base64String) {
            return null;
        }

        const bytes = Uint8Array.fromBase64(base64String);
        const decoded = new TextDecoder().decode(bytes);
        const params = new URLSearchParams(decoded);

        const reservedEmail = params.get('reservedEmail');
        const activationCode = params.get('activationCode');

        if (!reservedEmail || !activationCode) {
            return null;
        }

        return { reservedEmail, activationCode };
    } catch {
        return null;
    }
};

export const getInitialUsernameFromParams = (params: ActivationParams | null): string => {
    if (!params) {
        return '';
    }
    const parts = params.reservedEmail.split('@');
    return parts[0];
};

export const getInitialDomainFromParams = (domains: string[], params: ActivationParams | null): string => {
    if (!params) {
        return domains.at(0) ?? '';
    }
    const parts = params.reservedEmail.split('@');
    const domainPart = parts.at(1);
    if (domainPart && domains.includes(domainPart)) {
        return domainPart;
    }
    return domains.at(0) ?? '';
};

export interface ActivateReservedAccountParams {
    username: string;
    domain: string;
    /** Current password (activation code) - used to log in and obtain password scope */
    activationCode: string;
    newPassword: string;
    api: Api;
    keyTransparencyActivation: KeyTransparencyActivation;
}

/**
 * Activates a reserved born-private account by:
 * 1. Authenticating with the activation code
 * 2. Unlocking the password scope and updating the login password to the new password
 * 3. Setting up address keys with the new password
 * 4. Persisting the session so the user is fully logged in
 *
 * Returns a ResumedSessionResult that can be passed directly to the onLogin callback.
 */
export const activateReservedAccount = async ({
    username,
    domain,
    activationCode,
    newPassword,
    api,
    keyTransparencyActivation,
}: ActivateReservedAccountParams): Promise<ResumedSessionResult> => {
    const authResult = await authenticateDonationUser({
        username,
        domain,
        password: activationCode,
        api,
        persistent: true,
        silenceAuthErrors: true,
    });

    const authApi: Api = getAuthAPI(authResult.UID, authResult.AccessToken, api);

    const info = await authApi(getInfo({ reauthScope: 'password' }));
    await srpAuth({
        api: authApi,
        credentials: { password: activationCode },
        config: unlockPasswordChanges(),
        info,
    });

    await srpVerify({
        api: authApi,
        credentials: { password: newPassword },
        config: updatePassword({ PersistPasswordScope: false }),
    });

    const addresses = await getAllAddresses(authApi);
    const { preAuthKTVerify, preAuthKTCommit } = createPreAuthKTVerifier(keyTransparencyActivation);

    let keyPassword = '';
    if (addresses.length) {
        keyPassword = await handleSetupKeys({
            api: authApi,
            addresses,
            password: newPassword,
            preAuthKTVerify,
            product: APPS.PROTONMAIL,
        });
    }

    const user = await authApi<{ User: User }>(getUser()).then(({ User }) => User);
    await preAuthKTCommit(user.ID, authApi);

    const session = await persistSession({
        api: authApi,
        User: user,
        UID: authResult.UID,
        LocalID: authResult.LocalID,
        keyPassword,
        clearKeyPassword: newPassword,
        persistent: true,
        trusted: false,
        source: SessionSource.Proton,
    });

    return session;
};
