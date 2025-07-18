import { findByText, screen } from '@testing-library/react';

import { getModelState } from '@proton/account/test';
import type { MessageKeys } from '@proton/mail/store/messages/messagesTypes';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';
import type { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';

import { constructMime } from '../../../helpers/send/sendMimeBuilder';
import { addApiContact } from '../../../helpers/test/contact';
import {
    fromGeneratedKeysToMessageKeys,
    getAddressKeyCache,
    getStoredUserKey,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '../../../helpers/test/crypto';
import type { GeneratedKey } from '../../../helpers/test/helper';
import {
    addApiKeys,
    addApiMock,
    api,
    assertIcon,
    clearAll,
    encryptMessage,
    generateKeys,
    getCompleteAddress,
} from '../../../helpers/test/helper';
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

        publicPrivateKey = fromGeneratedKeysToMessageKeys(toKeys);
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    afterEach(clearAll);

    describe('Decrypt and render', () => {
        it('html', async () => {
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

            const { open, container } = await setup(
                undefined,
                { conversationMode: true },
                {
                    preloadedState: {
                        addressKeys: getAddressKeyCache(getCompleteAddress({ ID: addressID }), [toKeys]),
                    },
                }
            );
            await open();

            const iframeContent = await getIframeRootDiv(container);

            await findByText(iframeContent, body);
        });

        it('plaintext', async () => {
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

            const { open, container } = await setup(
                undefined,
                {},
                {
                    preloadedState: {
                        addressKeys: getAddressKeyCache(getCompleteAddress({ ID: addressID }), [toKeys]),
                    },
                }
            );
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

            addApiKeys(false, fromAddress, []);

            const mimeBody = await constructMime(
                { localID, data: message, messageDocument: { document: parseStringToDOM(body).body } },
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

            const { open, container } = await setup(
                undefined,
                {},
                {
                    preloadedState: {
                        addressKeys: getAddressKeyCache(getCompleteAddress({ ID: addressID }), [toKeys]),
                    },
                }
            );
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

            const { open, container } = await setup(
                undefined,
                {},
                {
                    preloadedState: {
                        addressKeys: getAddressKeyCache(getCompleteAddress({ ID: addressID }), [toKeys]),
                    },
                }
            );
            await open();

            const iframeContent = await getIframeRootDiv(container);
            await findByText(iframeContent, body);
        });
    });

    describe('Signature verification', () => {
        it('verified sender internal', async () => {
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

            const { open } = await setup(
                undefined,
                {},
                {
                    preloadedState: {
                        userKeys: getModelState(getStoredUserKey(toKeys)),
                        addressKeys: getAddressKeyCache(getCompleteAddress({ ID: addressID }), [toKeys]),
                    },
                }
            );

            await open();

            const icon = await screen.findByTestId('encryption-icon');

            assertIcon(icon, 'lock-check-filled', 'color-info');
        });

        it('verified sender external', async () => {
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
                { localID, data: message, messageDocument: { document: parseStringToDOM(body).body } },
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

            const { open } = await setup(
                undefined,
                {},
                {
                    preloadedState: {
                        userKeys: getModelState(getStoredUserKey(toKeys)),
                        addressKeys: getAddressKeyCache(getCompleteAddress({ ID: addressID }), [toKeys]),
                    },
                }
            );

            await open();

            const icon = await screen.findByTestId('encryption-icon');

            assertIcon(icon, 'lock-check-filled', 'color-success');
        });

        it('signature verification error', async () => {
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

            const { open } = await setup(
                undefined,
                {},
                {
                    preloadedState: {
                        userKeys: getModelState(getStoredUserKey(toKeys)),
                        addressKeys: getAddressKeyCache(getCompleteAddress({ ID: addressID }), [toKeys]),
                    },
                }
            );

            await open();

            const icon = await screen.findByTestId('encryption-icon');
            assertIcon(icon, 'lock-exclamation-filled', 'color-info');
        });
    });
});
