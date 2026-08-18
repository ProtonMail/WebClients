import { CryptoProxy } from '@protontech/crypto';
import { computeKeyPassword } from '@protontech/crypto/srp';
import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getMnemonicAuthInfo, reauthMnemonic } from '@proton/shared/lib/api/auth';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { MnemonicKeyResponse } from '@proton/shared/lib/api/settingsMnemonic';
import { getMnemonicUserKeys } from '@proton/shared/lib/api/settingsMnemonic';
import type { InfoResponse } from '@proton/shared/lib/authentication/interface';
import { mnemonicToBase64RandomBytes } from '@proton/shared/lib/mnemonic';
import { srpAuth } from '@proton/shared/lib/srp';

import { type UserState, userThunk } from '../user';

const validateMnemonic = async (randomBytes: string, { PrivateKey, Salt }: MnemonicKeyResponse) => {
    try {
        const hashedPassphrase = await computeKeyPassword(randomBytes, Salt);
        const key = await CryptoProxy.importPrivateKey({
            armoredKey: PrivateKey,
            passphrase: hashedPassphrase,
        });
        // We only need to confirm decryption succeeded; free the key handle in the crypto worker.
        await CryptoProxy.clearKey({ key });
        return true;
    } catch {
        return false;
    }
};

/**
 * Validates a recovery phrase (mnemonic) without importing the derived keys into the store.
 */
export const validateMnemonicThunk = ({
    mnemonic,
}: {
    mnemonic: string;
}): ThunkAction<Promise<boolean>, unknown, ProtonThunkArguments, UnknownAction> => {
    return async (_dispatch, _getState, extra) => {
        const api = getSilentApi(extra.api);

        const { MnemonicUserKeys } = await api<{ MnemonicUserKeys: MnemonicKeyResponse[] }>(getMnemonicUserKeys());
        const randomBytes = await mnemonicToBase64RandomBytes(mnemonic);

        // The API returns outdated recovery phrases in order to allow the user to recover data.
        // In this functionality we only validate against the most recent set recovery phrase.
        const latestMnemonic = MnemonicUserKeys[0];
        return validateMnemonic(randomBytes, latestMnemonic);
    };
};

/**
 * Re-authenticates the current user with a recovery phrase (mnemonic) via SRP.
 */
export const reauthMnemonicThunk = ({
    mnemonic,
}: {
    mnemonic: string;
}): ThunkAction<Promise<void>, UserState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _getState, extra) => {
        const api = getSilentApi(extra.api);
        const user = await dispatch(userThunk());

        const persistent = extra.authentication.getPersistent();
        const username = user.Email || user.Name;
        const randomBytes = await mnemonicToBase64RandomBytes(mnemonic);
        const info = await api<InfoResponse>(getMnemonicAuthInfo(username));
        await srpAuth({
            info,
            api,
            config: reauthMnemonic({
                Username: username,
                PersistentCookies: persistent,
            }),
            credentials: {
                username: username,
                password: randomBytes,
            },
        });
    };
};
