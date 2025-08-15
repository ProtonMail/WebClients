import { type SetMnemonicPhrasePayload, reactivateMnemonicPhrase } from '@proton/shared/lib/api/settingsMnemonic';
import { queryUnlock } from '@proton/shared/lib/api/user';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import type { Api } from '@proton/shared/lib/interfaces';
import { srpAuth } from '@proton/shared/lib/srp';

const sendRecoveryPhrasePayload = async ({
    api,
    payload,
    password,
}: {
    api: Api;
    payload: SetMnemonicPhrasePayload;
    password: string | undefined;
}): Promise<void> => {
    if (password) {
        // In signup, mnemonic is setup with a user action and if users wait more than 10 minutes
        // they lose locked scope. This ensures that locked scope is added before continuing. Even if it's not needed.
        await srpAuth({ api, credentials: { password }, config: queryUnlock() });
    }
    return api({ ...reactivateMnemonicPhrase(payload), ignoreHandler: [HTTP_ERROR_CODES.UNLOCK] });
};

export default sendRecoveryPhrasePayload;
