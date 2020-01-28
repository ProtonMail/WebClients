import { encryptMessage, PmcryptoKey } from 'pmcrypto';
import { MessageExtended } from '../../models/message';

// Reference: Angular/src/app/message/factories/messageModel.js encryptBody

export const encryptBody = async (
    message: MessageExtended,
    privateKeys: PmcryptoKey[],
    publicKeys: PmcryptoKey[]
): Promise<MessageExtended> => {
    const { data } = await encryptMessage({
        data: message.content || '',
        publicKeys: [publicKeys[0]],
        privateKeys,
        format: 'utf8',
        compression: true
    });

    return { ...message, data: { ...message.data, Body: data } };
};
