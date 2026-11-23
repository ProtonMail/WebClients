import { screen } from '@testing-library/react';

import { MAILBOX_LABEL_IDS, MIME_TYPES } from '@proton/shared/lib/constants';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';

import { addApiKeys } from '../../../helpers/tests/crypto';
import { clearAll } from '../../../helpers/tests/helper';
import { messageID, setup } from './Message.test.helpers';

const senderEmail = 'sender@email.com';
const moveTrashedToInboxTestID = 'message-header-expanded:move-trashed-to-inbox';
const moveToTrashTestID = 'message-header-expanded:move-to-trash';

const setupExpandedMessage = async (Flags: number, LabelIDs: string[]) => {
    addApiKeys(false, senderEmail, []);

    const message = {
        localID: messageID,
        data: {
            ID: messageID,
            Body: 'something',
            ConversationID: 'ConversationID',
            Flags,
            LabelIDs,
            MIMEType: MIME_TYPES.PLAINTEXT,
            Sender: { Name: '', Address: senderEmail },
        } as Message,
        messageDocument: { initialized: true, plainText: 'Body' },
    };

    const { open } = await setup(message, { message: message.data });
    await open();
    await screen.findByTestId('message-header-expanded:more-dropdown');
};

describe('Message header move actions', () => {
    afterEach(clearAll);

    it('should offer to move a trashed received message back to inbox', async () => {
        await setupExpandedMessage(MESSAGE_FLAGS.FLAG_RECEIVED, [MAILBOX_LABEL_IDS.TRASH]);

        expect(screen.getByTestId(moveTrashedToInboxTestID)).toBeInTheDocument();
        expect(screen.queryByTestId(moveToTrashTestID)).not.toBeInTheDocument();
    });

    it('should not offer to move a trashed sent message to inbox', async () => {
        await setupExpandedMessage(MESSAGE_FLAGS.FLAG_SENT, [MAILBOX_LABEL_IDS.TRASH]);

        expect(screen.queryByTestId(moveTrashedToInboxTestID)).not.toBeInTheDocument();
        expect(screen.queryByTestId(moveToTrashTestID)).not.toBeInTheDocument();
    });

    it('should offer to trash a message outside trash', async () => {
        await setupExpandedMessage(MESSAGE_FLAGS.FLAG_SENT, [MAILBOX_LABEL_IDS.SENT]);

        expect(screen.getByTestId(moveToTrashTestID)).toBeInTheDocument();
        expect(screen.queryByTestId(moveTrashedToInboxTestID)).not.toBeInTheDocument();
    });
});
