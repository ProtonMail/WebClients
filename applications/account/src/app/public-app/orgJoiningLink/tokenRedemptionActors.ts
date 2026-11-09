import type { PrivateKeyReference } from '@protontech/crypto';
import { computeKeyPassword } from '@protontech/crypto/srp';
import { fromPromise } from 'xstate';

import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { redeemToken, verifyCode } from '@proton/shared/lib/api/authLoginLink';
import { getAuthAPI } from '@proton/shared/lib/api/helpers/customConfig';
import { getKeySalts, updatePrivateKeyRoute } from '@proton/shared/lib/api/keys';
import { getPasswordPolicies } from '@proton/shared/lib/api/passwordPolicies';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { getUser } from '@proton/shared/lib/authentication/getUser';
import type { AuthResponse } from '@proton/shared/lib/authentication/interface';
import { persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { DecryptedAddressKey, DecryptedKey } from '@proton/shared/lib/interfaces/Key';
import type { KeySalt } from '@proton/shared/lib/interfaces/KeySalt';
import type { PasswordPolicies } from '@proton/shared/lib/interfaces/PasswordPolicy';
import type { User } from '@proton/shared/lib/interfaces/User';
import { getUpdateKeysPayload } from '@proton/shared/lib/keys/changePassword';
import { getDecryptedAddressKeysHelper } from '@proton/shared/lib/keys/getDecryptedAddressKeys';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys/getDecryptedUserKeys';
import { generateKeySaltAndPassphrase } from '@proton/shared/lib/keys/keys';
import { srpVerify } from '@proton/shared/lib/srp';
import type { UnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';

import type { AuthSession } from '../authSession';
import type { TokenRedemptionConfig } from './tokenRedemptionStateMachine';

/** The member's session and unlocked keys, read once the code is verified, to set the new password with. */
export interface TokenRedemptionSession {
    api: Api;
    authResponse: AuthResponse;
    addressesKeys: { address: Address; keys: DecryptedAddressKey<PrivateKeyReference>[] }[];
    user: User;
    userKeys: DecryptedKey<PrivateKeyReference>[];
}

export interface TokenRedemptionServices {
    unauthenticatedApi: UnauthenticatedApi;
    onPreSubmit: () => Promise<void>;
    onStartAuth: () => Promise<void>;
    login: (session: AuthSession) => Promise<unknown>;
}

export const createTokenRedemptionActors = ({
    unauthenticatedApi,
    onPreSubmit,
    onStartAuth,
    login,
}: TokenRedemptionServices) => ({
    /** Sends the code to the member's email. */
    redeemToken: fromPromise<void, { email: string; config: TokenRedemptionConfig | undefined }>(
        async ({ input: { email, config } }) => {
            if (!config) {
                throw new Error('Missing joining link');
            }
            await onPreSubmit();
            await onStartAuth();
            await unauthenticatedApi.apiCallback(redeemToken({ email, token: config.token }));
        }
    ),
    verifyCode: fromPromise<
        { session: TokenRedemptionSession; passwordPolicies: PasswordPolicies },
        { code: string; config: TokenRedemptionConfig | undefined }
    >(async ({ input: { code, config } }) => {
        if (!config) {
            throw new Error('Missing joining link');
        }
        const authResponse = await unauthenticatedApi.apiCallback<AuthResponse>(verifyCode({ code }));
        const api = getAuthAPI(authResponse.UID, authResponse.AccessToken, unauthenticatedApi.apiCallback);

        const [user, addresses, keySalts, passwordPolicies] = await Promise.all([
            getUser(api),
            getAllAddresses(api),
            api<{ KeySalts: KeySalt[] }>(getKeySalts()).then(({ KeySalts }) => KeySalts),
            getPasswordPolicies({ api }),
        ]);

        if (!keySalts.length) {
            throw new Error('Missing key salts');
        }

        const keyPassword = await computeKeyPassword(config.password, keySalts[0].KeySalt);
        const userKeys = await getDecryptedUserKeysHelper(user, keyPassword);
        const addressesKeys = await Promise.all(
            addresses.map(async (address) => ({
                address,
                keys: await getDecryptedAddressKeysHelper(address.Keys, user, userKeys, keyPassword),
            }))
        );

        return { session: { api, addressesKeys, authResponse, userKeys, user }, passwordPolicies };
    }),
    /** Sets the new password, re-encrypts the keys with it, saves the session and signs in with it. */
    changePassword: fromPromise<void, { session: TokenRedemptionSession | undefined; password: string }>(
        async ({ input: { session, password } }) => {
            if (!session) {
                throw new Error('Missing session');
            }
            const { api, user, addressesKeys, userKeys, authResponse } = session;

            const { passphrase: newKeyPassword, salt: newKeySalt } = await generateKeySaltAndPassphrase(password);

            const updateKeysPayload = await getUpdateKeysPayload({
                addressesKeys,
                userKeys,
                // Joining member do not have access to the org key
                organizationKey: undefined,
                keyPassword: newKeyPassword,
                keySalt: newKeySalt,
            });

            await srpVerify({
                api,
                credentials: { password },
                config: updatePrivateKeyRoute(updateKeysPayload),
            });

            const persistedSession = await persistSession({
                ...authResponse,
                clearKeyPassword: password,
                keyPassword: newKeyPassword,
                User: user,
                api,
                persistent: false,
                trusted: false,
                source: SessionSource.Proton,
            });

            await login({ data: persistedSession, loginPassword: password, flow: 'login' });
        }
    ),
});

export type TokenRedemptionActors = ReturnType<typeof createTokenRedemptionActors>;
