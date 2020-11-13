import React, { MutableRefObject } from 'react';
import { Attachment, Message } from 'proton-shared/lib/interfaces/mail/Message';
import { MailSettings } from 'proton-shared/lib/interfaces';
import { waitFor } from '@testing-library/dom';
import { act } from '@testing-library/react';
import { MIME_TYPES } from 'proton-shared/lib/constants';
import {
    render,
    clearAll,
    addApiMock,
    generateKeys,
    addKeysToAddressKeysCache,
    encryptMessage,
    GeneratedKey,
    api,
    attachmentsCache,
} from '../../helpers/test/helper';
import MessageView, { MessageViewRef } from './MessageView';
import { Breakpoints } from '../../models/utils';
import * as messageDecrypt from '../../helpers/message/messageDecrypt';
import { constructMime } from '../../helpers/send/sendMimeBuilder';
import { parseInDiv } from '../../helpers/dom';

jest.setTimeout(10000);

const localID = 'localID';
const labelID = 'labelID';
const messageID = 'messageID';
const addressID = 'addressID';
const subject = 'Test subject';
const body = 'Test body';

type MessageViewProps = Parameters<typeof MessageView>[0];

const defaultProps: MessageViewProps = {
    labelID,
    conversationMode: true,
    loading: false,
    labels: [],
    message: { ID: messageID } as Message,
    mailSettings: {} as MailSettings,
    onBack: jest.fn(),
    onCompose: jest.fn(),
    breakpoints: {} as Breakpoints,
};

const setup = async (specificProps: Partial<MessageViewProps> = {}) => {
    const props = { ...defaultProps, specificProps };

    const ref = { current: null } as MutableRefObject<MessageViewRef | null>;
    const refCallback = (refValue: MessageViewRef) => {
        ref.current = refValue;
    };

    const renderResult = await render(<MessageView ref={refCallback} {...props} />);

    const open = async () => {
        jest.spyOn(messageDecrypt, 'decryptMessage');

        const container = renderResult.getByTestId('message-view');
        container.scrollIntoView = jest.fn();

        void (await act(async () => {
            ref.current?.open();
            // Message decryption can take a bit of time and can be on another thread than the test
            // By waiting on the completion of the decryption, we ensure not to continue too early
            await waitFor(() => expect(messageDecrypt.decryptMessage).toHaveBeenCalled());
        }));
    };

    return { ...renderResult, ref, open };
};

describe('MessageView', () => {
    const toAddress = 'me@home.net';

    let toKeys: GeneratedKey;

    beforeAll(async () => {
        toKeys = await generateKeys('me', toAddress);
    });

    afterEach(clearAll);

    describe('Decrypt and render', () => {
        it('html', async () => {
            addKeysToAddressKeysCache(addressID, toKeys);

            const encryptedBody = await encryptMessage(body, toKeys);

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

            const { open, findByText } = await setup();

            await open();

            await findByText(body);
        });

        it('plaintext', async () => {
            addKeysToAddressKeysCache(addressID, toKeys);

            const encryptedBody = await encryptMessage(body, toKeys);

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
                attachmentsCache,
                api,
                false
            );

            const encryptedBody = await encryptMessage(mimeBody, toKeys);

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
                attachmentsCache,
                api,
                false
            );

            const encryptedBody = await encryptMessage(mimeBody, toKeys);

            addApiMock(`mail/v4/messages/${messageID}`, () => ({
                Message: { ...message, Body: encryptedBody },
            }));

            const { open, findByText } = await setup();

            await open();

            await findByText(body);
        });
    });

    // TODO
    // describe('Message display modes', () => {
    //     it('loading mode', async () => {});
    //     it('encrypted mode', async () => {});
    //     it('source mode', async () => {});
    // });

    // TODO
    // describe('Signature verification', () => {
    //     it('verified sender', async () => {});
    //     it('verification error', async () => {});
    //     it('trust key banner', async () => {});
    // });
});
