import { findByText } from '@testing-library/react';

import type { PublicPrivateKey } from '@proton/mail/store/messages/messagesTypes';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

// mock useGetMessageKeys on-the-fly when needed
import { useGetMessageKeys } from 'proton-mail/hooks/message/useGetMessageKeys';

import { addApiKeys, addApiMock, clearAll } from '../../../helpers/test/helper';
import { initialize } from '../../../store/messages/read/messagesReadActions';
import { addressID, getIframeRootDiv, messageID, setup } from './Message.test.helpers';

jest.mock('proton-mail/hooks/message/useGetMessageKeys');
const mockUseGetMessageKeys = () => {
    // empty return value since the result is not used in these tests; if this were to change,
    // this mock should be dropped a valid key setup should be put in place.
    jest.mocked(useGetMessageKeys).mockReturnValue(async () => ({}) as PublicPrivateKey);
};

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

        mockUseGetMessageKeys();
        const { store } = await setup(undefined);

        const messageFromCache = store.getState().messages[messageID];
        expect(messageFromCache).toBeDefined();
        expect(messageFromCache?.data).toEqual(Message);
    });

    it('should returns message from the cache', async () => {
        const apiMock = jest.fn();
        addApiMock(`mail/v4/messages/${messageID}`, apiMock);

        await setup({});

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

        const { store, container, rerender } = await setup(message1, { message: message1.data });

        store.dispatch(initialize(message2));

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
