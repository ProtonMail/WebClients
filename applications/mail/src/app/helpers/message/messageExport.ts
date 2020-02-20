import { encryptMessage, OpenPGPKey } from 'pmcrypto';
import { enums } from 'openpgp';
import { createDraft, updateDraft } from 'proton-shared/lib/api/messages';
import { Api } from 'proton-shared/lib/interfaces';

import { MessageExtended, Message } from '../../models/message';
import { mutateHTMLCid } from '../embedded/embeddedParser';
import { find } from '../embedded/embeddedFinder';
import { MESSAGE_ACTIONS } from '../../constants';

export const prepareExport = (message: MessageExtended) => {
    if (!message.document) {
        return;
    }

    const document = message.document.cloneNode(true) as Element;

    find(message, document);
    mutateHTMLCid(message.embeddeds, document);

    return document;
};

export const encryptBody = async (content: string, publicKeys?: OpenPGPKey[], privateKeys?: OpenPGPKey[]) => {
    const { data } = await encryptMessage({
        data: content,
        publicKeys: [publicKeys?.[0]] as OpenPGPKey[],
        privateKeys: privateKeys,
        // format: 'utf8',
        compression: enums.compression.zip
    });

    return data;
};

export const prepareAndEncryptBody = async (message: MessageExtended) => {
    const document = prepareExport(message);
    return encryptBody(document?.innerHTML || '', message.publicKeys, message.privateKeys);
};

export const createMessage = async (message: MessageExtended, api: Api): Promise<Message> => {
    const Body = await prepareAndEncryptBody(message);

    const { Message: updatedMessage } = await api(
        createDraft({
            Action: message.action !== MESSAGE_ACTIONS.NEW ? message.action : undefined,
            Message: { ...message.data, Body },
            ParentID: message.ParentID
        } as any)
    );

    return updatedMessage;
};

export const updateMessage = async (message: MessageExtended, api: Api): Promise<Message> => {
    const Body = await prepareAndEncryptBody(message);

    const { Message: updatedMessage } = await api(updateDraft(message.data?.ID, { ...message.data, Body }));

    return updatedMessage;
};
