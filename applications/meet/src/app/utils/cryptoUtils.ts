import { c } from 'ttag';

import type { PrivateKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { decryptData, deriveKey, encryptData } from '@proton/crypto/lib/subtle/aesGcm';
import { stringToUtf8Array, utf8ArrayToString } from '@proton/crypto/lib/utils';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import type { Api } from '@proton/shared/lib/interfaces';
import { srpGetVerify } from '@proton/shared/lib/srp';
import { computeKeyPassword as computeBcryptHash, generateKeySalt as generateBcryptSalt } from '@proton/srp';
import getRandomString from '@proton/utils/getRandomString';

export const getCombinedPassword = (urlPassword: string, customPassword: string) => {
    if (!customPassword) {
        return urlPassword;
    }

    return `${urlPassword}_${customPassword}`;
};

export const deriveEncryptionKeyFromSessionKey = async (sessionKey: Uint8Array) => {
    const encryptionKey = await deriveKey(
        sessionKey,
        new Uint8Array(32),
        stringToUtf8Array('aeskey.link.meet.proton'),
        { keyUsage: ['decrypt', 'encrypt'] }
    );

    return encryptionKey;
};

export const encryptMetadataWithKey = async (key: CryptoKey, data: string) => {
    const encryptedData = await encryptData(key, stringToUtf8Array(data), stringToUtf8Array('metadata.meet.proton'));

    return uint8ArrayToBase64String(encryptedData);
};

export const decryptMetadataWithKey = async (key: CryptoKey, encryptedData: string) => {
    const encryptedDataUint8Array = base64StringToUint8Array(encryptedData);

    const decryptedData = await decryptData(key, encryptedDataUint8Array, stringToUtf8Array('metadata.meet.proton'));

    return utf8ArrayToString(decryptedData);
};

interface DecryptMeetingNameParams {
    urlPassword: string;
    customPassword: string;
    encryptedSessionKey: string;
    encryptedMeetingName: string;
    salt: string;
}

export const decryptMeetingName = async ({
    urlPassword,
    customPassword,
    encryptedSessionKey,
    encryptedMeetingName,
    salt,
}: DecryptMeetingNameParams) => {
    const sessionKeyPassphrase = await computeBcryptHash(getCombinedPassword(urlPassword, customPassword), salt);

    const encryptedSessionKeyData = base64StringToUint8Array(encryptedSessionKey);

    const result = await CryptoProxy.decryptSessionKey({
        binaryMessage: encryptedSessionKeyData,
        passwords: [sessionKeyPassphrase],
    });

    const sessionKey = result?.data;

    if (!sessionKey) {
        throw new Error(c('l10n_nightly Error').t`Failed to decrypt session key`);
    }

    const decryptionKey = await deriveEncryptionKeyFromSessionKey(sessionKey);

    const decryptedMeetingName = await decryptMetadataWithKey(decryptionKey, encryptedMeetingName);

    return decryptedMeetingName;
};

interface PrepareMeetingCryptoDataParams {
    customPassword: string;
    primaryUserKey: PrivateKeyReference;
    meetingName: string;
    api: Api;
}

export const prepareMeetingCryptoData = async ({
    customPassword,
    primaryUserKey,
    meetingName,
    api,
}: PrepareMeetingCryptoDataParams) => {
    const passwordBase = getRandomString(12);
    const salt = generateBcryptSalt();

    const password = getCombinedPassword(passwordBase, customPassword);

    const passwordHash = await computeBcryptHash(password, salt);

    const sessionKey = await CryptoProxy.generateSessionKeyForAlgorithm('aes256');

    const encryptedSessionKey = uint8ArrayToBase64String(
        await CryptoProxy.encryptSessionKey({
            data: sessionKey,
            algorithm: 'aes256',
            passwords: [passwordHash],
            format: 'binary',
        })
    );

    const encryptedPassword = (
        await CryptoProxy.encryptMessage({
            textData: password,
            encryptionKeys: [primaryUserKey],
            format: 'armored',
            signingKeys: [primaryUserKey],
            signatureContext: {
                value: 'pw.link.meet.proton',
                critical: true,
            },
        })
    ).message;

    const {
        Auth: { Salt: urlPasswordSalt, Verifier: srpVerifier, ModulusID: srpModulusID },
    } = await srpGetVerify({ api, credentials: { password: password } });

    const meetingNameEncryptionKey = await deriveEncryptionKeyFromSessionKey(sessionKey);

    const encryptedMeetingName = await encryptMetadataWithKey(meetingNameEncryptionKey, meetingName);

    return {
        encryptedMeetingName,
        encryptedSessionKey,
        encryptedPassword,
        urlPasswordSalt,
        srpVerifier,
        srpModulusID,
        salt,
        passwordBase,
    };
};
