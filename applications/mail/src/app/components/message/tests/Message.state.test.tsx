import { findByText } from '@testing-library/react';

import { MIME_TYPES } from '@proton/shared/lib/constants';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { addApiKeys, addApiMock, clearAll } from '../../../helpers/test/helper';
import { initialize } from '../../../logic/messages/read/messagesReadActions';
import { store } from '../../../logic/store';
import { addressID, getIframeRootDiv, initMessage, messageID, setup } from './Message.test.helpers';

describe('message state', () => {
    afterEach(clearAll);

    it('should initialize message in cache if not existing', async () => {
        const senderEmail = 'sender@email.com';
        addApiKeys(false, senderEmail, []);

        const Message = {
            ID: messageID,
            AddressID: addressID,
            Attachments: [],
            NumAttachments: 0,
            Sender: { Name: '', Address: senderEmail },
        } as any as Message;

        addApiMock(`mail/v4/messages/${messageID}`, () => ({ Message }));

        await setup();

        const messageFromCache = store.getState().messages[messageID];
        expect(messageFromCache).toBeDefined();
        expect(messageFromCache?.data).toEqual(Message);
    });

    it('should returns message from the cache', async () => {
        const apiMock = jest.fn();
        addApiMock(`mail/v4/messages/${messageID}`, apiMock);

        initMessage();

        await setup();

        expect(apiMock).not.toHaveBeenCalled();
    });

    it('should handle switching of message', async () => {
        const ID1 = 'ID1';
        const ID2 = 'ID2';
        const sender1Email = 'sender1@email.com';
        const sender2Email = 'sender2@email.com';

        addApiKeys(false, sender1Email, []);
        addApiKeys(false, sender2Email, []);

        const message1 = {
            localID: ID1,
            data: {
                ID: ID1,
                Body: 'something',
                MIMEType: MIME_TYPES.PLAINTEXT,
                Sender: { Name: '', Address: sender1Email },
            } as Message,
            messageDocument: { initialized: true, plainText: 'Body1' },
        };
        const message2 = {
            localID: ID2,
            data: {
                ID: ID2,
                Body: 'something',
                MIMEType: MIME_TYPES.PLAINTEXT,
                Sender: { Name: '', Address: sender2Email },
            } as Message,
            messageDocument: { initialized: true, plainText: 'Body2' },
        };

        store.dispatch(initialize(message1));
        store.dispatch(initialize(message2));

        const { container, rerender } = await setup({ message: message1.data });
        const iframe = await getIframeRootDiv(container);
        await findByText(iframe, 'Body1');

        await rerender({ message: message2.data });
        const iframe2 = await getIframeRootDiv(container);
        await findByText(iframe2, 'Body2');

        await rerender({ message: message1.data });
        const iframe3 = await getIframeRootDiv(container);
        await findByText(iframe3, 'Body1');

        await rerender({ message: message2.data });
        const iframe4 = await getIframeRootDiv(container);
        await findByText(iframe4, 'Body2');
    });
});
