import { CryptoProxy } from '@proton/crypto';
import { Recipient } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';

import { EOMessage } from '../../logic/eo/eoType';
import { MessageState } from '../../logic/messages/messagesTypes';

export const eoDecrypt = async (encryptedValue: string, password: string) => {
    const { data } = await CryptoProxy.decryptMessage({ armoredMessage: encryptedValue, passwords: [password] });

    return data;
};

export const convertEOtoMessageState = (eoMessage: EOMessage, localID: string): MessageState => {
    return {
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
            MIMEType: eoMessage.MIMEType,
            EORecipient: { Name: eoMessage.Recipient, Address: eoMessage.Recipient } as Recipient,
        } as Message,
    } as MessageState;
};
