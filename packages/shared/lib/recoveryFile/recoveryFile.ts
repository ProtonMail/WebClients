import type { PrivateKeyReference, PublicKeyReference } from '@proton/crypto';
import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { isSelf } from '@proton/shared/lib/user/helpers';
import isTruthy from '@proton/utils/isTruthy';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

import type { APP_NAMES } from '../constants';
import { RECOVERY_FILE_FILE_NAME } from '../constants';
import downloadFile from '../helpers/downloadFile';
import type { Address, DecryptedKey, Key, KeyWithRecoverySecret, User } from '../interfaces';
import type { ArmoredKeyWithInfo } from '../keys';
import { getHasMigratedAddressKeys, getPrimaryKey } from '../keys';

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
    const randomValues = crypto.getRandomValues(new Uint8Array(length));
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

export const generateRecoveryFileMessage = async ({
    recoverySecret,
    privateKeys,
}: {
    recoverySecret: string;
    privateKeys: PrivateKeyReference[];
}) => {
    const userKeysArray = await Promise.all(
        privateKeys.map((privateKey) =>
            CryptoProxy.exportPrivateKey({ privateKey: privateKey, passphrase: null, format: 'binary' })
        )
    );

    const { message } = await CryptoProxy.encryptMessage({
        binaryData: mergeUint8Arrays(userKeysArray),
        passwords: [recoverySecret],
    });

    return message;
};

export const exportRecoveryFile = async ({
    recoverySecret,
    userKeys,
}: {
    recoverySecret: string;
    userKeys: DecryptedKey[];
}) => {
    const message = await generateRecoveryFileMessage({
        recoverySecret,
        privateKeys: userKeys.map(({ privateKey }) => privateKey),
    });
    const blob = new Blob([message], { type: 'text/plain' });
    downloadFile(blob, RECOVERY_FILE_FILE_NAME);
};

export const validateRecoverySecret = async (recoverySecret: KeyWithRecoverySecret, publicKey: PublicKeyReference) => {
    const { RecoverySecret, RecoverySecretSignature } = recoverySecret;

    const { verificationStatus } = await CryptoProxy.verifyMessage({
        textData: RecoverySecret,
        stripTrailingSpaces: true,
        verificationKeys: publicKey,
        armoredSignature: RecoverySecretSignature,
    });

    return verificationStatus === VERIFICATION_STATUS.SIGNED_AND_VALID;
};

export const getKeyWithRecoverySecret = (key: Key | undefined) => {
    if (!key?.RecoverySecret || !key?.RecoverySecretSignature) {
        return;
    }
    return key as KeyWithRecoverySecret;
};

export const getRecoverySecrets = (Keys: Key[] = []): KeyWithRecoverySecret[] => {
    return Keys.map(getKeyWithRecoverySecret).filter(isTruthy);
};

export const getPrimaryRecoverySecret = (Keys: Key[] = []): KeyWithRecoverySecret | undefined => {
    return getKeyWithRecoverySecret(Keys?.[0]);
};

export const getHasOutdatedRecoveryFile = (keys: Key[] = []) => {
    const primaryRecoverySecret = getPrimaryRecoverySecret(keys);
    const recoverySecrets = getRecoverySecrets(keys);

    return recoverySecrets?.length > 0 && !primaryRecoverySecret;
};

export const getIsRecoveryFileAvailable = ({
    user,
    addresses,
    userKeys,
}: {
    user: User;
    addresses: Address[];
    userKeys: DecryptedKey[];
    appName: APP_NAMES;
}) => {
    const hasMigratedKeys = getHasMigratedAddressKeys(addresses);
    const primaryKey = getPrimaryKey(userKeys);

    const isPrivateUser = Boolean(user.Private);

    return !!primaryKey?.privateKey && hasMigratedKeys && isPrivateUser && isSelf(user);
};
