import { decryptMessage, getMessage } from 'pmcrypto';
import { MessageState } from 'proton-mail/src/app/logic/messages/messagesTypes';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { Recipient } from '@proton/shared/lib/interfaces';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import { EOMessage } from '../logic/eo/eoType';

export const decrypt = async (encryptedValue: string, password: string) => {
    const message = await getMessage(encryptedValue);
    const { data } = await decryptMessage({ message, passwords: [password] });

    return data;
};

export const convertEOtoMessageState = (eoMessage: EOMessage, localID: string): MessageState => {
    const messageState = {
        localID,
        data: {
            ConversationID: 'eoConversation',
            Subject: eoMessage.Subject,
            Sender: eoMessage.Sender,
            Flags: MESSAGE_FLAGS.FLAG_RECEIVED,
            ToList: eoMessage.ToList,
            CCList: eoMessage.CCList,
            BCCList: [] as Recipient[],
            Time: eoMessage.Time,
            NumAttachments: eoMessage.NumAttachments,
            ExpirationTime: eoMessage.ExpirationTime,
            Body: eoMessage.Body,
            Attachments: eoMessage.Attachments,
            LabelIDs: ['0'],
            SenderName: eoMessage.SenderName,
            SenderAddress: eoMessage.SenderAddress,
            MIMEType: eoMessage.MIMEType,
        } as Message,
    } as MessageState;

    return messageState;
};
