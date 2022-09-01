import { MIME_TYPES } from '@proton/shared/lib/constants';
import { Address, MailSettings, Recipient, UserSettings } from '@proton/shared/lib/interfaces';
import { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';

import {
    protonSignature,
    referenceMessageAddress,
    referenceMessageName,
    removeLineBreaks,
    userAddress,
    userName,
} from '../../components/composer/quickReply/tests/QuickReply.test.helpers';
import { addressID, messageID, subject } from '../../components/message/tests/Message.test.helpers';
import { MessageDecryption, MessageState } from '../../logic/messages/messagesTypes';
import { generateKeys, releaseCryptoProxy, setupCryptoProxyForTesting } from '../test/crypto';
import { createDocument } from '../test/message';
import { getContentWithBlockquotes, getContentWithoutBlockquotes } from './messageContent';
import { generateBlockquote } from './messageDraft';

const getMessage = (isPlainText: boolean, isReferenceMessage: boolean, content: string) => {
    const userRecipient = { Name: userName, Address: userAddress } as Recipient;
    const referenceRecipient = { Name: referenceMessageName, Address: referenceMessageAddress } as Recipient;
    return {
        localID: isReferenceMessage ? messageID : 'messageToCleanID',
        data: {
            ID: isReferenceMessage ? messageID : 'messageToCleanID',
            AddressID: addressID,
            Subject: subject,
            Sender: isReferenceMessage ? referenceRecipient : userRecipient,
            ReplyTos: isReferenceMessage ? [referenceRecipient] : [userRecipient],
            ToList: isReferenceMessage ? [userRecipient] : [referenceRecipient],
            MIMEType: isPlainText ? MIME_TYPES.PLAINTEXT : MIME_TYPES.DEFAULT,
            Attachments: [] as Attachment[],
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

describe('messageContent', () => {
    const mailSettings = {
        PMSignature: 1,
    } as MailSettings;

    const userSettings = {} as UserSettings;

    let addresses: Address[] = [];
    const plaintextReferenceMessageBody = 'Hello this is the reference message';
    const plaintextReplyContent = 'Hello this is the reply';
    const plainTextContent = `${plaintextReplyContent} ${protonSignature}
------- Original Message -------
On Thursday, January 1st, 1970 at 1:00 AM, ${referenceMessageName} <${referenceMessageAddress}> wrote:


> ${plaintextReferenceMessageBody}`;

    const htmlReferenceMessageBody = '<div>Hello this is the reference message</div>';
    const htmlReplyContent = '<div>Hello this is the reply<div>';
    const htmlTextContent = `${htmlReplyContent} ${protonSignature}
<div class=\"protonmail_quote\">
        ------- Original Message -------<br>
        On Thursday, January 1st, 1970 at 1:00 AM, Reference-Message Name &lt;referenceMessage@protonmail.com&gt; wrote:<br><br>
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
            const toKeys = await generateKeys('user', userAddress);

            addresses = [
                {
                    Email: userAddress,
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

        it('should remove blockquotes from plaintext message', async () => {
            const referenceMessage = getMessage(true, true, plaintextReferenceMessageBody);
            const messageToClean = getMessage(true, false, plainTextContent);

            const contentWithoutBlockquotes = getContentWithoutBlockquotes(
                messageToClean,
                referenceMessage,
                mailSettings,
                userSettings,
                addresses
            );

            const expectedContent = `${plaintextReplyContent} ${protonSignature}`;

            // Only the content + the protonSignature should remain
            expect((contentWithoutBlockquotes || '').trim()).toEqual(expectedContent);
        });

        it('should remove blockquotes from HTML message', async () => {
            const referenceMessage = getMessage(false, true, htmlReferenceMessageBody);

            const messageToCleanBlockquotes = generateBlockquote(
                referenceMessage,
                mailSettings,
                userSettings,
                addresses
            );
            const messageToCleanBody = `${htmlReplyContent} ${protonSignature} ${messageToCleanBlockquotes}`;

            const messageToClean = getMessage(false, false, messageToCleanBody);

            const contentWithoutBlockquotes = getContentWithoutBlockquotes(
                messageToClean,
                referenceMessage,
                mailSettings,
                userSettings,
                addresses
            );

            const expectedContent = `${htmlReplyContent} ${protonSignature}`;
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

        it('should generate content with blockquote string for a plaintext message', async () => {
            const referenceMessage = getMessage(true, true, plaintextReferenceMessageBody);

            const replyContent = `${plaintextReplyContent} ${protonSignature}`;
            const contentWithBlockquotes = getContentWithBlockquotes(
                replyContent,
                true,
                referenceMessage,
                mailSettings,
                userSettings,
                addresses
            );

            expect(removeLineBreaks(contentWithBlockquotes)).toEqual(removeLineBreaks(plainTextContent));
        });

        it('should generate content with blockquote string for an HTML message', async () => {
            const referenceMessage = getMessage(false, true, htmlReferenceMessageBody);

            const replyContent = `${htmlReplyContent} ${protonSignature}`;
            const contentWithBlockquotes = getContentWithBlockquotes(
                replyContent,
                false,
                referenceMessage,
                mailSettings,
                userSettings,
                addresses
            );

            expect(removeLineBreaks(contentWithBlockquotes)).toEqual(removeLineBreaks(htmlTextContent));
        });
    });
});
