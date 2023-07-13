import { fireEvent, getByTestId } from '@testing-library/react';
import loudRejection from 'loud-rejection';

import { ROOSTER_EDITOR_ID } from '@proton/components/components/editor/constants';
import { WorkerDecryptionResult } from '@proton/crypto/lib';
import { MIME_TYPES, PGP_SIGN } from '@proton/shared/lib/constants';
import { MailSettings } from '@proton/shared/lib/interfaces';

import { arrayToBase64 } from '../../../helpers/base64';
import { addApiContact } from '../../../helpers/test/contact';
import {
    GeneratedKey,
    addApiKeys,
    addKeysToAddressKeysCache,
    addKeysToUserKeysCache,
    generateKeys,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '../../../helpers/test/crypto';
import {
    addApiMock,
    addToCache,
    clearAll,
    createAttachment,
    createDocument,
    createEmbeddedImage,
    createMessageImages,
    decryptMessage,
    decryptMessageMultipart,
    decryptSessionKey,
    minimalCache,
    readSessionKey,
} from '../../../helpers/test/helper';
import { addAttachment } from '../../../logic/attachments/attachmentsActions';
import { store } from '../../../logic/store';
import { ID, clickSend, prepareMessage, renderComposer, send } from './Composer.test.helpers';

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
        await setupCryptoProxyForTesting();

        fromKeys = await generateKeys('me', fromAddress);
        secondFromKeys = await generateKeys('secondme', fromAddress);
        toKeys = await generateKeys('someone', toAddress);
    });

    afterAll(async () => {
        clearAll();
        await releaseCryptoProxy();
    });

    beforeEach(() => {
        clearAll();
        addKeysToAddressKeysCache(AddressID, fromKeys);
    });

    describe('send plaintext', () => {
        it('text/plain clear', async () => {
            const { composerID, message } = prepareMessage({
                localID: ID,
                messageDocument: { plainText: 'test' },
                data: { MIMEType: MIME_TYPES.PLAINTEXT },
            });

            addKeysToAddressKeysCache(message.data.AddressID, fromKeys);

            const sendRequest = await send(composerID);

            expect(sendRequest.data.ExpirationTime).toBeUndefined();
            expect(sendRequest.data.ExpiresIn).toBeUndefined();

            const packages = sendRequest.data.Packages;
            const pack = packages['text/plain'];

            expect(pack).toBeDefined();

            const sessionKey = readSessionKey(pack.BodyKey);

            const decryptResult = await decryptMessage(pack, fromKeys.privateKeys, sessionKey);

            expect(decryptResult.data).toBe(message.messageDocument?.plainText);
        });

        it('text/plain self', async () => {
            const { composerID, message } = prepareMessage({
                messageDocument: { plainText: 'test' },
                data: { MIMEType: MIME_TYPES.PLAINTEXT, ToList: [{ Name: '', Address: fromAddress }] },
            });

            minimalCache();
            addToCache('Addresses', [
                {
                    ID: message.data.AddressID,
                    Email: fromAddress,
                    Receive: 1,
                    HasKeys: true,
                    Keys: [
                        {
                            Primary: 1,
                            PrivateKey: fromKeys.privateKeyArmored,
                            PublicKey: fromKeys.publicKeyArmored,
                        },
                    ],
                },
            ]);

            const sendRequest = await send(composerID, false);

            expect(sendRequest.data.ExpirationTime).toBeUndefined();
            expect(sendRequest.data.ExpiresIn).toBeUndefined();

            const packages = sendRequest.data.Packages;
            const pack = packages['text/plain'];
            const address = pack.Addresses[fromAddress];

            const sessionKey = await decryptSessionKey(address.BodyKeyPacket, fromKeys.privateKeys);

            expect(sessionKey).toBeDefined();

            const decryptResult = await decryptMessage(pack, fromKeys.privateKeys, sessionKey);

            expect(decryptResult.data).toBe(message.messageDocument?.plainText);
        });

        it('text/plain pgp internal', async () => {
            const { composerID, message } = prepareMessage({
                messageDocument: { plainText: 'test' },
                data: { MIMEType: MIME_TYPES.PLAINTEXT },
            });

            addApiKeys(true, toAddress, [toKeys]);

            const sendRequest = await send(composerID);

            expect(sendRequest.data.ExpirationTime).toBeUndefined();
            expect(sendRequest.data.ExpiresIn).toBeUndefined();

            const packages = sendRequest.data.Packages;
            const pack = packages['text/plain'];
            const address = pack.Addresses[toAddress];

            const sessionKey = await decryptSessionKey(address.BodyKeyPacket, toKeys.privateKeys);

            expect(sessionKey).toBeDefined();

            const decryptResult = await decryptMessage(pack, toKeys.privateKeys, sessionKey);

            expect(decryptResult.data).toBe(message.messageDocument?.plainText);
        });

        it('multipart/mixed pgp external', async () => {
            const { composerID, message } = prepareMessage({
                messageDocument: { plainText: 'test' },
                data: { MIMEType: MIME_TYPES.PLAINTEXT },
            });

            addApiKeys(false, toAddress, [toKeys]);

            const sendRequest = await send(composerID);

            expect(sendRequest.data.ExpirationTime).toBeUndefined();
            expect(sendRequest.data.ExpiresIn).toBeUndefined();

            const packages = sendRequest.data.Packages;
            const pack = packages['multipart/mixed'];
            const address = pack.Addresses[toAddress];

            const sessionKey = await decryptSessionKey(address.BodyKeyPacket, toKeys.privateKeys);

            expect(sessionKey).toBeDefined();

            const decryptResult = await decryptMessageMultipart(pack, toKeys.privateKeys, sessionKey);

            expect(decryptResult.data).toBe(message.messageDocument?.plainText);
            expect(decryptResult.mimeType).toBe(message.data.MIMEType);
        });

        it('downgrade to plaintext due to contact setting', async () => {
            const content = 'test';

            const { composerID } = prepareMessage({
                messageDocument: { document: createDocument(content) },
                data: { MIMEType: MIME_TYPES.DEFAULT },
            });

            minimalCache();
            addToCache('MailSettings', { DraftMIMEType: MIME_TYPES.DEFAULT } as MailSettings);
            addKeysToUserKeysCache(fromKeys);
            addApiContact({ contactID: 'ContactID', email: toAddress, mimeType: MIME_TYPES.PLAINTEXT }, fromKeys);

            const sendRequest = await send(composerID, false);

            expect(sendRequest.data.ExpirationTime).toBeUndefined();
            expect(sendRequest.data.ExpiresIn).toBeUndefined();

            const packages = sendRequest.data.Packages;
            const pack = packages['text/plain'];

            expect(pack).toBeDefined();

            const sessionKey = readSessionKey(pack.BodyKey);

            const decryptResult = await decryptMessage(pack, fromKeys.privateKeys, sessionKey);

            expect(decryptResult.data).toBe(content);
        });

        it.skip('downgrade to plaintext and sign', async () => {
            const content = 'test';

            const { composerID } = prepareMessage({
                messageDocument: { document: createDocument(content) },
                data: { MIMEType: MIME_TYPES.DEFAULT },
            });

            minimalCache();
            addToCache('MailSettings', { DraftMIMEType: MIME_TYPES.DEFAULT, Sign: PGP_SIGN } as MailSettings);
            addApiContact({ contactID: 'ContactID', email: toAddress, mimeType: MIME_TYPES.PLAINTEXT }, fromKeys);

            const sendRequest = await send(composerID, false);

            expect(sendRequest.data.ExpirationTime).toBeUndefined();
            expect(sendRequest.data.ExpiresIn).toBeUndefined();

            const packages = sendRequest.data.Packages;
            const pack = packages['text/plain'];

            expect(pack).toBeDefined();

            const sessionKey = readSessionKey(pack.BodyKey);

            const decryptResult = await decryptMessage(pack, fromKeys.privateKeys, sessionKey);

            expect(decryptResult.data).toBe(content);
        });
    });

    describe('send html', () => {
        it('text/html clear', async () => {
            const content = 'test';

            const { composerID } = prepareMessage({
                messageDocument: { document: createDocument(content) },
                data: { MIMEType: MIME_TYPES.DEFAULT },
            });

            minimalCache();
            addToCache('MailSettings', { DraftMIMEType: MIME_TYPES.DEFAULT } as MailSettings);

            const sendRequest = await send(composerID, false);

            expect(sendRequest.data.ExpirationTime).toBeUndefined();
            expect(sendRequest.data.ExpiresIn).toBeUndefined();

            const packages = sendRequest.data.Packages;
            const pack = packages['text/html'];

            expect(pack).toBeDefined();

            const sessionKey = readSessionKey(pack.BodyKey);

            const decryptResult = await decryptMessage(pack, fromKeys.privateKeys, sessionKey);

            expect(decryptResult.data).toBe(content);
        });

        it('text/html pgp internal', async () => {
            const content = 'test';

            const { composerID } = prepareMessage({
                messageDocument: { document: createDocument(content) },
                data: { MIMEType: MIME_TYPES.DEFAULT },
            });

            minimalCache();
            addToCache('MailSettings', { DraftMIMEType: MIME_TYPES.DEFAULT } as MailSettings);
            addApiKeys(true, toAddress, [toKeys]);

            const sendRequest = await send(composerID, false);

            expect(sendRequest.data.ExpirationTime).toBeUndefined();
            expect(sendRequest.data.ExpiresIn).toBeUndefined();

            const packages = sendRequest.data.Packages;
            const pack = packages['text/html'];
            const address = pack.Addresses[toAddress];

            const sessionKey = await decryptSessionKey(address.BodyKeyPacket, toKeys.privateKeys);

            expect(sessionKey).toBeDefined();

            const decryptResult = await decryptMessage(pack, toKeys.privateKeys, sessionKey);

            expect(decryptResult.data).toBe(content);
        });

        it('no downgrade even for default plaintext', async () => {
            const content = 'test';

            const { composerID } = prepareMessage({
                messageDocument: { document: createDocument(content) },
                data: { MIMEType: MIME_TYPES.DEFAULT },
            });

            minimalCache();
            addToCache('MailSettings', { DraftMIMEType: MIME_TYPES.PLAINTEXT } as MailSettings);
            addApiKeys(true, toAddress, [toKeys]);

            const sendRequest = await send(composerID, false);

            expect(sendRequest.data.ExpirationTime).toBeUndefined();
            expect(sendRequest.data.ExpiresIn).toBeUndefined();

            const packages = sendRequest.data.Packages;
            const pack = packages['text/html'];
            const address = pack.Addresses[toAddress];

            const sessionKey = await decryptSessionKey(address.BodyKeyPacket, toKeys.privateKeys);

            expect(sessionKey).toBeDefined();

            const decryptResult = await decryptMessage(pack, toKeys.privateKeys, sessionKey);

            expect(decryptResult.data).toBe(content);
        });

        it('multipart/mixed pgp external', async () => {
            const content = 'test';
            const document = window.document.createElement('div');
            document.innerHTML = content;

            const { composerID, message } = prepareMessage({
                messageDocument: { document },
                data: { MIMEType: MIME_TYPES.DEFAULT },
            });

            minimalCache();
            addToCache('MailSettings', { DraftMIMEType: MIME_TYPES.DEFAULT } as MailSettings);
            addApiKeys(false, toAddress, [toKeys]);

            const sendRequest = await send(composerID, false);

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
            const { composerID } = prepareMessage({
                messageDocument: { document: createDocument(content) },
                data: { MIMEType: MIME_TYPES.DEFAULT, Attachments: [attachment] },
            });

            minimalCache();
            addToCache('MailSettings', { DraftMIMEType: MIME_TYPES.DEFAULT } as MailSettings);
            addApiKeys(true, toAddress, [toKeys]);

            const sendRequest = await send(composerID, false);

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
                    data: new Uint8Array(),
                },
                fromKeys.publicKeys
            );
            const { message, composerID } = prepareMessage({
                messageDocument: { document: createDocument(content) },
                data: {
                    MIMEType: MIME_TYPES.DEFAULT,
                    Attachments: [attachment],
                },
            });

            addApiKeys(false, toAddress, [toKeys]);
            store.dispatch(
                addAttachment({
                    ID: attachment.ID as string,
                    attachment: { data: attachment.data } as WorkerDecryptionResult<Uint8Array>,
                })
            );

            const sendRequest = await send(composerID);

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
            const image = createEmbeddedImage(attachment);
            const messageImages = createMessageImages([image]);

            const content = `<img src="${imageUrl}" data-embedded-img="cid:${cid}">`;
            const document = window.document.createElement('div');
            document.innerHTML = content;

            const { composerID } = prepareMessage({
                messageDocument: { document },
                messageImages,
                data: { MIMEType: MIME_TYPES.DEFAULT, Attachments: [attachment] },
            });

            minimalCache();
            addToCache('MailSettings', { DraftMIMEType: MIME_TYPES.DEFAULT } as MailSettings);
            addApiKeys(true, toAddress, [toKeys]);

            const sendRequest = await send(composerID, false);

            expect(sendRequest.data.ExpirationTime).toBeUndefined();
            expect(sendRequest.data.ExpiresIn).toBeUndefined();

            const packages = sendRequest.data.Packages;
            const pack = packages['text/html'];
            const address = pack.Addresses[toAddress];

            const sessionKey = await decryptSessionKey(address.BodyKeyPacket, toKeys.privateKeys);

            expect(sessionKey).toBeDefined();

            const decryptResult = await decryptMessage(pack, toKeys.privateKeys, sessionKey);

            expect(decryptResult.data).toBe(`<img src="cid:${cid}">`);
        });
    });

    it('should not encrypt message with multiple keys', async () => {
        const { message, composerID } = prepareMessage({
            messageDocument: { plainText: 'test' },
            data: { MIMEType: MIME_TYPES.PLAINTEXT },
        });

        addKeysToAddressKeysCache(message.data.AddressID, secondFromKeys);
        addApiKeys(true, toAddress, [toKeys]);

        const sendRequest = await send(composerID);

        expect(sendRequest.data.ExpirationTime).toBeUndefined();
        expect(sendRequest.data.ExpiresIn).toBeUndefined();

        const packages = sendRequest.data.Packages;
        const pack = packages['text/plain'];
        const address = pack.Addresses[toAddress];

        const sessionKey = await decryptSessionKey(address.BodyKeyPacket, toKeys.privateKeys);
        const decryptResult = await decryptMessage(pack, toKeys.privateKeys, sessionKey);

        // Having 2 signatures here would meen we used both private keys to encrypt
        // It's not "wrong", it works with OpenPGP and API accept it
        // But other clients (Android, iOS, Bridge) don't support it so it's critical to use only one key
        expect(decryptResult.signatures.length).toBe(1);
    });

    it('should ensure rooster content before sending', async () => {
        const triggerEditorInput = (container: HTMLElement, content: string) => {
            const iframe = getByTestId(container, 'rooster-iframe') as HTMLIFrameElement;
            const editor = iframe.contentDocument?.getElementById(ROOSTER_EDITOR_ID);

            if (editor) {
                editor.innerHTML = content;
                fireEvent.input(editor);
            }
        };

        const content = 'test';
        const editorContent = 'editor-test';

        const { composerID } = prepareMessage({
            messageDocument: { document: createDocument(content) },
            data: { MIMEType: MIME_TYPES.DEFAULT },
        });

        minimalCache();
        addToCache('MailSettings', { DraftMIMEType: MIME_TYPES.DEFAULT } as MailSettings);
        addApiKeys(false, toAddress, []);

        const renderResult = await renderComposer(composerID, false);

        triggerEditorInput(renderResult.container, editorContent);
        addApiMock(`mail/v4/messages/${ID}`, ({ data: { Message } }) => ({ Message }), 'put');

        const sendRequest = await clickSend(renderResult);

        const packages = sendRequest.data.Packages;
        const pack = packages['text/html'];
        const sessionKey = readSessionKey(pack.BodyKey);
        const decryptResult = await decryptMessage(pack, fromKeys.privateKeys, sessionKey);

        expect(decryptResult.data).toBe(editorContent);
    });
});
