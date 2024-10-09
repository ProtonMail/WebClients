import { api } from '@proton/pass/lib/api/api';
import { type OfflineComponents, getOfflineKeyDerivation } from '@proton/pass/lib/cache/crypto';
import { decryptData, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassEncryptionTag } from '@proton/pass/types';
import { queryUnlock } from '@proton/shared/lib/api/user';
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import { srpAuth, srpGetVerify } from '@proton/shared/lib/srp';
import { getSrp } from '@proton/srp/lib';
import type { AuthInfo } from '@proton/srp/lib/interface';

import type { AuthStore } from './store';

export enum PasswordVerification {
    LOCAL,
    EXTRA_PASSWORD,
    SRP,
}

export type PasswordCredentials = { password: string };
export type PasswordConfirmDTO = PasswordCredentials & { mode?: PasswordVerification };
export type ExtraPasswordDTO = PasswordCredentials & { enabled: boolean };

export const getPasswordVerification = (authStore: AuthStore) => {
    const offlineConfig = authStore.getOfflineConfig();
    const offlineVerifier = authStore.getOfflineVerifier();
    const extraPassword = authStore.getExtraPassword();
    const localVerification = offlineConfig && offlineVerifier;

    if (localVerification) return PasswordVerification.LOCAL;
    if (extraPassword) return PasswordVerification.EXTRA_PASSWORD;
    return PasswordVerification.SRP;
};

export const registerExtraPassword = async (credentials: PasswordCredentials) => {
    const { Auth } = await srpGetVerify({ api, credentials });

    await api({
        url: 'pass/v1/user/srp',
        method: 'post',
        data: {
            SrpModulusID: Auth.ModulusID,
            SrpVerifier: Auth.Verifier,
            SrpSalt: Auth.Salt,
        },
    });
};

export const removeExtraPassword = async () => api({ url: 'pass/v1/user/srp', method: 'delete' });

/** Checks that the given password can be verified against the `offlineVerifier`.
 * If we can successfully decrypt the `offlineVerifier`, then password is correct */
export const verifyOfflinePassword = async (
    password: string,
    { offlineVerifier, offlineConfig: { salt, params } }: Omit<OfflineComponents, 'offlineKD'>
): Promise<boolean> => {
    const offlineKD = await getOfflineKeyDerivation(password, stringToUint8Array(salt), params);
    const offlineKey = await importSymmetricKey(offlineKD);
    await decryptData(offlineKey, stringToUint8Array(offlineVerifier), PassEncryptionTag.Offline);

    return true;
};

/** Verifies a proton user's encryption password via SRP */
export const verifyPassword = async (credentials: PasswordCredentials): Promise<boolean> => {
    await srpAuth({ api, credentials, config: { ...queryUnlock(), silence: true } });
    return true;
};

/** Verifies the pass specific extra-password via SRP */
export const verifyExtraPassword = async (credentials: PasswordCredentials): Promise<boolean> => {
    const info = (await api({ url: 'pass/v1/user/srp/info', method: 'get' })).SRPData!;

    const { Version, SrpSalt: Salt, Modulus, ServerEphemeral } = info;
    const authInfo: AuthInfo = { ServerEphemeral, Modulus, Version, Salt };

    const srp = await getSrp(authInfo, credentials, Version);

    await api({
        url: 'pass/v1/user/srp/auth',
        method: 'post',
        data: {
            ClientEphemeral: srp.clientEphemeral,
            ClientProof: srp.clientProof,
            SrpSessionID: info.SrpSessionID,
        },
    });

    return true;
};
