import { fireEvent, getByTestId } from '@testing-library/react';
import loudRejection from 'loud-rejection';

import { getModelState } from '@proton/account/test';
import { ROOSTER_EDITOR_ID } from '@proton/components/components/editor/constants';
import type { MessageStateWithData } from '@proton/mail/store/messages/messagesTypes';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import type { AddressKey, MailSettings } from '@proton/shared/lib/interfaces';
import { SIGN } from '@proton/shared/lib/mail/mailSettings';

import type { MailState } from 'proton-mail/store/store';

import { arrayToBase64 } from '../../../helpers/base64';
import { addApiContact } from '../../../helpers/test/contact';
import type { GeneratedKey } from '../../../helpers/test/crypto';
import {
    addApiKeys,
    generateKeys,
    getAddressKeyCache,
    getStoredUserKey,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '../../../helpers/test/crypto';
import {
    addApiMock,
    clearAll,
    createAttachment,
    createEmbeddedImage,
    createMessageImages,
    decryptMessage,
    decryptMessageMultipart,
    decryptSessionKey,
    getCompleteAddress,
    minimalCache,
    parseDOMStringToBodyElement,
    readSessionKey,
} from '../../../helpers/test/helper';
import { addAttachment } from '../../../store/attachments/attachmentsActions';
import type { DecryptedAttachment } from '../../../store/attachments/attachmentsTypes';
import { ID, clickSend, getMessage, renderComposer, send } from './Composer.test.helpers';

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
    });

    const getPreloadedState = (addressID: string = AddressID) => {
        const address = getCompleteAddress({ ID: addressID, Email: fromAddress });

        return {
            mailSettings: getModelState({ DraftMIMEType: MIME_TYPES.DEFAULT } as MailSettings),
            userKeys: getModelState(getStoredUserKey(fromKeys)),
            addressKeys: getAddressKeyCache(address, [fromKeys]),
            addresses: getModelState([address]),
        };
    };

    const helper = async (message: MessageStateWithData, preloadedState: Partial<MailState>) => {
        const { store, ...rest } = await renderComposer({
            preloadedState: preloadedState,
            message,
        });
        return { sendRequest: await send(rest), ...rest };
    };

    describe('send plaintext', () => {
        it('text/plain clear', async () => {
            const message = getMessage({
                localID: ID,
                messageDocument: { plainText: 'test' },
                data: { MIMEType: MIME_TYPES.PLAINTEXT },
            });

            const preloadedState = getPreloadedState(message.data.AddressID);

            const { sendRequest } = await helper(message, preloadedState);

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
            const message = getMessage({
                messageDocument: { plainText: 'test' },
                data: { MIMEType: MIME_TYPES.PLAINTEXT, ToList: [{ Name: '', Address: fromAddress }] },
            });

            const preloadedState = getPreloadedState();
            minimalCache();

            const selfAddress = getCompleteAddress({
                ID: message.data.AddressID,
                Email: fromAddress,
                Receive: 1,
                HasKeys: 1,
                Keys: [
                    {
                        Primary: 1,
                        PrivateKey: fromKeys.privateKeyArmored,
                        PublicKey: fromKeys.publicKeyArmored,
                    } as AddressKey,
                ],
            });
            const { sendRequest } = await helper(message, {
                ...preloadedState,
                addresses: getModelState([selfAddress]),
                addressKeys: getAddressKeyCache(selfAddress, [fromKeys]),
            });

            expect(sendRequest.data.ExpirationTime).toBeUndefined();
            expect(sendRequest.data.ExpiresIn).toBeUndefined();

            const packages = sendRequest.data.Packages;
            const pack = packages['text/plain'];
            const fromAddressPackage = pack.Addresses[fromAddress];

            const sessionKey = await decryptSessionKey(fromAddressPackage.BodyKeyPacket, fromKeys.privateKeys);

            expect(sessionKey).toBeDefined();

            const decryptResult = await decryptMessage(pack, fromKeys.privateKeys, sessionKey);

            expect(decryptResult.data).toBe(message.messageDocument?.plainText);
        });

        it('text/plain pgp internal', async () => {
            const message = getMessage({
                messageDocument: { plainText: 'test' },
                data: { MIMEType: MIME_TYPES.PLAINTEXT },
            });

            addApiKeys(true, toAddress, [toKeys]);

            const { sendRequest } = await helper(message, getPreloadedState());

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
            const message = getMessage({
                messageDocument: { plainText: 'test' },
                data: { MIMEType: MIME_TYPES.PLAINTEXT },
            });

            addApiKeys(false, toAddress, [toKeys]);

            const { sendRequest } = await helper(message, getPreloadedState());

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

            const message = getMessage({
                messageDocument: { document: parseDOMStringToBodyElement(content) },
                data: { MIMEType: MIME_TYPES.DEFAULT },
            });

            minimalCache();
            addApiContact({ contactID: 'ContactID', email: toAddress, mimeType: MIME_TYPES.PLAINTEXT }, fromKeys);

            const preloadedState = getPreloadedState();
            const { sendRequest } = await helper(message, {
                ...preloadedState,
                mailSettings: getModelState({ DraftMIMEType: MIME_TYPES.DEFAULT } as MailSettings),
            });

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

            const message = getMessage({
                messageDocument: { document: parseDOMStringToBodyElement(content) },
                data: { MIMEType: MIME_TYPES.DEFAULT },
            });

            minimalCache();
            addApiContact({ contactID: 'ContactID', email: toAddress, mimeType: MIME_TYPES.PLAINTEXT }, fromKeys);

            const preloadedState = getPreloadedState();
            const { sendRequest } = await helper(message, {
                ...preloadedState,
                mailSettings: getModelState({
                    DraftMIMEType: MIME_TYPES.DEFAULT,
                    Sign: SIGN.ENABLED,
                } as MailSettings),
            });

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

            const message = getMessage({
                messageDocument: { document: parseDOMStringToBodyElement(content) },
                data: { MIMEType: MIME_TYPES.DEFAULT },
            });

            minimalCache();

            const preloadedState = getPreloadedState();
            const { sendRequest } = await helper(message, preloadedState);

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

            const message = getMessage({
                messageDocument: { document: parseDOMStringToBodyElement(content) },
                data: { MIMEType: MIME_TYPES.DEFAULT },
            });

            minimalCache();
            addApiKeys(true, toAddress, [toKeys]);

            const preloadedState = getPreloadedState();
            const { sendRequest } = await helper(message, preloadedState);

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

            const message = getMessage({
                messageDocument: { document: parseDOMStringToBodyElement(content) },
                data: { MIMEType: MIME_TYPES.DEFAULT },
            });

            minimalCache();
            addApiKeys(true, toAddress, [toKeys]);

            const preloadedState = getPreloadedState();
            const { sendRequest } = await helper(message, {
                ...preloadedState,
                mailSettings: getModelState({ DraftMIMEType: MIME_TYPES.PLAINTEXT } as MailSettings),
            });

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

            const message = getMessage({
                messageDocument: { document },
                data: { MIMEType: MIME_TYPES.DEFAULT },
            });

            minimalCache();
            addApiKeys(false, toAddress, [toKeys]);

            const preloadedState = getPreloadedState();
            const { sendRequest } = await helper(message, preloadedState);

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
            const message = getMessage({
                messageDocument: { document: parseDOMStringToBodyElement(content) },
                data: { MIMEType: MIME_TYPES.DEFAULT, Attachments: [attachment] },
            });

            minimalCache();
            addApiKeys(true, toAddress, [toKeys]);

            const preloadedState = getPreloadedState();
            const { sendRequest } = await helper(message, preloadedState);

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
            const message = getMessage({
                messageDocument: { document: parseDOMStringToBodyElement(content) },
                data: {
                    MIMEType: MIME_TYPES.DEFAULT,
                    Attachments: [attachment],
                },
            });

            addApiKeys(false, toAddress, [toKeys]);

            const preloadedState = getPreloadedState();
            const { store, ...rest } = await renderComposer({
                preloadedState: preloadedState,
                message,
                onStore: (store) => {
                    store.dispatch(
                        addAttachment({
                            ID: attachment.ID as string,
                            attachment: { data: attachment.data } as DecryptedAttachment,
                        })
                    );
                },
            });

            const sendRequest = await send(rest);

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

            const content = `<img src='${imageUrl}' data-embedded-img='cid:${cid}'>`;
            const document = window.document.createElement('div');
            document.innerHTML = content;

            const message = getMessage({
                messageDocument: { document },
                messageImages,
                data: { MIMEType: MIME_TYPES.DEFAULT, Attachments: [attachment] },
            });

            minimalCache();
            addApiKeys(true, toAddress, [toKeys]);

            const preloadedState = getPreloadedState();
            const { sendRequest } = await helper(message, preloadedState);

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
        const message = getMessage({
            messageDocument: { plainText: 'test' },
            data: { MIMEType: MIME_TYPES.PLAINTEXT },
        });

        addApiKeys(true, toAddress, [toKeys]);

        const addressWithTwoKeys = getCompleteAddress({
            ID: message.data.AddressID,
            Email: fromAddress,
            Keys: [{ ID: '1', Primary: 1 } as AddressKey, { ID: '2', Primary: 0 } as AddressKey],
        });

        const preloadedState = getPreloadedState();
        const { sendRequest } = await helper(message, {
            ...preloadedState,
            addressKeys: {
                ...preloadedState.addressKeys,
                ...getAddressKeyCache(addressWithTwoKeys, [fromKeys, secondFromKeys]),
            },
        });

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

        minimalCache();
        addApiKeys(false, toAddress, []);

        const message = getMessage({
            messageDocument: { document: parseDOMStringToBodyElement(content) },
            data: { MIMEType: MIME_TYPES.DEFAULT },
        });

        const preloadedState = getPreloadedState();
        const view = await renderComposer({ preloadedState, message });

        triggerEditorInput(view.container, editorContent);
        addApiMock(`mail/v4/messages/${ID}`, ({ data: { Message } }) => ({ Message }), 'put');

        const sendRequest = await clickSend(view);

        const packages = sendRequest.data.Packages;
        const pack = packages['text/html'];
        const sessionKey = readSessionKey(pack.BodyKey);
        const decryptResult = await decryptMessage(pack, fromKeys.privateKeys, sessionKey);

        expect(decryptResult.data).toBe(editorContent);
    });
});
