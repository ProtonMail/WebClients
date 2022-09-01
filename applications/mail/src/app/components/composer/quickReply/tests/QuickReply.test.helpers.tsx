import { act, fireEvent } from '@testing-library/react';

import { ROOSTER_EDITOR_ID } from '@proton/components/components/editor/constants';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';

import { addApiMock } from '../../../../helpers/test/api';
import { addToCache, minimalCache } from '../../../../helpers/test/cache';
import { addApiKeys, addKeysToAddressKeysCache } from '../../../../helpers/test/crypto';
import { createDocument, encryptMessage } from '../../../../helpers/test/message';
import { MessageDecryption } from '../../../../logic/messages/messagesTypes';
import { initialize } from '../../../../logic/messages/read/messagesReadActions';
import { store } from '../../../../logic/store';
import { addressID, messageID, setup, subject } from '../../../message/tests/Message.test.helpers';

export const referenceMessageName = 'Reference-Message Name';
export const referenceMessageAddress = 'referenceMessage@protonmail.com';
export const userName = 'User Name';
export const userAddress = 'user@protonmail.com';

export const protonSignature = 'Sent with Proton Mail secure email.';
export const defaultReferenceMessageBody = 'Reference Message Body';

// Helper to make testing easier
export const removeLineBreaks = (text: string) => {
    return text.replaceAll(/\n/g, '');
};

export const getStateMessageFromParentID = (parentMessageID: string) => {
    const messagesFromCache = store.getState().messages;

    // search for message ID of message from parentID (The QR generated)
    const foundMessageID = Object.keys(messagesFromCache).find((id) => {
        return messagesFromCache[id]?.draftFlags?.ParentID === parentMessageID;
    });

    return foundMessageID ? messagesFromCache[foundMessageID] : undefined;
};

interface QuickReplyTestConfig {
    toKeys: any;
    fromKeys: any;
    referenceMessageBody?: string;
    isPlainText?: boolean;
}

export const setupQuickReplyTests = async ({
    toKeys,
    fromKeys,
    referenceMessageBody = defaultReferenceMessageBody,
    isPlainText,
}: QuickReplyTestConfig) => {
    minimalCache();
    addToCache('MailSettings', { PMSignature: 1, DraftMIMEType: MIME_TYPES.DEFAULT } as MailSettings); // Need to have the Proton signature by default in the QR
    addToCache('Addresses', [
        {
            ID: addressID,
            Email: userAddress,
            Receive: 1,
            Status: 1,
            Send: 1,
            HasKeys: true,
            Keys: [
                {
                    Primary: 1,
                    PrivateKey: toKeys.privateKeyArmored,
                    PublicKey: toKeys.publicKeyArmored,
                },
            ],
        },
    ]);

    addKeysToAddressKeysCache(addressID, toKeys);
    addApiKeys(true, referenceMessageAddress, []);
    addApiKeys(true, userAddress, [toKeys]);
    addApiMock('keys', () => ({}));

    const encryptedBody = await encryptMessage(referenceMessageBody, fromKeys, toKeys);

    const message = {
        localID: messageID,
        data: {
            ID: messageID,
            AddressID: addressID,
            Subject: subject,
            Sender: { Name: referenceMessageName, Address: referenceMessageAddress },
            ReplyTos: [{ Name: referenceMessageName, Address: referenceMessageAddress }],
            ToList: [{ Name: userName, Address: userAddress }],
            Body: encryptedBody, // todo check
            MIMEType: isPlainText ? MIME_TYPES.PLAINTEXT : MIME_TYPES.DEFAULT,
            Attachments: [] as Attachment[],
        } as Message,
        decryption: {
            decryptedBody: isPlainText ? referenceMessageBody : createDocument(referenceMessageBody),
        } as MessageDecryption,
        messageDocument: {
            initialized: true,
            plainText: isPlainText ? referenceMessageBody : undefined,
            document: isPlainText ? undefined : createDocument(referenceMessageBody),
        },
    };

    const expectedDefaultPlainTextContent = `Sent with Proton Mail secure email.
------- Original Message -------
On Thursday, January 1st, 1970 at 1:00 AM, ${referenceMessageName} <${referenceMessageAddress}> wrote:


> ${referenceMessageBody}`;

    store.dispatch(initialize(message));

    // Auto save mock
    const createCall = jest.fn(() => ({ Message: { ID: 'draftID', Attachments: [] } }));
    addApiMock(`mail/v4/messages`, createCall);

    const container = await setup({ conversationMode: true, message: message.data }, false);

    const getPlainTextEditor = async () => {
        return (await container.findByTestId('editor-textarea')) as HTMLTextAreaElement;
    };

    const getRoosterEditor = async () => {
        const iframe = container.getByTestId('rooster-iframe') as HTMLIFrameElement;
        return iframe.contentDocument?.getElementById(ROOSTER_EDITOR_ID);
    };

    const openQuickReply = async () => {
        await container.open();

        const quickReplyContainerButton = await container.findByTestId('quick-reply-container-button');

        // Open quick reply
        await act(async () => {
            fireEvent.click(quickReplyContainerButton);
        });
    };

    const updateQuickReplyContent = async (newContent: string) => {
        if (isPlainText) {
            const plainTextEditor = await getPlainTextEditor();

            if (plainTextEditor) {
                await act(async () => {
                    fireEvent.change(plainTextEditor, { target: { value: newContent } });
                    jest.advanceTimersByTime(2500);
                });
            }
        } else {
            const roosterEditor = await getRoosterEditor();
            if (roosterEditor) {
                await act(async () => {
                    // fireEvent.input will trigger an update inside the editor, but we need to add our content in it
                    // The first thing to do is add content in the editor by hand
                    // Then triggering input event will trigger the onChange in the composer, which will update the state etc....
                    // I'm totally cheating but the goal is only to check that the editor will receive new content such as the state
                    roosterEditor.innerHTML = `${newContent}${roosterEditor.innerHTML}`;

                    fireEvent.input(roosterEditor);
                    jest.advanceTimersByTime(2500);
                });
            }
        }
    };

    return {
        container,
        getPlainTextEditor,
        getRoosterEditor,
        createCall,
        openQuickReply,
        updateQuickReplyContent,
        expectedDefaultPlainTextContent,
    };
};
