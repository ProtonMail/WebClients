import { MIME_TYPES } from '@proton/shared/lib/constants';
import { Address, MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';

import { data, fromFields, recipients } from '../../components/composer/quickReply/tests/QuickReply.test.data';
import { removeLineBreaks } from '../../components/composer/quickReply/tests/QuickReply.test.helpers';
import { addressID, messageID, subject } from '../../components/message/tests/Message.test.helpers';
import { MESSAGE_ACTIONS } from '../../constants';
import { MessageDecryption, MessageState } from '../../logic/messages/messagesTypes';
import { generateKeys, releaseCryptoProxy, setupCryptoProxyForTesting } from '../test/crypto';
import { clearAll } from '../test/helper';
import { createDocument } from '../test/message';
import { getContentWithBlockquotes, getContentWithoutBlockquotes } from './messageContent';
import { generateBlockquote } from './messageDraft';

const getMessage = (isPlainText: boolean, isReferenceMessage: boolean, content: string) => {
    return {
        localID: isReferenceMessage ? messageID : 'messageToCleanID',
        data: {
            ID: isReferenceMessage ? messageID : 'messageToCleanID',
            AddressID: addressID,
            Subject: subject,
            Sender: isReferenceMessage ? recipients.fromRecipient : recipients.meRecipient,
            ReplyTos: isReferenceMessage ? [recipients.fromRecipient] : [recipients.meRecipient],
            ToList: isReferenceMessage ? [recipients.meRecipient] : [recipients.fromRecipient],
            MIMEType: isPlainText ? MIME_TYPES.PLAINTEXT : MIME_TYPES.DEFAULT,
            Attachments: [] as Attachment[],
            Time: Date.now() / 1000,
        } as Message,
        decryption: {
            decryptedBody: content,
        } as MessageDecryption,
        messageDocument: {
            initialized: true,
            plainText: isPlainText ? content : undefined,
            document: isPlainText ? undefined : createDocument(content),
        },
    } as MessageState;
};

const getFakeNow = new Date(2021, 0, 1, 0, 0, 0);

describe('messageContent', () => {
    const mailSettings = {
        PMSignature: 1,
    } as MailSettings;

    const userSettings = {} as UserSettings;

    let addresses: Address[] = [];
    const plaintextReferenceMessageBody = 'Hello this is the reference message';
    const plaintextReplyContent = 'Hello this is the reply';
    const plainTextContent = `${plaintextReplyContent} ${data.protonSignature}
------- Original Message -------
On Friday, January 1st, 2021 at 12:00 AM, ${fromFields.fromName} <${fromFields.fromAddress}> wrote:


> ${plaintextReferenceMessageBody}`;

    const htmlReferenceMessageBody = '<div>Hello this is the reference message</div>';
    const htmlReplyContent = '<div>Hello this is the reply<div>';
    const htmlTextContent = `${htmlReplyContent} ${data.protonSignature}
<div class=\"protonmail_quote\">
        ------- Original Message -------<br>
        On Friday, January 1st, 2021 at 12:00 AM, ${fromFields.fromName} &lt;${fromFields.fromAddress}&gt; wrote:<br><br>
        <blockquote class=\"protonmail_quote\" type=\"cite\">
            <div>Hello this is the reference message</div>
        </blockquote><br>
    </div>`;

    describe('getContentWithoutBlockquotes', function () {
        beforeAll(async () => {
            await setupCryptoProxyForTesting();
        });

        afterAll(async () => {
            await releaseCryptoProxy();
        });

        beforeEach(async () => {
            jest.useFakeTimers('modern').setSystemTime(getFakeNow.getTime());

            const toKeys = await generateKeys('user', fromFields.meAddress);

            addresses = [
                {
                    Email: fromFields.meAddress,
                    HasKeys: 1,
                    ID: addressID,
                    Receive: 1,
                    Status: 1,
                    Send: 1,
                    Keys: [
                        {
                            Primary: 1,
                            PrivateKey: toKeys.privateKeyArmored,
                            PublicKey: toKeys.publicKeyArmored,
                        },
                    ],
                } as Address,
            ] as Address[];
        });

        afterEach(() => {
            clearAll();
            jest.useRealTimers();
        });

        it('should remove blockquotes from plaintext message', async () => {
            const referenceMessage = getMessage(true, true, plaintextReferenceMessageBody);
            const messageToClean = getMessage(true, false, plainTextContent);

            const contentWithoutBlockquotes = getContentWithoutBlockquotes(
                messageToClean,
                referenceMessage,
                mailSettings,
                userSettings,
                addresses,
                MESSAGE_ACTIONS.NEW
            );

            const expectedContent = `${plaintextReplyContent} ${data.protonSignature}`;

            // Only the content + the protonSignature should remain
            expect((contentWithoutBlockquotes || '').trim()).toEqual(expectedContent);
        });

        it('should remove blockquotes from HTML message', async () => {
            const referenceMessage = getMessage(false, true, htmlReferenceMessageBody);

            const messageToCleanBlockquotes = generateBlockquote(
                referenceMessage,
                mailSettings,
                userSettings,
                addresses,
                MESSAGE_ACTIONS.NEW
            );
            const messageToCleanBody = `${htmlReplyContent} ${data.protonSignature} ${messageToCleanBlockquotes}`;

            const messageToClean = getMessage(false, false, messageToCleanBody);

            const contentWithoutBlockquotes = getContentWithoutBlockquotes(
                messageToClean,
                referenceMessage,
                mailSettings,
                userSettings,
                addresses,
                MESSAGE_ACTIONS.NEW
            );

            const expectedContent = `${htmlReplyContent} ${data.protonSignature}`;
            // Only the content + the protonSignature should remain
            expect((contentWithoutBlockquotes || '').trim()).toEqual(expectedContent);
        });
    });

    describe('getContentWithBlockquotes', function () {
        beforeAll(async () => {
            await setupCryptoProxyForTesting();
        });

        afterAll(async () => {
            await releaseCryptoProxy();
        });

        beforeEach(async () => {
            jest.useFakeTimers('modern').setSystemTime(getFakeNow.getTime());
        });

        afterEach(() => {
            clearAll();
            jest.useRealTimers();
        });

        it('should generate content with blockquote string for a plaintext message', async () => {
            const referenceMessage = getMessage(true, true, plaintextReferenceMessageBody);

            const replyContent = `${plaintextReplyContent} ${data.protonSignature}`;
            const contentWithBlockquotes = getContentWithBlockquotes(
                replyContent,
                true,
                referenceMessage,
                mailSettings,
                userSettings,
                addresses,
                MESSAGE_ACTIONS.NEW
            );

            expect(removeLineBreaks(contentWithBlockquotes)).toEqual(removeLineBreaks(plainTextContent));
        });

        it('should generate content with blockquote string for an HTML message', async () => {
            const referenceMessage = getMessage(false, true, htmlReferenceMessageBody);

            const replyContent = `${htmlReplyContent} ${data.protonSignature}`;
            const contentWithBlockquotes = getContentWithBlockquotes(
                replyContent,
                false,
                referenceMessage,
                mailSettings,
                userSettings,
                addresses,
                MESSAGE_ACTIONS.NEW
            );

            expect(removeLineBreaks(contentWithBlockquotes)).toEqual(removeLineBreaks(htmlTextContent));
        });
    });
});
