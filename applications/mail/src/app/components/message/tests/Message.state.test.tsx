import { MIME_TYPES } from '@proton/shared/lib/constants';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { addApiMock, messageCache } from '../../../helpers/test/helper';
import { MessageExtendedWithData } from '../../../models/message';
import { messageID, addressID, setup, initMessage } from './Message.test.helpers';

describe('message state', () => {
    it('should initialize message in cache if not existing', async () => {
        const Message = {
            ID: messageID,
            AddressID: addressID,
            Attachments: [],
            NumAttachments: 0,
        } as any as Message;

        addApiMock(`mail/v4/messages/${messageID}`, () => ({ Message }));

        await setup();

        const messageFromCache = messageCache.get(messageID);
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

        messageCache.set(ID1, {
            localID: ID1,
            data: { ID: ID1, Body: 'something', MIMEType: MIME_TYPES.PLAINTEXT } as Message,
            initialized: true,
            plainText: 'Body1',
        });
        messageCache.set(ID2, {
            localID: ID2,
            data: { ID: ID2, Body: 'something', MIMEType: MIME_TYPES.PLAINTEXT } as Message,
            initialized: true,
            plainText: 'Body2',
        });

        const message1 = messageCache.get(ID1) as MessageExtendedWithData;
        const message2 = messageCache.get(ID2) as MessageExtendedWithData;

        const { rerender, getByText } = await setup({ message: message1.data });
        getByText('Body1');
        await rerender({ message: message2.data });
        getByText('Body2');
        await rerender({ message: message1.data });
        getByText('Body1');
        await rerender({ message: message2.data });
        getByText('Body2');
    });
});
