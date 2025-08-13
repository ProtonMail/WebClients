import { type PrivateKeyReference } from '@proton/crypto';
import type { Api, DecryptedKey } from '@proton/shared/lib/interfaces';
import { generateMnemonicPayload, generateMnemonicWithSalt } from '@proton/shared/lib/mnemonic';

import type { DeferredMnemonicData } from './types';
import { generateRecoveryKitBlob } from './useRecoveryKitDownload';

/**
 * Generates the recovery phrase and prepares a payload to be used for the backend
 * Will return undefined if the user has no keys
 */
const generateRecoveryPhrasePayload = async ({
    api,
    username,
    getUserKeys,
}: {
    api: Api;
    username: string;
    getUserKeys: () => Promise<DecryptedKey<PrivateKeyReference>[]>;
}) => {
    const userKeys = await getUserKeys();

    // if (!user.Keys.length) {
    //     // TODO: [CP-10304] observe occurrences of this case
    //     return;
    // }

    const { randomBytes, salt, recoveryPhrase } = await generateMnemonicWithSalt();

    const payload = await generateMnemonicPayload({ randomBytes, salt, userKeys, api, username });

    return {
        recoveryPhrase,
        payload,
    };
};

/**
 * Generates the recovery phrase and pdf blob.
 * Defer's sending the payload to the BE so that generation can be done optimistically.
 * Use sendMnemonicPayloadToBackend to complete the recovery phrase setup
 */
const generateDeferredMnemonicData = async ({
    api,
    emailAddress,
    username,
    getUserKeys,
}: {
    api: Api;
    emailAddress: string;
    username: string;
    getUserKeys: () => Promise<DecryptedKey<PrivateKeyReference>[]>;
}): Promise<DeferredMnemonicData | undefined> => {
    const generatedRecoveryPhrasePayload = await generateRecoveryPhrasePayload({ username, getUserKeys, api });

    if (!generatedRecoveryPhrasePayload) {
        return;
    }

    const { recoveryPhrase, payload } = generatedRecoveryPhrasePayload;

    const recoveryKitBlob = await generateRecoveryKitBlob({
        recoveryPhrase,
        emailAddress,
    });

    return {
        recoveryPhrase,
        recoveryKitBlob,
        payload,
    };
};

export default generateDeferredMnemonicData;
