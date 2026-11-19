import { createPreAuthKTVerifier } from '@proton/key-transparency/shared/createPreAuthKTVerifier';
import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { auth, getInfo } from '@proton/shared/lib/api/auth';
import { getAuthAPI } from '@proton/shared/lib/api/helpers/customConfig';
import { updatePassword } from '@proton/shared/lib/api/settings';
import { getUser, unlockPasswordChanges } from '@proton/shared/lib/api/user';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import type { AuthResponse } from '@proton/shared/lib/authentication/interface';
import { persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { ResumedSessionResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { KeyTransparencyActivation } from '@proton/shared/lib/interfaces/KeyTransparency';
import type { User } from '@proton/shared/lib/interfaces/User';
import { handleSetupKeys } from '@proton/shared/lib/keys/setupKeys';
import { srpAuth, srpVerify } from '@proton/shared/lib/srp';

export interface ActivationParams {
    reservedEmail: string;
    activationCode: string;
}

/** Base32 alphabet (0-9, A-Z excluding I, L, O, U) to avoid confusing characters */
const BASE32_CHARS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Generates 16 base32 characters, hyphenated every 4 and uppercase.
 * Example: "9K7Q-P6HD-X28R-G5YV"
 */
export const generateReadableActivationCode = (): string => {
    const randomValues = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(randomValues)
        .map((n, i) => (i > 0 && i % 4 === 0 ? '-' : '') + BASE32_CHARS[n % BASE32_CHARS.length])
        .join('');
};

export interface AuthenticateDonationUserParams {
    username: string;
    domain: string;
    password: string;
    api: Api;
    persistent?: boolean;
    silenceAuthErrors?: boolean;
}

export interface AuthenticateDonationUserResult {
    UID: string;
    AccessToken: string;
    LocalID: number;
}

/**
 * Authenticates the reserved account and returns credentials for making authenticated API calls.
 * No session cookies are set, so the browser session is unchanged.
 */
export const authenticateDonationUser = async ({
    username,
    domain,
    password,
    api,
    persistent = false,
    silenceAuthErrors = false,
}: AuthenticateDonationUserParams): Promise<AuthenticateDonationUserResult> => {
    const userEmail = `${username}@${domain}`;

    const authResult = await srpAuth({
        api,
        credentials: { username: userEmail, password },
        config: { ...auth({ Username: userEmail }, persistent), silence: silenceAuthErrors },
    }).then((response): Promise<AuthResponse> => response.json());

    return authResult;
};

/**
 * Decodes the base64 hash fragment from the activation URL in the reservation voucher.
 *
 * The hash contains a base64-encoded string of the form:
 *   reservedEmail=<encodeURIComponent(email)>&activationCode=<encodeURIComponent(code)>
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
