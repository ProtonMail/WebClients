import { DecryptResultPmcrypto } from 'pmcrypto';
import { MIME_TYPES, PGP_SIGN } from 'proton-shared/lib/constants';
import { MailSettings } from 'proton-shared/lib/interfaces';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';

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
    decryptMessageLegacy,
    decryptMessageMultipart,
    addToCache,
    minimalCache,
    addKeysToUserKeysCache,
    createAttachment,
    createDocument,
    attachmentsCache,
} from '../helpers/test/helper';
import { MessageExtendedWithData, PartialMessageExtended } from '../models/message';
import { mergeMessages } from '../helpers/message/messages';
import { addApiContact } from '../helpers/test/contact';
import { decryptSessionKey } from '../helpers/test/crypto';
import { createEmbeddedMap } from '../helpers/embedded/embeddeds';
import { arrayToBase64 } from '../helpers/base64';

const { useSendVerifications, useSendMessage } = require('./useSendMessage');

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
                BCCList: [],
            } as Partial<Message>,
        } as MessageExtendedWithData;

        const resultMessage = mergeMessages(baseMessage, message);

        messageCache.set(resultMessage.localID, resultMessage);

        return resultMessage as MessageExtendedWithData;
    };

    const setup = (useMinimalCache = true) => {
        const hook = renderHook(() => {
            const sendVerifications = useSendVerifications();
            const sendMessage = useSendMessage();
            return { sendVerifications, sendMessage };
        }, useMinimalCache);

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

            const sessionKey = readSessionKey(pack.BodyKey);

            const decryptResult = await decryptMessageLegacy(pack, fromKeys.privateKeys, sessionKey);

            expect(decryptResult.data).toBe(message.plainText);
        });

        it('text/plain self', async () => {
            const message = prepareMessage({
                plainText: 'test',
                data: { MIMEType: MIME_TYPES.PLAINTEXT, ToList: [{ Address: fromAddress }] },
            });

            minimalCache();
            addToCache('Addresses', [
                {
                    ID: message.data.AddressID,
                    Email: fromAddress,
                    Receive: 1,
                    HasKeys: true,
                },
            ]);
            addKeysToAddressKeysCache(message.data.AddressID, fromKeys);

            const { sendVerifications, sendMessage } = setup(false);

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
            const address = pack.Addresses[fromAddress];

            const sessionKey = await decryptSessionKey(address.BodyKeyPacket, fromKeys.privateKeys);

            expect(sessionKey).toBeDefined();

            const decryptResult = await decryptMessageLegacy(pack, fromKeys.privateKeys, sessionKey);

            expect(decryptResult.data).toBe(message.plainText);
        });

        it('text/plain pgp internal', async () => {
            const message = prepareMessage({ plainText: 'test', data: { MIMEType: MIME_TYPES.PLAINTEXT } });

            addApiKeys(true, toKeys);

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
            const address = pack.Addresses[toAddress];

            const sessionKey = await decryptSessionKey(address.BodyKeyPacket, toKeys.privateKeys);

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
            const address = pack.Addresses[toAddress];

            const sessionKey = await decryptSessionKey(address.BodyKeyPacket, toKeys.privateKeys);

            expect(sessionKey).toBeDefined();

            const decryptResult = await decryptMessageMultipart(pack, toKeys.privateKeys, sessionKey);

            expect(decryptResult.data).toBe(message.plainText);
            expect(decryptResult.mimeType).toBe(message.data.MIMEType);
        });

        it('downgrade to plaintext due to contact setting', async () => {
            const content = 'test';

            const message = prepareMessage({
                document: createDocument(content),
                data: { MIMEType: MIME_TYPES.DEFAULT },
            });

            minimalCache();

            addToCache('MailSettings', { DraftMIMEType: MIME_TYPES.DEFAULT } as MailSettings);
            addKeysToUserKeysCache(fromKeys);
            addApiContact({ contactID: 'ContactID', email: toAddress, mimeType: MIME_TYPES.PLAINTEXT }, fromKeys);

            const { sendVerifications, sendMessage } = setup(false);

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

            const sessionKey = readSessionKey(pack.BodyKey);

            const decryptResult = await decryptMessageLegacy(pack, fromKeys.privateKeys, sessionKey);

            expect(decryptResult.data).toBe(content);
        });

        it.skip('downgrade to plaintext and sign', async () => {
            const content = 'test';

            const message = prepareMessage({
                document: createDocument(content),
                data: { MIMEType: MIME_TYPES.DEFAULT },
            });

            minimalCache();

            addToCache('MailSettings', { DraftMIMEType: MIME_TYPES.DEFAULT, Sign: PGP_SIGN } as MailSettings);
            addKeysToUserKeysCache(fromKeys);
            addApiContact({ contactID: 'ContactID', email: toAddress, mimeType: MIME_TYPES.PLAINTEXT }, fromKeys);

            const { sendVerifications, sendMessage } = setup(false);

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

            const sessionKey = readSessionKey(pack.BodyKey);

            const decryptResult = await decryptMessageLegacy(pack, fromKeys.privateKeys, sessionKey);

            expect(decryptResult.data).toBe(content);
        });
    });

    describe('send html', () => {
        it('text/html clear', async () => {
            const content = 'test';

            const message = prepareMessage({
                document: createDocument(content),
                data: { MIMEType: MIME_TYPES.DEFAULT },
            });

            addKeysToAddressKeysCache(message.data.AddressID, fromKeys);

            minimalCache();

            addToCache('MailSettings', { DraftMIMEType: MIME_TYPES.DEFAULT } as MailSettings);

            const { sendVerifications, sendMessage } = setup(false);

            const { cleanMessage, mapSendPrefs } = await sendVerifications(message);

            const sendSpy = jest.fn(() => Promise.resolve({ Sent: {} }));
            addApiMock(`mail/v4/messages/${message.data.ID}`, sendSpy);

            await sendMessage(cleanMessage, mapSendPrefs, true);

            const sendRequest = (sendSpy.mock.calls[0] as any[])[0];

            expect(sendRequest.method).toBe('post');
            expect(sendRequest.data.ExpirationTime).toBeUndefined();
            expect(sendRequest.data.ExpiresIn).toBeUndefined();

            const packages = sendRequest.data.Packages;
            const pack = packages['text/html'];

            expect(pack).toBeDefined();

            const sessionKey = readSessionKey(pack.BodyKey);

            const decryptResult = await decryptMessageLegacy(pack, fromKeys.privateKeys, sessionKey);

            expect(decryptResult.data).toBe(content);
        });

        it('text/html pgp internal', async () => {
            const content = 'test';

            const message = prepareMessage({
                document: createDocument(content),
                data: { MIMEType: MIME_TYPES.DEFAULT },
            });

            minimalCache();

            addToCache('MailSettings', { DraftMIMEType: MIME_TYPES.DEFAULT } as MailSettings);

            const { sendVerifications, sendMessage } = setup(false);

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
            const pack = packages['text/html'];
            const address = pack.Addresses[toAddress];

            const sessionKey = await decryptSessionKey(address.BodyKeyPacket, toKeys.privateKeys);

            expect(sessionKey).toBeDefined();

            const decryptResult = await decryptMessageLegacy(pack, toKeys.privateKeys, sessionKey);

            expect(decryptResult.data).toBe(content);
        });

        it('no downgrade even for default plaintext', async () => {
            const content = 'test';

            const message = prepareMessage({
                document: createDocument(content),
                data: { MIMEType: MIME_TYPES.DEFAULT },
            });

            minimalCache();
            addToCache('MailSettings', { DraftMIMEType: MIME_TYPES.PLAINTEXT } as MailSettings);
            addApiKeys(true, toKeys);

            const { sendVerifications, sendMessage } = setup(false);

            const { cleanMessage, mapSendPrefs } = await sendVerifications(message);

            const sendSpy = jest.fn(() => Promise.resolve({ Sent: {} }));
            addApiMock(`mail/v4/messages/${message.data.ID}`, sendSpy);

            await sendMessage(cleanMessage, mapSendPrefs, true);

            const sendRequest = (sendSpy.mock.calls[0] as any[])[0];

            expect(sendRequest.method).toBe('post');
            expect(sendRequest.data.ExpirationTime).toBeUndefined();
            expect(sendRequest.data.ExpiresIn).toBeUndefined();

            const packages = sendRequest.data.Packages;
            const pack = packages['text/html'];
            const address = pack.Addresses[toAddress];

            const sessionKey = await decryptSessionKey(address.BodyKeyPacket, toKeys.privateKeys);

            expect(sessionKey).toBeDefined();

            const decryptResult = await decryptMessageLegacy(pack, toKeys.privateKeys, sessionKey);

            expect(decryptResult.data).toBe(content);
        });

        it('multipart/mixed pgp external', async () => {
            const content = 'test';
            const document = window.document.createElement('div');
            document.innerHTML = content;

            const message = prepareMessage({ document, data: { MIMEType: MIME_TYPES.DEFAULT } });

            minimalCache();

            addToCache('MailSettings', { DraftMIMEType: MIME_TYPES.DEFAULT } as MailSettings);

            const { sendVerifications, sendMessage } = setup(false);

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
            const address = pack.Addresses[toAddress];

            const sessionKey = await decryptSessionKey(address.BodyKeyPacket, toKeys.privateKeys);

            expect(sessionKey).toBeDefined();

            const decryptResult = await decryptMessageMultipart(pack, toKeys.privateKeys, sessionKey);

            expect(decryptResult.data).toBe(content);
            expect(decryptResult.mimeType).toBe(message.data.MIMEType);
        });
    });

    describe('attachments', () => {
        it('text/html with attachment', async () => {
            const content = 'test';
            const { attachment, sessionKey: generatedSessionKey } = await createAttachment(
                {
                    ID: 'AttachmentID',
                    Name: 'image.png',
                    MIMEType: 'image/png',
                },
                fromKeys.publicKeys
            );
            const message = prepareMessage({
                document: createDocument(content),
                privateKeys: fromKeys.privateKeys,
                data: { MIMEType: MIME_TYPES.DEFAULT, Attachments: [attachment] },
            });

            minimalCache();

            addToCache('MailSettings', { DraftMIMEType: MIME_TYPES.DEFAULT } as MailSettings);

            const { sendVerifications, sendMessage } = setup(false);

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
            const pack = packages['text/html'];
            const address = pack.Addresses[toAddress];
            const AttachmentKeyPackets = address.AttachmentKeyPackets[attachment.ID as string];

            const sessionKey = await decryptSessionKey(AttachmentKeyPackets, toKeys.privateKeys);

            expect(arrayToBase64(sessionKey.data)).toBe(arrayToBase64(generatedSessionKey.data));
        });

        it('multipart/mixed with attachment', async () => {
            const content = 'test';
            const { attachment } = await createAttachment(
                {
                    ID: 'AttachmentID',
                    Name: 'image.png',
                    MIMEType: 'image/png',
                },
                fromKeys.publicKeys
            );
            const message = prepareMessage({
                document: createDocument(content),
                privateKeys: fromKeys.privateKeys,
                data: { MIMEType: MIME_TYPES.DEFAULT, Attachments: [attachment] },
            });

            addApiKeys(false, toKeys);
            attachmentsCache.set(attachment.ID as string, {} as DecryptResultPmcrypto);

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
            const pack = packages['multipart/mixed'];
            const address = pack.Addresses[toAddress];

            const sessionKey = await decryptSessionKey(address.BodyKeyPacket, toKeys.privateKeys);

            expect(sessionKey).toBeDefined();

            const decryptResult = await decryptMessageMultipart(pack, toKeys.privateKeys, sessionKey);

            expect(decryptResult.data).toBe(content);
            expect(decryptResult.mimeType).toBe(message.data.MIMEType);
            expect(decryptResult.attachments.length).toBe(1);
            expect(decryptResult.attachments[0].fileName).toBe(attachment.Name);
            expect(decryptResult.attachments[0].contentType).toBe(attachment.MIMEType);
        });

        it('embedded image', async () => {
            const cid = 'cid';
            const imageUrl = 'https://localhost/some-generated-id';
            const { attachment } = await createAttachment(
                {
                    ID: 'AttachmentID',
                    Name: 'embedded.png',
                    MIMEType: 'image/png',
                    Headers: { 'content-id': cid },
                },
                fromKeys.publicKeys
            );

            const embeddeds = createEmbeddedMap();
            embeddeds.set(cid, { attachment, url: imageUrl });

            const content = `<img src="${imageUrl}" data-embedded-img="${cid}">`;
            const document = window.document.createElement('div');
            document.innerHTML = content;

            const message = prepareMessage({
                document,
                embeddeds,
                privateKeys: fromKeys.privateKeys,
                data: { MIMEType: MIME_TYPES.DEFAULT, Attachments: [attachment] },
            });

            minimalCache();

            addToCache('MailSettings', { DraftMIMEType: MIME_TYPES.DEFAULT } as MailSettings);

            const { sendVerifications, sendMessage } = setup(false);

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
            const pack = packages['text/html'];
            const address = pack.Addresses[toAddress];

            const sessionKey = await decryptSessionKey(address.BodyKeyPacket, toKeys.privateKeys);

            expect(sessionKey).toBeDefined();

            const decryptResult = await decryptMessageLegacy(pack, toKeys.privateKeys, sessionKey);

            expect(decryptResult.data).toBe(`<img src="cid:${cid}">`);
        });
    });
});
