import { Attachment, Message } from 'proton-shared/lib/interfaces/mail/Message';
import { MIME_TYPES } from 'proton-shared/lib/constants';
import {
    clearAll,
    addApiMock,
    generateKeys,
    addKeysToAddressKeysCache,
    encryptMessage,
    GeneratedKey,
    api,
    attachmentsCache,
    addApiKeys,
    addKeysToUserKeysCache,
    assertIcon,
} from '../../../helpers/test/helper';
import { constructMime } from '../../../helpers/send/sendMimeBuilder';
import { parseInDiv } from '../../../helpers/dom';
import { X_PM_HEADERS } from '../../../models/crypto';
import { addApiContact } from '../../../helpers/test/contact';
import { localID, addressID, body, messageID, setup, subject } from './Message.test.helpers';

jest.setTimeout(20000);

describe('MessageView encryption', () => {
    const toAddress = 'me@home.net';
    const fromAddress = 'someone@somewhere.net';
    const otherAddress = 'other@somewhere.net';

    let toKeys: GeneratedKey;
    let fromKeys: GeneratedKey;
    let otherKeys: GeneratedKey;

    beforeAll(async () => {
        toKeys = await generateKeys('me', toAddress);
        fromKeys = await generateKeys('someone', fromAddress);
        otherKeys = await generateKeys('other', otherAddress);
    });

    afterEach(clearAll);

    describe('Decrypt and render', () => {
        it('html', async () => {
            addKeysToAddressKeysCache(addressID, toKeys);

            const encryptedBody = await encryptMessage(body, fromKeys, toKeys);

            addApiMock(`mail/v4/messages/${messageID}`, () => ({
                Message: {
                    ID: messageID,
                    AddressID: addressID,
                    Subject: subject,
                    Body: encryptedBody,
                    MIMEType: MIME_TYPES.DEFAULT,
                    Attachments: [] as Attachment[],
                } as Message,
            }));

            const { open, findByText } = await setup({ conversationMode: true });

            await open();

            await findByText(body);
        });

        it('plaintext', async () => {
            addKeysToAddressKeysCache(addressID, toKeys);

            const encryptedBody = await encryptMessage(body, fromKeys, toKeys);

            addApiMock(`mail/v4/messages/${messageID}`, () => ({
                Message: {
                    ID: messageID,
                    AddressID: addressID,
                    Subject: subject,
                    Body: encryptedBody,
                    MIMEType: MIME_TYPES.PLAINTEXT,
                    Attachments: [] as Attachment[],
                } as Message,
            }));

            const { open, findByText } = await setup();

            await open();

            await findByText(body);
        });

        it('multipart/mixed html', async () => {
            const message = {
                ID: messageID,
                AddressID: addressID,
                Subject: subject,
                MIMEType: MIME_TYPES.MIME,
                Attachments: [] as Attachment[],
            } as Message;

            addKeysToAddressKeysCache(addressID, toKeys);

            const mimeBody = await constructMime(
                { localID, data: message, document: parseInDiv(body) },
                toKeys,
                attachmentsCache,
                api,
                false
            );

            const encryptedBody = await encryptMessage(mimeBody, fromKeys, toKeys);

            addApiMock(`mail/v4/messages/${messageID}`, () => ({
                Message: { ...message, Body: encryptedBody },
            }));

            const { open, findByText } = await setup();

            await open();

            await findByText(body);
        });

        it('multipart/mixed plaintext', async () => {
            const message = {
                ID: messageID,
                AddressID: addressID,
                Subject: subject,
                MIMEType: MIME_TYPES.MIME,
                Attachments: [] as Attachment[],
            } as Message;

            addKeysToAddressKeysCache(addressID, toKeys);

            const mimeBody = await constructMime(
                { localID, data: { ...message, MIMEType: MIME_TYPES.PLAINTEXT }, plainText: body },
                toKeys,
                attachmentsCache,
                api,
                false
            );

            const encryptedBody = await encryptMessage(mimeBody, fromKeys, toKeys);

            addApiMock(`mail/v4/messages/${messageID}`, () => ({
                Message: { ...message, Body: encryptedBody },
            }));

            const { open, findByText } = await setup();

            await open();

            await findByText(body);
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

            assertIcon(icon, 'shape-locks-check', 'color-info');
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
                { localID, data: message, document: parseInDiv(body) },
                toKeys,
                attachmentsCache,
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

            assertIcon(icon, 'shape-locks-check', 'color-success');
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

            assertIcon(icon, 'shape-locks-warning', 'color-info');
        });
    });
});
