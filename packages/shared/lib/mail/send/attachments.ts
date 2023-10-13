import JSBI from 'jsbi';

import { CryptoProxy, PrivateKeyReference, PublicKeyReference, SessionKey } from '@proton/crypto';
import { binaryStringToArray, decodeBase64 } from '@proton/crypto/lib/utils';

import { MIME_TYPES } from '../../constants';
import { hasBitBigInt } from '../../helpers/bitset';
import { Attachment } from '../../interfaces/mail/Message';
import { Packets } from '../../interfaces/mail/crypto';
import { MESSAGE_FLAGS } from '../constants';

export const encryptAttachment = async (
    data: Uint8Array | string,
    { name, type, size }: File = {} as File,
    inline: boolean,
    publicKeys: PublicKeyReference[],
    privateKeys: PrivateKeyReference[] = []
): Promise<Packets> => {
    const dataType = data instanceof Uint8Array ? 'binaryData' : 'textData';
    const sessionKey = await CryptoProxy.generateSessionKey({ recipientKeys: publicKeys });

    // we encrypt using `sessionKey` directly instead of `encryptionKeys` so that returned message only includes
    // symmetrically encrypted data
    const { message: encryptedData, signature } = await CryptoProxy.encryptMessage({
        format: 'binary',
        detached: privateKeys.length > 0, // Only relevant if private keys are given
        [dataType]: data,
        stripTrailingSpaces: dataType === 'textData',
        sessionKey,
        signingKeys: privateKeys,
    });

    const encryptedSessionKey = await CryptoProxy.encryptSessionKey({
        ...sessionKey,
        encryptionKeys: publicKeys[0],
        format: 'binary',
    });

    return {
        Filename: name,
        MIMEType: type as MIME_TYPES,
        FileSize: size,
        Inline: inline,
        signature: signature,
        Preview: data,
        keys: encryptedSessionKey,
        data: encryptedData,
    };
};

export const getSessionKey = async (
    attachment: Pick<Attachment, 'KeyPackets'>,
    privateKeys: PrivateKeyReference[],
    messageFlags?: number
): Promise<SessionKey> => {
    // if (attachment.sessionKey) {
    //     return attachment;
    // }

    const keyPackets = binaryStringToArray(decodeBase64(attachment.KeyPackets) || '');
    const options = {
        binaryMessage: keyPackets,
        decryptionKeys: privateKeys,
        config: {
            allowForwardedMessages: hasBitBigInt(JSBI.BigInt(messageFlags || 0), MESSAGE_FLAGS.FLAG_AUTO_FORWARDEE),
        },
    };

    // if (isOutside()) {
    //     options.passwords = [eoStore.getPassword()];
    // } else {
    //     options.privateKeys = keysModel.getPrivateKeys(message.AddressID);
    // }

    const sessionKey = await CryptoProxy.decryptSessionKey(options);

    if (sessionKey === undefined) {
        throw new Error('Error while decrypting session keys');
    }

    return sessionKey;
};

export const getEOSessionKey = async (attachment: Attachment, password: string): Promise<SessionKey> => {
    const keyPackets = binaryStringToArray(decodeBase64(attachment.KeyPackets) || '');
    const options = { binaryMessage: keyPackets, passwords: [password] };

    const sessionKey = await CryptoProxy.decryptSessionKey(options);

    if (sessionKey === undefined) {
        throw new Error('Error while decrypting session keys');
    }

    return sessionKey;
};
