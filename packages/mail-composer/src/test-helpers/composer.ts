import { mergeMessages } from '@proton/mail-message/helpers/message/messages';
import type { MessageStateWithData, PartialMessageState } from '@proton/mail-message/store/messages/messagesTypes';
import { initialize } from '@proton/mail-message/store/messages/read/messagesReadActions';
import { pick } from '@proton/shared/lib/helpers/object';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { addComposerAction } from '../store/composers/composerActions';
import type { ComposerTestStore } from './store';

const getTestMessage = (messageProp: PartialMessageState) => {
    const baseMessage = {
        localID: 'localID',
        data: {
            ID: 'ID',
            AddressID: 'AddressID',
            Subject: 'Subject',
            Sender: { Name: '', Address: 'me@home.net' },
            ToList: [{ Name: '', Address: 'someone@somewhere.net' }],
            CCList: [],
            BCCList: [],
            Attachments: [],
        } as Partial<Message>,
        messageDocument: { initialized: true },
    } as MessageStateWithData;

    return mergeMessages(baseMessage, messageProp) as MessageStateWithData;
};

/** Puts the message in the store and opens a composer on it. */
export const prepareComposerMessage = (
    store: ComposerTestStore,
    messageProp: PartialMessageState,
    composerID: string
) => {
    const message = getTestMessage(messageProp);

    store.dispatch(initialize(message));

    void store.dispatch(
        addComposerAction({
            ID: composerID,
            messageID: message.localID,
            senderEmailAddress: message.data?.Sender?.Address || '',
            recipients: message.data
                ? pick(message.data, ['ToList', 'CCList', 'BCCList'])
                : { BCCList: [], CCList: [], ToList: [] },
            status: 'idle',
        })
    );

    return message;
};
