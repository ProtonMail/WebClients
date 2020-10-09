import {
    binaryStringToArray,
    decodeBase64,
    decryptSessionKey,
    encryptMessage,
    getMessage,
    OpenPGPKey,
    SessionKey,
    splitMessage,
} from 'pmcrypto';
import { MIME_TYPES } from '../../constants';
import { Packets } from '../../interfaces/mail/crypto';
import { Attachment } from '../../interfaces/mail/Message';

export const encryptAttachment = async (
    data: Uint8Array | string,
    { name, type, size }: File = {} as File,
    inline: boolean,
    publicKeys: OpenPGPKey[],
    privateKeys: OpenPGPKey[]
): Promise<Packets> => {
    const { message, signature } = await encryptMessage({
        // filename: name,
        armor: false,
        detached: true,
        data,
        publicKeys,
        privateKeys,
    });

    const { asymmetric, encrypted } = await splitMessage(message);

    return {
        Filename: name,
        MIMEType: type as MIME_TYPES,
        FileSize: size,
        Inline: inline,
        signature: signature ? (signature.packets.write() as Uint8Array) : undefined,
        Preview: data,
        keys: asymmetric[0],
        data: encrypted[0],
    };
};

export const getSessionKey = async (attachment: Attachment, privateKeys: OpenPGPKey[]): Promise<SessionKey> => {
    // if (attachment.sessionKey) {
    //     return attachment;
    // }

    const keyPackets = binaryStringToArray(decodeBase64(attachment.KeyPackets) || '');
    const options = { message: await getMessage(keyPackets), privateKeys };

    // if (isOutside()) {
    //     options.passwords = [eoStore.getPassword()];
    // } else {
    //     options.privateKeys = keysModel.getPrivateKeys(message.AddressID);
    // }

    const sessionKey = await decryptSessionKey(options);

    if (sessionKey === undefined) {
        throw new Error('Error while decrypting session keys');
    }

    return sessionKey;
};
