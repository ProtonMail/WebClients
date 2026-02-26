import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import { parseDOMStringToBodyElement } from '@proton/mail/helpers/parseDOMStringToBodyElement';
import type { MessageDecryption, MessageState } from '@proton/mail/store/messages/messagesTypes';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import type { Address, MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import type { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { PM_SIGNATURE } from '@proton/shared/lib/mail/mailSettings';

import { fromFields, protonSignature, recipients } from 'proton-mail/components/composer/tests/Composer.test.data';

import { addressID, messageID, subject } from '../../components/message/tests/Message.test.helpers';
import { generateKeys, releaseCryptoProxy, setupCryptoProxyForTesting } from '../test/crypto';
import { clearAll, removeLineBreaks } from '../test/helper';
import { generateBlockquote } from './draftContent/html';
import { getContentWithBlockquotes, getContentWithoutBlockquotes, isMessageContentEmpty } from './messageContent';

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
            document: isPlainText ? undefined : parseDOMStringToBodyElement(content),
        },
    } as MessageState;
};

const getFakeNow = new Date(2021, 0, 1, 0, 0, 0);

describe('messageContent', () => {
    const mailSettings = {
        PMSignature: PM_SIGNATURE.ENABLED,
    } as MailSettings;

    const userSettings = {} as UserSettings;

    let addresses: Address[] = [];
    const plaintextReferenceMessageBody = 'Hello this is the reference message';
    const plaintextReplyContent = 'Hello this is the reply';
    const plainTextContent = `${plaintextReplyContent} ${protonSignature}
On Friday, January 1st, 2021 at 12:00 AM, ${fromFields.fromName} <${fromFields.fromAddress}> wrote:

> ${plaintextReferenceMessageBody}`;

    const htmlReferenceMessageBody = '<div>Hello this is the reference message</div>';
    const htmlReplyContent = '<div>Hello this is the reply<div>';
    const htmlTextContent = `${htmlReplyContent} ${protonSignature}
<div class=\"protonmail_quote\">
        On Friday, January 1st, 2021 at 12:00 AM, ${fromFields.fromName} &lt;${fromFields.fromAddress}&gt; wrote:<br>
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
            jest.useFakeTimers().setSystemTime(getFakeNow.getTime());

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
                addresses,
                MESSAGE_ACTIONS.NEW
            );
            const messageToCleanBody = `${htmlReplyContent} ${protonSignature} ${messageToCleanBlockquotes}`;

            const messageToClean = getMessage(false, false, messageToCleanBody);

            const contentWithoutBlockquotes = getContentWithoutBlockquotes(
                messageToClean,
                referenceMessage,
                mailSettings,
                userSettings,
                addresses,
                MESSAGE_ACTIONS.NEW
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

        beforeEach(async () => {
            jest.useFakeTimers().setSystemTime(getFakeNow.getTime());
        });

        afterEach(() => {
            clearAll();
            jest.useRealTimers();
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
                addresses,
                MESSAGE_ACTIONS.NEW
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
                addresses,
                MESSAGE_ACTIONS.NEW
            );

            expect(removeLineBreaks(contentWithBlockquotes)).toEqual(removeLineBreaks(htmlTextContent));
        });
    });

    describe('isMessageContentEmpty', () => {
        describe('empty content', () => {
            it('should be true when content is empty', () => {
                const content = '';
                expect(isMessageContentEmpty(content, true)).toBeTruthy();
                expect(isMessageContentEmpty(content, false)).toBeTruthy();
            });

            it('should be true when content contains spaces only', () => {
                const content = '       ';
                expect(isMessageContentEmpty(content, true)).toBeTruthy();
                expect(isMessageContentEmpty(content, false)).toBeTruthy();
            });

            it('should be true when HTML content is not readable', () => {
                const content = `<div><hr/></div>`;
                expect(isMessageContentEmpty(content, false)).toBeTruthy();
            });

            it('should be true when HTML contains only empty tags and whitespace', () => {
                const content = `<div><p></p><span>   </span><br/></div>`;
                expect(isMessageContentEmpty(content, false)).toBeTruthy();
            });

            it('should be true when HTML content contains only &nbsp;', () => {
                const content = `<div>&nbsp;&nbsp;&nbsp;</div>`;
                expect(isMessageContentEmpty(content, false)).toBeTruthy();
            });

            it('should be true when HTML content contains only HTML comments', () => {
                const content = `<!-- some comment --><div></div>`;
                expect(isMessageContentEmpty(content, false)).toBeTruthy();
            });
        });

        describe('contains text', () => {
            it('should be false when content contains plain text', () => {
                const content = '       hey   ';
                expect(isMessageContentEmpty(content, true)).toBeFalsy();
                expect(isMessageContentEmpty(content, false)).toBeFalsy();
            });

            it('should be false when HTML content contains text', () => {
                const content = `<div>Some content</div>`;
                expect(isMessageContentEmpty(content, false)).toBeFalsy();
            });
        });

        describe('contains media', () => {
            it('should be false when HTML content contains image placeholders', () => {
                const content = `<div><span class="proton-image-anchor" data-proton-embedded="id1"></span></div>`;
                expect(isMessageContentEmpty(content, false)).toBeFalsy();
            });

            it('should be false when HTML content contains inline style with url()', () => {
                const content = `<div style="background-image: url('https://image.jpg')"></div>`;
                expect(isMessageContentEmpty(content, false)).toBeFalsy();
            });
        });

        describe('contains links', () => {
            it('should be false when HTML content contains a link', () => {
                const content = `<div><a href="https://example.com"></a></div>`;
                expect(isMessageContentEmpty(content, false)).toBeFalsy();
            });

            it('should be false when HTML content contains a link wrapping media', () => {
                const content = `<div><a href="https://example.com"><span class="proton-image-anchor" data-proton-remote="id1"></span></a></div>`;
                expect(isMessageContentEmpty(content, false)).toBeFalsy();
            });
        });

        describe('contains tables', () => {
            it('should be false when HTML content contains a table', () => {
                const content = `<table><tr><td></td></tr></table>`;
                expect(isMessageContentEmpty(content, false)).toBeFalsy();
            });
        });
    });
});
