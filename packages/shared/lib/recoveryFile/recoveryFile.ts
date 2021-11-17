import {
    concatArrays,
    createCleartextMessage,
    decryptMessage,
    encryptMessage,
    getKeys,
    getMessage,
    getSignature,
    OpenPGPKey,
    signMessage,
    verifyMessage,
} from 'pmcrypto';
import getRandomValues from '@proton/get-random-values';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { VERIFICATION_STATUS } from '@proton/srp/lib/constants';
import isTruthy from '../helpers/isTruthy';
import { DecryptedKey, KeyWithRecoverySecret } from '../interfaces';
import downloadFile from '../helpers/downloadFile';
import { KEY_FILE_EXTENSION } from '../constants';

const decryptRecoveryFile = (recoverySecrets: KeyWithRecoverySecret[]) => async (file: string) => {
    try {
        return await Promise.any(
            recoverySecrets.map(async ({ RecoverySecret }) => {
                const { data } = await decryptMessage({
                    message: await getMessage(file),
                    passwords: RecoverySecret,
                    format: 'binary',
                });

                return data as Uint8Array;
            })
        );
    } catch (error: any) {
        return undefined;
    }
};

export const parseRecoveryFiles = async (filesAsStrings: string[] = [], recoverySecrets: KeyWithRecoverySecret[]) => {
    const decryptedFiles = (await Promise.all(filesAsStrings.map(decryptRecoveryFile(recoverySecrets)))).filter(
        isTruthy
    );
    return (await Promise.all(decryptedFiles.map(getKeys))).flat();
};

export const generateRecoverySecret = async (privateKey: OpenPGPKey) => {
    const length = 32;
    const randomValues = getRandomValues(new Uint8Array(length));
    const recoverySecret = uint8ArrayToBase64String(randomValues);

    const { signature } = await signMessage({
        data: recoverySecret,
        privateKeys: privateKey,
        detached: true,
    });

    return {
        signature,
        recoverySecret,
    };
};

export const exportRecoveryFile = async ({
    recoverySecret,
    userKeys,
}: {
    recoverySecret: string;
    userKeys: DecryptedKey[];
}) => {
    const userKeysArray = userKeys.map(({ privateKey }) => privateKey.toPacketlist().write()); // to get uint8array version of the key)

    const { data } = await encryptMessage({
        data: concatArrays(userKeysArray),
        passwords: [recoverySecret],
    });

    const blob = new Blob([data], { type: 'text/plain' });
    downloadFile(blob, `proton_recovery${KEY_FILE_EXTENSION}`);
};

export const validateRecoverySecret = async (recoverySecret: KeyWithRecoverySecret, publicKey: OpenPGPKey) => {
    const { RecoverySecret, RecoverySecretSignature } = recoverySecret;

    const { verified } = await verifyMessage({
        message: await createCleartextMessage(RecoverySecret),
        publicKeys: publicKey,
        signature: await getSignature(RecoverySecretSignature),
    });

    return verified === VERIFICATION_STATUS.SIGNED_AND_VALID;
};
