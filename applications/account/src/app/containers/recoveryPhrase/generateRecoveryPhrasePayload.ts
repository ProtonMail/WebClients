import type { Api, User } from '@proton/shared/lib/interfaces';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys';
import { generateMnemonicPayload, generateMnemonicWithSalt } from '@proton/shared/lib/mnemonic';

/**
 * Generates the recovery phrase and prepares a payload to be used for the backend
 * Will return undefined if the user has no keys
 */
const generateRecoveryPhrasePayload = async ({
    user,
    keyPassword,
    api,
}: {
    api: Api;
    user: User;
    keyPassword: string;
}) => {
    if (!user.Keys.length) {
        // TODO: [CP-10304] observe occurences of this case
        return;
    }

    const { randomBytes, salt, recoveryPhrase } = await generateMnemonicWithSalt();

    const userKeys = await getDecryptedUserKeysHelper(user, keyPassword);
    const payload = await generateMnemonicPayload({ randomBytes, salt, userKeys, api, username: user.Name });

    return {
        recoveryPhrase,
        payload,
    };
};

export default generateRecoveryPhrasePayload;
