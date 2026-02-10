import { c } from 'ttag';

import { CryptoProxy, type PrivateKeyReference, type PublicKeyReference, VERIFICATION_STATUS } from '@proton/crypto';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';
import type { User } from '@proton/shared/lib/interfaces/User';
import isTruthy from '@proton/utils/isTruthy';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

const DELEGATED_ACCESS_SIGNATURE_CONTEXT = {
    KEY_TOKEN_SIGNATURE_CONTEXT: 'account.key-token.delegated',
};

export const generateDelegatedAccessToken = () => {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    return randomBytes.toHex();
};

export const getEncryptedDelegatedAccessToken = async ({
    token,
    signingKeys,
    encryptionKeys,
}: {
    token: string;
    signingKeys: PrivateKeyReference[];
    encryptionKeys: PublicKeyReference[];
}) => {
    const { message } = await CryptoProxy.encryptMessage({
        textData: token,
        encryptionKeys,
        signingKeys,
        signatureContext: { value: DELEGATED_ACCESS_SIGNATURE_CONTEXT.KEY_TOKEN_SIGNATURE_CONTEXT, critical: true },
    });
    return message;
};

export const getDecryptedDelegatedAccessToken = async ({
    armoredMessage,
    verificationKeys,
    decryptionKeys,
}: {
    armoredMessage: string;
    verificationKeys: PublicKeyReference[] | null;
    decryptionKeys: PrivateKeyReference[];
}) => {
    const { data: decryptedToken, verificationStatus } = await CryptoProxy.decryptMessage({
        armoredMessage,
        decryptionKeys,
        // No verification keys in case the Signed Key List doesn't exist, ignore verification in that case
        ...(verificationKeys
            ? {
                  verificationKeys,
                  signatureContext: {
                      value: DELEGATED_ACCESS_SIGNATURE_CONTEXT.KEY_TOKEN_SIGNATURE_CONTEXT,
                      required: true,
                  },
              }
            : {}),
    });

    if (verificationKeys !== null && verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error(c('Error').t`Signature verification failed`);
        error.name = 'SignatureError';
        throw error;
    }

    return decryptedToken;
};

export const getReEncryptedRecoveryToken = async ({
    armoredMessage,
    decryptionKeys,
    encryptionKeys,
}: {
    armoredMessage: string;
    decryptionKeys: PrivateKeyReference[];
    encryptionKeys: PublicKeyReference[];
}) => {
    const { data, signatures } = await CryptoProxy.decryptMessage({ armoredMessage, decryptionKeys });
    const { message } = await CryptoProxy.encryptMessage({
        textData: data,
        binarySignature: mergeUint8Arrays(signatures),
        encryptionKeys,
    });
    return message;
};

export const recoverKeys = async ({
    UserKeys,
    recoveryToken,
    user,
    userKeys,
}: {
    recoveryToken: string;
    UserKeys: { UserKeyID: string; PrivateKey: string }[];
    user: User;
    userKeys: DecryptedKey[];
}) => {
    const keys = await Promise.all(
        UserKeys.map(async ({ UserKeyID, PrivateKey }) => {
            try {
                const Key = user.Keys.find(({ ID }) => ID === UserKeyID);
                // Key object not found among user's keys, ignore it.
                if (!Key) {
                    return;
                }
                // Key is already decrypted, no need to recover it.
                const decryptedKey = userKeys.find(({ ID }) => ID === UserKeyID);
                if (decryptedKey) {
                    return;
                }
                const privateKey = await CryptoProxy.importPrivateKey({
                    armoredKey: PrivateKey,
                    passphrase: recoveryToken,
                });
                return {
                    id: UserKeyID,
                    privateKey,
                    Key,
                };
            } catch (error) {}
        })
    );
    return keys.filter(isTruthy);
};
