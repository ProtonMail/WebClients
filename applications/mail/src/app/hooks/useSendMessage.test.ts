import { MIME_TYPES } from 'proton-shared/lib/constants';

import { useSendVerifications, useSendMessage } from './useSendMessage';
import {
    renderHook,
    clearAll,
    messageCache,
    addApiMock,
    generateKeys,
    GeneratedKey,
    addKeysToAddressKeysCache,
    addApiKeys,
    readSessionKey,
    decryptSessionKey,
    decryptMessageLegacy,
    decryptMessageMultipart
} from '../helpers/test/helper';
import { MessageExtendedWithData, Message, PartialMessageExtended } from '../models/message';
import { mergeMessages } from '../helpers/message/messages';

describe('useSendMessage', () => {
    const fromAddress = 'me@home.net';
    const toAddress = 'someone@somewhere.net';

    let fromKeys: GeneratedKey;
    let toKeys: GeneratedKey;

    const prepareMessage = (message: PartialMessageExtended) => {
        const baseMessage = {
            localID: 'localID',
            data: {
                ID: 'ID',
                AddressID: 'AddressID',
                Subject: 'Subject',
                Sender: { Address: fromAddress },
                ToList: [{ Address: toAddress }],
                CCList: [],
                BCCList: []
            } as Partial<Message>
        } as MessageExtendedWithData;

        const resultMessage = mergeMessages(baseMessage, message);

        messageCache.set(resultMessage.localID, resultMessage);

        return resultMessage as MessageExtendedWithData;
    };

    const setup = () => {
        const hook = renderHook(() => {
            const sendVerifications = useSendVerifications();
            const sendMessage = useSendMessage();
            return { sendVerifications, sendMessage };
        });

        const sendVerifications = hook.result.current.sendVerifications as ReturnType<typeof useSendVerifications>;
        const sendMessage = hook.result.current.sendMessage as ReturnType<typeof useSendMessage>;

        return { sendVerifications, sendMessage };
    };

    beforeAll(async () => {
        fromKeys = await generateKeys('me', fromAddress);
        toKeys = await generateKeys('someout', toAddress);
    });

    afterEach(clearAll);

    describe('send plaintext', () => {
        it('text/plain clear', async () => {
            const message = prepareMessage({ plainText: 'test', data: { MIMEType: MIME_TYPES.PLAINTEXT } });

            addKeysToAddressKeysCache(message.data.AddressID, fromKeys);

            const { sendVerifications, sendMessage } = setup();

            const { cleanMessage, mapSendPrefs } = await sendVerifications(message);

            const sendSpy = jest.fn(() => Promise.resolve({ Sent: {} }));
            addApiMock(`mail/v4/messages/${message.data.ID}`, sendSpy);

            await sendMessage(cleanMessage, mapSendPrefs, true);

            const sendRequest = (sendSpy.mock.calls[0] as any[])[0];

            expect(sendRequest.method).toBe('post');
            expect(sendRequest.data.ExpirationTime).toBeUndefined();
            expect(sendRequest.data.ExpiresIn).toBeUndefined();

            const packages = sendRequest.data.Packages;
            const pack = packages['text/plain'];

            expect(pack).toBeDefined();

            const sessionKey = readSessionKey(pack);

            const decryptResult = await decryptMessageLegacy(pack, fromKeys.privateKeys, sessionKey);

            expect(decryptResult.data).toBe(message.plainText);
        });

        it('text/plain pgp internal', async () => {
            const message = prepareMessage({ plainText: 'test', data: { MIMEType: MIME_TYPES.PLAINTEXT } });

            const { sendVerifications, sendMessage } = setup();

            addApiKeys(true, toKeys);

            const { cleanMessage, mapSendPrefs } = await sendVerifications(message);

            const sendSpy = jest.fn(() => Promise.resolve({ Sent: {} }));
            addApiMock(`mail/v4/messages/${message.data.ID}`, sendSpy);

            await sendMessage(cleanMessage, mapSendPrefs, true);

            const sendRequest = (sendSpy.mock.calls[0] as any[])[0];

            expect(sendRequest.method).toBe('post');
            expect(sendRequest.data.ExpirationTime).toBeUndefined();
            expect(sendRequest.data.ExpiresIn).toBeUndefined();

            const packages = sendRequest.data.Packages;
            const pack = packages['text/plain'];

            expect(pack).toBeDefined();

            const sessionKey = await decryptSessionKey(pack.Addresses[toAddress], toKeys.privateKeys);

            expect(sessionKey).toBeDefined();

            const decryptResult = await decryptMessageLegacy(pack, toKeys.privateKeys, sessionKey);

            expect(decryptResult.data).toBe(message.plainText);
        });

        it('multipart/mixed pgp external', async () => {
            const message = prepareMessage({ plainText: 'test', data: { MIMEType: MIME_TYPES.PLAINTEXT } });

            const { sendVerifications, sendMessage } = setup();

            addApiKeys(false, toKeys);

            const { cleanMessage, mapSendPrefs } = await sendVerifications(message);

            const sendSpy = jest.fn(() => Promise.resolve({ Sent: {} }));
            addApiMock(`mail/v4/messages/${message.data.ID}`, sendSpy);

            await sendMessage(cleanMessage, mapSendPrefs, true);

            const sendRequest = (sendSpy.mock.calls[0] as any[])[0];

            expect(sendRequest.method).toBe('post');
            expect(sendRequest.data.ExpirationTime).toBeUndefined();
            expect(sendRequest.data.ExpiresIn).toBeUndefined();

            const packages = sendRequest.data.Packages;
            const pack = packages['multipart/mixed'];

            expect(pack).toBeDefined();

            const sessionKey = await decryptSessionKey(pack.Addresses[toAddress], toKeys.privateKeys);

            expect(sessionKey).toBeDefined();

            const decryptResult = await decryptMessageMultipart(pack, toKeys.privateKeys, sessionKey);

            expect(decryptResult.data).toBe(message.plainText);
            expect(decryptResult.mimeType).toBe(message.data.MIMEType);
        });
    });
});
