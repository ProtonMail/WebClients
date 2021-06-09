import { DecryptResultPmcrypto } from 'pmcrypto';
import { MIME_TYPES, PGP_SIGN } from 'proton-shared/lib/constants';
import { MailSettings } from 'proton-shared/lib/interfaces';
import loudRejection from 'loud-rejection';
import { arrayToBase64 } from '../../../helpers/base64';
import { createEmbeddedMap } from '../../../helpers/embedded/embeddeds';
import { addApiContact } from '../../../helpers/test/contact';
import {
    addApiKeys,
    addKeysToAddressKeysCache,
    addKeysToUserKeysCache,
    GeneratedKey,
    generateKeys,
} from '../../../helpers/test/crypto';
import {
    addToCache,
    decryptMessageLegacy,
    minimalCache,
    readSessionKey,
    decryptSessionKey,
    decryptMessageMultipart,
    createDocument,
    createAttachment,
    attachmentsCache,
    clearAll,
    addApiMock,
} from '../../../helpers/test/helper';
import { clickSend, ID, prepareMessage, renderComposer, send, setHTML } from './Composer.test.helpers';

loudRejection();

jest.setTimeout(20000);

describe('Composer sending', () => {
    const AddressID = 'AddressID';
    const fromAddress = 'me@home.net';
    const toAddress = 'someone@somewhere.net';

    let fromKeys: GeneratedKey;
    let secondFromKeys: GeneratedKey;
    let toKeys: GeneratedKey;

    beforeAll(async () => {
        fromKeys = await generateKeys('me', fromAddress);
        secondFromKeys = await generateKeys('secondme', fromAddress);
        toKeys = await generateKeys('someone', toAddress);
    });

    beforeEach(() => {
        addKeysToAddressKeysCache(AddressID, fromKeys);
    });

    afterEach(() => {
        clearAll();
        jest.useRealTimers();
    });

    describe('send plaintext', () => {
        it('text/plain clear', async () => {
            const message = prepareMessage({
                localID: ID,
                plainText: 'test',
                data: { MIMEType: MIME_TYPES.PLAINTEXT },
            });

            addKeysToAddressKeysCache(message.data.AddressID, fromKeys);

            const sendRequest = await send(message);

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
                data: { MIMEType: MIME_TYPES.PLAINTEXT, ToList: [{ Name: '', Address: fromAddress }] },
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

            const sendRequest = await send(message, false);

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

            addApiKeys(true, toAddress, [toKeys]);

            const sendRequest = await send(message);

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

            addApiKeys(false, toAddress, [toKeys]);

            const sendRequest = await send(message);

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

            const sendRequest = await send(message, false);

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
            addApiContact({ contactID: 'ContactID', email: toAddress, mimeType: MIME_TYPES.PLAINTEXT }, fromKeys);

            const sendRequest = await send(message, false);

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

            minimalCache();
            addToCache('MailSettings', { DraftMIMEType: MIME_TYPES.DEFAULT } as MailSettings);

            const sendRequest = await send(message, false);

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
            addApiKeys(true, toAddress, [toKeys]);

            const sendRequest = await send(message, false);

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
            addApiKeys(true, toAddress, [toKeys]);

            const sendRequest = await send(message, false);

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
            addApiKeys(false, toAddress, [toKeys]);

            const sendRequest = await send(message, false);

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
                data: { MIMEType: MIME_TYPES.DEFAULT, Attachments: [attachment] },
            });

            minimalCache();
            addToCache('MailSettings', { DraftMIMEType: MIME_TYPES.DEFAULT } as MailSettings);
            addApiKeys(true, toAddress, [toKeys]);

            const sendRequest = await send(message, false);

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
                data: { MIMEType: MIME_TYPES.DEFAULT, Attachments: [attachment] },
            });

            addApiKeys(false, toAddress, [toKeys]);
            attachmentsCache.set(attachment.ID as string, {} as DecryptResultPmcrypto);

            const sendRequest = await send(message);

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
                data: { MIMEType: MIME_TYPES.DEFAULT, Attachments: [attachment] },
            });

            minimalCache();
            addToCache('MailSettings', { DraftMIMEType: MIME_TYPES.DEFAULT } as MailSettings);
            addApiKeys(true, toAddress, [toKeys]);

            const sendRequest = await send(message, false);

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

    it('should not encrypt message with multiple keys', async () => {
        const message = prepareMessage({ plainText: 'test', data: { MIMEType: MIME_TYPES.PLAINTEXT } });

        addKeysToAddressKeysCache(message.data.AddressID, secondFromKeys);
        addApiKeys(true, toAddress, [toKeys]);

        const sendRequest = await send(message);

        expect(sendRequest.data.ExpirationTime).toBeUndefined();
        expect(sendRequest.data.ExpiresIn).toBeUndefined();

        const packages = sendRequest.data.Packages;
        const pack = packages['text/plain'];
        const address = pack.Addresses[toAddress];

        const sessionKey = await decryptSessionKey(address.BodyKeyPacket, toKeys.privateKeys);
        const decryptResult = await decryptMessageLegacy(pack, toKeys.privateKeys, sessionKey);

        // Having 2 signatures here would meen we used both private keys to encrypt
        // It's not "wrong", it works with OpenPGP and API accept it
        // But other clients (Android, iOS, Bridge) don't support it so it's critical to use only one key
        expect(decryptResult.signatures.length).toBe(1);
    });

    it('should ensure squire content before sending', async () => {
        const content = 'test';
        const squireContent = 'squire-test';

        const message = prepareMessage({
            document: createDocument(content),
            data: { MIMEType: MIME_TYPES.DEFAULT },
        });

        minimalCache();
        addToCache('MailSettings', { DraftMIMEType: MIME_TYPES.DEFAULT } as MailSettings);
        addApiKeys(false, toAddress, []);

        const renderResult = await renderComposer(message.localID, false);

        setHTML(squireContent);
        addApiMock(`mail/v4/messages/${ID}`, ({ data: { Message } }) => ({ Message }), 'put');

        const sendRequest = await clickSend(renderResult);

        const packages = sendRequest.data.Packages;
        const pack = packages['text/html'];
        const sessionKey = readSessionKey(pack.BodyKey);
        const decryptResult = await decryptMessageLegacy(pack, fromKeys.privateKeys, sessionKey);

        expect(decryptResult.data).toBe(squireContent);
    });
});
