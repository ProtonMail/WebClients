import { type SetMnemonicPhrasePayload, reactivateMnemonicPhrase } from '@proton/shared/lib/api/settingsMnemonic';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import type { Api } from '@proton/shared/lib/interfaces';

const sendRecoveryPhrasePayload = async ({
    api,
    payload,
}: {
    api: Api;
    payload: SetMnemonicPhrasePayload;
}): Promise<void> => {
    return api({ ...reactivateMnemonicPhrase(payload), ignoreHandler: [HTTP_ERROR_CODES.UNLOCK] });
};

export default sendRecoveryPhrasePayload;
