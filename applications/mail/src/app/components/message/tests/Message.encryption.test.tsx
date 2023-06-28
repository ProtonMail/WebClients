import { findByText } from '@testing-library/react';

import { MIME_TYPES } from '@proton/shared/lib/constants';
import { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';

import { parseInDiv } from '../../../helpers/dom';
import { constructMime } from '../../../helpers/send/sendMimeBuilder';
import { addApiContact } from '../../../helpers/test/contact';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../helpers/test/crypto';
import {
    GeneratedKey,
    addApiKeys,
    addApiMock,
    addKeysToAddressKeysCache,
    addKeysToUserKeysCache,
    api,
    assertIcon,
    clearAll,
    encryptMessage,
    generateKeys,
} from '../../../helpers/test/helper';
import { MessageKeys } from '../../../logic/messages/messagesTypes';
import { X_PM_HEADERS } from '../../../models/crypto';
import { addressID, body, getIframeRootDiv, localID, messageID, setup, subject } from './Message.test.helpers';

jest.setTimeout(20000);

describe('MessageView encryption', () => {
    const toAddress = 'me@home.net';
    const fromName = 'someone';
    const fromAddress = 'someone@somewhere.net';
    const otherAddress = 'other@somewhere.net';

    let toKeys: GeneratedKey;
    let fromKeys: GeneratedKey;
    let otherKeys: GeneratedKey;
    let publicPrivateKey: MessageKeys;

    beforeAll(async () => {
        await setupCryptoProxyForTesting();

        toKeys = await generateKeys('me', toAddress);
        fromKeys = await generateKeys('someone', fromAddress);
        otherKeys = await generateKeys('other', otherAddress);

        publicPrivateKey = {
            type: 'publicPrivate',
            publicKeys: toKeys.publicKeys,
            privateKeys: toKeys.privateKeys,
        };
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    afterEach(clearAll);

    describe('Decrypt and render', () => {
        it('html', async () => {
            addKeysToAddressKeysCache(addressID, toKeys);
            addApiKeys(false, fromAddress, []);

            const encryptedBody = await encryptMessage(body, fromKeys, toKeys);

            addApiMock(`mail/v4/messages/${messageID}`, () => ({
                Message: {
                    ID: messageID,
                    AddressID: addressID,
                    Subject: subject,
                    Sender: { Name: fromName, Address: fromAddress },
                    Body: encryptedBody,
                    MIMEType: MIME_TYPES.DEFAULT,
                    Attachments: [] as Attachment[],
                } as Message,
            }));

            const { open, container } = await setup({ conversationMode: true });
            await open();

            const iframeContent = await getIframeRootDiv(container);

            await findByText(iframeContent, body);
        });

        it('plaintext', async () => {
            addKeysToAddressKeysCache(addressID, toKeys);
            addApiKeys(false, fromAddress, []);

            const encryptedBody = await encryptMessage(body, fromKeys, toKeys);

            addApiMock(`mail/v4/messages/${messageID}`, () => ({
                Message: {
                    ID: messageID,
                    AddressID: addressID,
                    Subject: subject,
                    Sender: { Name: fromName, Address: fromAddress },
                    Body: encryptedBody,
                    MIMEType: MIME_TYPES.PLAINTEXT,
                    Attachments: [] as Attachment[],
                } as Message,
            }));

            const { open, container } = await setup();
            await open();

            const iframeContent = await getIframeRootDiv(container);

            await findByText(iframeContent, body);
        });

        it('multipart/mixed html', async () => {
            const message = {
                ID: messageID,
                AddressID: addressID,
                Subject: subject,
                Sender: { Name: fromName, Address: fromAddress },
                MIMEType: MIME_TYPES.MIME,
                Attachments: [] as Attachment[],
            } as Message;

            addKeysToAddressKeysCache(addressID, toKeys);
            addApiKeys(false, fromAddress, []);

            const mimeBody = await constructMime(
                { localID, data: message, messageDocument: { document: parseInDiv(body) } },
                publicPrivateKey,
                jest.fn(),
                jest.fn(),
                api,
                false
            );

            const encryptedBody = await encryptMessage(mimeBody, fromKeys, toKeys);

            addApiMock(`mail/v4/messages/${messageID}`, () => ({
                Message: { ...message, Body: encryptedBody },
            }));

            const { open, container } = await setup();
            await open();

            const iframeContent = await getIframeRootDiv(container);
            await findByText(iframeContent, body);
        });

        it('multipart/mixed plaintext', async () => {
            const message = {
                ID: messageID,
                AddressID: addressID,
                Subject: subject,
                Sender: { Name: fromName, Address: fromAddress },
                MIMEType: MIME_TYPES.MIME,
                Attachments: [] as Attachment[],
            } as Message;

            addKeysToAddressKeysCache(addressID, toKeys);
            addApiKeys(false, fromAddress, []);

            const mimeBody = await constructMime(
                { localID, data: { ...message, MIMEType: MIME_TYPES.PLAINTEXT }, messageDocument: { plainText: body } },
                publicPrivateKey,
                jest.fn(),
                jest.fn(),
                api,
                false
            );

            const encryptedBody = await encryptMessage(mimeBody, fromKeys, toKeys);

            addApiMock(`mail/v4/messages/${messageID}`, () => ({
                Message: { ...message, Body: encryptedBody },
            }));

            const { open, container } = await setup();
            await open();

            const iframeContent = await getIframeRootDiv(container);
            await findByText(iframeContent, body);
        });
    });

    describe('Signature verification', () => {
        it('verified sender internal', async () => {
            addKeysToAddressKeysCache(addressID, toKeys);
            addKeysToUserKeysCache(toKeys);
            addApiKeys(true, fromAddress, [fromKeys]);
            addApiContact({ contactID: 'contactID', email: fromAddress, pinKey: fromKeys }, toKeys);

            const encryptedBody = await encryptMessage(body, fromKeys, toKeys);

            addApiMock(`mail/v4/messages/${messageID}`, () => ({
                Message: {
                    ID: messageID,
                    AddressID: addressID,
                    Sender: {
                        Name: fromName,
                        Address: fromAddress,
                    },
                    Subject: subject,
                    Body: encryptedBody,
                    MIMEType: MIME_TYPES.DEFAULT,
                    Attachments: [] as Attachment[],
                    ParsedHeaders: {
                        'X-Pm-Origin': X_PM_HEADERS.INTERNAL,
                        'X-Pm-Content-Encryption': X_PM_HEADERS.END_TO_END,
                    } as any,
                    Time: new Date().getTime(),
                } as Message,
            }));

            const { open, findByTestId } = await setup();

            await open();

            const icon = await findByTestId('encryption-icon');

            assertIcon(icon, 'lock-check-filled', 'color-info');
        });

        it('verified sender external', async () => {
            addKeysToAddressKeysCache(addressID, toKeys);
            addKeysToUserKeysCache(toKeys);
            addApiKeys(false, fromAddress, [fromKeys]);
            addApiContact({ contactID: 'contactID', email: fromAddress, pinKey: fromKeys }, toKeys);

            const message = {
                ID: messageID,
                AddressID: addressID,
                Sender: {
                    Address: fromAddress,
                },
                Subject: subject,
                MIMEType: MIME_TYPES.DEFAULT,
                Attachments: [] as Attachment[],
                ParsedHeaders: {
                    'X-Pm-Origin': X_PM_HEADERS.EXTERNAL,
                    'X-Pm-Content-Encryption': X_PM_HEADERS.END_TO_END,
                } as any,
                Time: new Date().getTime(),
            } as Message;

            const mimeBody = await constructMime(
                { localID, data: message, messageDocument: { document: parseInDiv(body) } },
                publicPrivateKey,
                jest.fn(),
                jest.fn(),
                api,
                false
            );

            const encryptedBody = await encryptMessage(mimeBody, fromKeys, toKeys);

            addApiMock(`mail/v4/messages/${messageID}`, () => ({
                Message: { ...message, Body: encryptedBody },
            }));

            const { open, findByTestId } = await setup();

            await open();

            const icon = await findByTestId('encryption-icon');

            assertIcon(icon, 'lock-check-filled', 'color-success');
        });

        it('signature verification error', async () => {
            addKeysToAddressKeysCache(addressID, toKeys);
            addKeysToUserKeysCache(toKeys);
            addApiKeys(true, fromAddress, []);
            addApiContact({ contactID: 'contactID', email: fromAddress, pinKey: otherKeys }, toKeys);

            const encryptedBody = await encryptMessage(body, fromKeys, toKeys);

            addApiMock(`mail/v4/messages/${messageID}`, () => ({
                Message: {
                    ID: messageID,
                    AddressID: addressID,
                    Sender: {
                        Name: fromName,
                        Address: fromAddress,
                    },
                    Subject: subject,
                    Body: encryptedBody,
                    MIMEType: MIME_TYPES.DEFAULT,
                    Attachments: [] as Attachment[],
                    ParsedHeaders: {
                        'X-Pm-Origin': X_PM_HEADERS.INTERNAL,
                        'X-Pm-Content-Encryption': X_PM_HEADERS.END_TO_END,
                    } as any,
                    Time: new Date().getTime(),
                } as Message,
            }));

            const { open, findByTestId } = await setup();

            await open();

            const icon = await findByTestId('encryption-icon');

            assertIcon(icon, 'lock-exclamation-filled', 'color-info');
        });
    });
});
