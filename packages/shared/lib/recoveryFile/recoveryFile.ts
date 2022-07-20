import getRandomValues from '@proton/get-random-values';
import { PublicKeyReference, CryptoProxy, PrivateKeyReference, VERIFICATION_STATUS } from '@proton/crypto';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { concatArrays } from '@proton/crypto/lib/utils';
import isTruthy from '@proton/utils/isTruthy';
import { DecryptedKey, KeyWithRecoverySecret } from '../interfaces';
import downloadFile from '../helpers/downloadFile';
import { KEY_FILE_EXTENSION } from '../constants';
import { ArmoredKeyWithInfo } from '../keys';

const decryptRecoveryFile = (recoverySecrets: KeyWithRecoverySecret[]) => async (file: string) => {
    try {
        return await Promise.any(
            recoverySecrets.map(async ({ RecoverySecret }) => {
                const { data } = await CryptoProxy.decryptMessage({
                    armoredMessage: file,
                    passwords: RecoverySecret,
                    format: 'binary',
                });

                return data;
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
    const decryptedArmoredKeys = (
        await Promise.all(
            decryptedFiles.map((concatenatedBinaryKeys) =>
                CryptoProxy.getArmoredKeys({ binaryKeys: concatenatedBinaryKeys })
            )
        )
    ).flat();

    return Promise.all(
        decryptedArmoredKeys.map(
            async (armoredKey): Promise<ArmoredKeyWithInfo> => ({
                ...(await CryptoProxy.getKeyInfo({ armoredKey })),
                armoredKey,
            })
        )
    );
};

export const generateRecoverySecret = async (privateKey: PrivateKeyReference) => {
    const length = 32;
    const randomValues = getRandomValues(new Uint8Array(length));
    const recoverySecret = uint8ArrayToBase64String(randomValues);

    const signature = await CryptoProxy.signMessage({
        textData: recoverySecret,
        stripTrailingSpaces: true,
        signingKeys: privateKey,
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
    const userKeysArray = await Promise.all(
        userKeys.map(({ privateKey }) =>
            CryptoProxy.exportPrivateKey({ privateKey: privateKey, passphrase: null, format: 'binary' })
        )
    );

    const { message } = await CryptoProxy.encryptMessage({
        binaryData: concatArrays(userKeysArray),
        passwords: [recoverySecret],
    });

    const blob = new Blob([message], { type: 'text/plain' });
    downloadFile(blob, `proton_recovery${KEY_FILE_EXTENSION}`);
};

export const validateRecoverySecret = async (recoverySecret: KeyWithRecoverySecret, publicKey: PublicKeyReference) => {
    const { RecoverySecret, RecoverySecretSignature } = recoverySecret;

    const { verified } = await CryptoProxy.verifyMessage({
        textData: RecoverySecret,
        stripTrailingSpaces: true,
        verificationKeys: publicKey,
        armoredSignature: RecoverySecretSignature,
    });

    return verified === VERIFICATION_STATUS.SIGNED_AND_VALID;
};
