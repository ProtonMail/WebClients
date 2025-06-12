import { useAddresses } from '@proton/account/addresses/hooks';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import { AUTO_SAVE_CONTACTS } from '@proton/shared/lib/mail/mailSettings';
import generateUID from '@proton/utils/generateUID';

import { useOnCompose } from 'proton-mail/containers/ComposeProvider';
import { findSender } from 'proton-mail/helpers/message/messageRecipients';
import { useSendMessage } from 'proton-mail/hooks/composer/useSendMessage';
import { useSendVerifications } from 'proton-mail/hooks/composer/useSendVerifications';
import { useGetMessage } from 'proton-mail/hooks/message/useMessage';
import { useSaveDraft } from 'proton-mail/hooks/message/useSaveDraft';
import type { MessageStateWithData, PartialMessageState } from 'proton-mail/store/messages/messagesTypes';

import type { PropsWithNewsletterSubscription } from '../../interface';

export const useSendUnsubscribeEmail = ({ subscription }: PropsWithNewsletterSubscription) => {
    const [addresses] = useAddresses();
    const onCompose = useOnCompose();
    const saveDraft = useSaveDraft();
    const getMessage = useGetMessage();
    const sendMessage = useSendMessage();
    const { extendedVerifications: sendVerification } = useSendVerifications();

    const getInputMessage = () => {
        if (!subscription.UnsubscribeMethods.Mailto) {
            throw new Error('Unsubscribe method not found');
        }

        const {
            Subject = 'Unsubscribe',
            Body = 'Please, unsubscribe me',
            ToList = [],
        } = subscription.UnsubscribeMethods.Mailto;

        const from = findSender(addresses, { AddressID: subscription.AddressId }, true);

        if (!from) {
            throw new Error('Sender not found');
        }

        const inputMessage: PartialMessageState = {
            localID: generateUID('unsubscribe'),
            // Unsubscribe request should not save "to" address in contact list
            draftFlags: { autoSaveContacts: AUTO_SAVE_CONTACTS.DISABLED },
            messageDocument: { plainText: Body },
            data: {
                AddressID: from.ID,
                Subject,
                Sender: { Address: from?.Email, Name: from?.DisplayName },
                ToList: ToList.map((email: string) => ({
                    Address: email,
                    Name: email,
                })),
                CCList: [],
                BCCList: [],
                MIMEType: MIME_TYPES.PLAINTEXT,
                Attachments: [],
            },
        };

        return { inputMessage, subject: Subject, body: Body, toList: ToList };
    };

    const sendUnsubscribeEmail = async () => {
        if (!subscription.UnsubscribeMethods.Mailto) {
            return;
        }

        const { inputMessage } = getInputMessage();
        if (!inputMessage) {
            throw new Error('Input message not found');
        }

        const { cleanMessage, mapSendPrefs } = await sendVerification(inputMessage as MessageStateWithData, {});
        await saveDraft(cleanMessage);
        const message = getMessage(cleanMessage.localID) as MessageStateWithData;
        cleanMessage.data = message.data;
        await sendMessage({ inputMessage: cleanMessage, mapSendPrefs, onCompose });
    };

    return { sendUnsubscribeEmail };
};
