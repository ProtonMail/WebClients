import type { PrivateKeyReference } from '@protontech/crypto';

import type { SetMnemonicPhrasePayload } from '@proton/shared/lib/api/settingsMnemonic';
import type { Api, DecryptedKey } from '@proton/shared/lib/interfaces';
import { generateMnemonicPayload, generateMnemonicWithSalt } from '@proton/shared/lib/mnemonic';

import { type RecoveryKitBlob, generateRecoveryKitBlob } from './generateRecoveryKitBlob';
import { type RecoveryKitSaveReturnValue, getRecoveryKitSaveData } from './getRecoveryKitSaveData';

/**
 * All the data required to display the recovery phrase, download the recovery kit, and ensure the BE is happy.
 */
export interface DeferredMnemonicData {
    /**
     * 12 word recovery phrase
     */
    recoveryPhrase: string;
    /**
     * Blob of the pdf that will be downloaded.
     * Will be null if an error occured while generating.
     */
    recoveryKitBlob: RecoveryKitBlob | null;
    /**
     * Payload to be sent to the BE.
     * Handled by the sendMnemonicPayloadToBackend function
     */
    payload: SetMnemonicPhrasePayload;
    /**
     * If the payload has already been sent to the API already.
     */
    hasSentPayload: boolean;
    /**
     * All data about saving the recovery kit.
     */
    save: RecoveryKitSaveReturnValue;
}

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

    if (!userKeys.length) {
        throw new Error('Unable to generate recovery phrase. No keys found.');
    }

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
export const generateDeferredMnemonicData = async ({
    api,
    emailAddress,
    username,
    getUserKeys,
    isShareFeatureEnabled,
}: {
    api: Api;
    emailAddress: string;
    username: string;
    getUserKeys: () => Promise<DecryptedKey<PrivateKeyReference>[]>;
    isShareFeatureEnabled: boolean;
}): Promise<DeferredMnemonicData> => {
    const generatedRecoveryPhrasePayload = await generateRecoveryPhrasePayload({ username, getUserKeys, api });

    const { recoveryPhrase, payload } = generatedRecoveryPhrasePayload;

    const recoveryKitBlob = await generateRecoveryKitBlob({
        recoveryPhrase,
        emailAddress,
    });

    return {
        recoveryPhrase,
        recoveryKitBlob,
        payload,
        hasSentPayload: false,
        save: getRecoveryKitSaveData({ recoveryPhrase, recoveryKitBlob, isShareFeatureEnabled }),
    };
};
