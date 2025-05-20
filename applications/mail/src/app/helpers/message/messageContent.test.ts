import { PROXY_IMG_URL } from '@proton/shared/lib/api/images';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import type { Address, MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import type { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { PM_SIGNATURE } from '@proton/shared/lib/mail/mailSettings';

import { fromFields, protonSignature, recipients } from 'proton-mail/components/composer/tests/Composer.test.data';

import { addressID, messageID, subject } from '../../components/message/tests/Message.test.helpers';
import { MESSAGE_ACTIONS } from '../../constants';
import type { MessageDecryption, MessageState } from '../../store/messages/messagesTypes';
import { generateKeys, releaseCryptoProxy, setupCryptoProxyForTesting } from '../test/crypto';
import { clearAll, removeLineBreaks } from '../test/helper';
import { createDocument } from '../test/message';
import {
    cleanProxyImagesFromClipboardContent,
    getContentWithBlockquotes,
    getContentWithoutBlockquotes,
} from './messageContent';
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

    describe('cleanProxyImagesFromClipboardContent', () => {
        const mockSetData = jest.fn();
        const mockClipboardEvent: ClipboardEvent = {
            clipboardData: {
                setData: mockSetData,
            },
            preventDefault: jest.fn(),
        } as any;
        const mockDragEvent: DragEvent = {
            dataTransfer: {
                setData: mockSetData,
            },
        } as any;

        // Get selection from html content (as string)
        const setup = (content: string) => {
            const container = document.createElement('div');
            container.innerHTML = content;
            document.body.appendChild(container);

            const range = document.createRange();
            range.selectNodeContents(container);

            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
            }

            return selection!;
        };

        beforeEach(() => {
            clearAll();
        });

        it('should replace images proxy urls with original urls from copied content [copy event]', () => {
            const content = `<div xmlns="http://www.w3.org/1999/xhtml">
<p>Text before images</p>
<img src="https://mail.proton.me/api/${PROXY_IMG_URL}?Url=https://image.com/image.png&DryRun=1">
<p>Text in the middle</p>
<img src="https://image.com/image.png">
<p>Text after images</p>
</div>`;
            const selection = setup(content);
            cleanProxyImagesFromClipboardContent('copy', mockClipboardEvent, selection);

            const expectedHTMLSelection = `<div xmlns="http://www.w3.org/1999/xhtml">
<p>Text before images</p>
<img src="https://image.com/image.png">
<p>Text in the middle</p>
<img src="https://image.com/image.png">
<p>Text after images</p>
</div>`;

            const expectedPlainSelection = `Text before images\n\nText in the middle\n\nText after images`;

            expect(mockSetData.mock.calls[0][0]).toEqual('text/html');
            expect(mockSetData.mock.calls[0][1]).toEqual(expectedHTMLSelection);

            expect(mockSetData.mock.calls[1][0]).toEqual('text/plain');
            expect(mockSetData.mock.calls[1][1]).toEqual(expectedPlainSelection);
        });

        it('should do nothing if no range is found [copy event]', () => {
            cleanProxyImagesFromClipboardContent('copy', mockClipboardEvent, null);

            expect(mockSetData).not.toHaveBeenCalled();
        });

        it('should keep content properly formatted [copy event]', () => {
            const content = `<div xmlns="http://www.w3.org/1999/xhtml">
<p>First paragraph</p>
<p>Second paragraph</p>
<a href="https://example.com">Link below</a>
</div>`;
            const selection = setup(content);
            cleanProxyImagesFromClipboardContent('copy', mockClipboardEvent, selection);

            // A bit strange, but turndown is inserting a space between the line breaks
            const expectedPlainSelection = `First paragraph\n\nSecond paragraph\n\nLink below`;

            expect(mockSetData.mock.calls[0][0]).toEqual('text/html');
            expect(mockSetData.mock.calls[0][1]).toEqual(content);

            expect(mockSetData.mock.calls[1][0]).toEqual('text/plain');
            expect(mockSetData.mock.calls[1][1]).toEqual(expectedPlainSelection);
        });

        it('should replace images proxy urls with original urls from copied content [drag event]', () => {
            const content = `<div xmlns="http://www.w3.org/1999/xhtml">
<p>Text before images</p>
<img src="https://mail.proton.me/api/${PROXY_IMG_URL}?Url=https://image.com/image.png&DryRun=1">
<p>Text in the middle</p>
<img src="https://image.com/image.png">
<p>Text after images</p>
</div>`;
            const selection = setup(content);
            cleanProxyImagesFromClipboardContent('drag', mockDragEvent, selection);

            const expectedHTMLSelection = `<div xmlns="http://www.w3.org/1999/xhtml">
<p>Text before images</p>
<img src="https://image.com/image.png">
<p>Text in the middle</p>
<img src="https://image.com/image.png">
<p>Text after images</p>
</div>`;

            const expectedPlainSelection = `Text before images\n\nText in the middle\n\nText after images`;

            expect(mockSetData.mock.calls[0][0]).toEqual('text/html');
            expect(mockSetData.mock.calls[0][1]).toEqual(expectedHTMLSelection);

            expect(mockSetData.mock.calls[1][0]).toEqual('text/plain');
            expect(mockSetData.mock.calls[1][1]).toEqual(expectedPlainSelection);
        });

        it('should replace images proxy url with original url from single image copy [drag event]', () => {
            const imgAlt = 'image alt text';
            const img = document.createElement('img');
            img.src = `https://mail.proton.me/api/${PROXY_IMG_URL}?Url=https://image.com/image.png&DryRun=1`;
            img.alt = imgAlt;
            const mockDragEvent: DragEvent = {
                target: img,
                dataTransfer: {
                    setData: mockSetData,
                },
            } as any;
            const selection = { rangeCount: 0 } as Selection;
            cleanProxyImagesFromClipboardContent('drag', mockDragEvent, selection);

            const expectedHTMLSelection = `<img src="https://image.com/image.png" alt="${imgAlt}">`;

            expect(mockSetData.mock.calls[0][0]).toEqual('text/html');
            expect(mockSetData.mock.calls[0][1]).toEqual(expectedHTMLSelection);

            expect(mockSetData.mock.calls[1][0]).toEqual('text/plain');
            expect(mockSetData.mock.calls[1][1]).toEqual('');
        });

        it('should do nothing if no range is found [drag event]', () => {
            cleanProxyImagesFromClipboardContent('drag', mockDragEvent, null);

            expect(mockSetData).not.toHaveBeenCalled();
        });

        it('should keep content properly formatted [drag event]', () => {
            const content = `<div xmlns="http://www.w3.org/1999/xhtml">
<p>First paragraph</p>
<p>Second paragraph</p>
<a href="https://example.com">Link below</a>
</div>`;
            const selection = setup(content);
            cleanProxyImagesFromClipboardContent('drag', mockDragEvent, selection);

            // A bit strange, but turndown is inserting a space between the line breaks
            const expectedPlainSelection = `First paragraph\n\nSecond paragraph\n\nLink below`;

            expect(mockSetData.mock.calls[0][0]).toEqual('text/html');
            expect(mockSetData.mock.calls[0][1]).toEqual(content);

            expect(mockSetData.mock.calls[1][0]).toEqual('text/plain');
            expect(mockSetData.mock.calls[1][1]).toEqual(expectedPlainSelection);
        });
    });
});
