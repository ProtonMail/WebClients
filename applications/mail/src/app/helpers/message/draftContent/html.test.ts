import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import type { Recipient } from '@proton/shared/lib/interfaces';
import { FORWARDED_MESSAGE } from '@proton/shared/lib/mail/messages';

import { formatFullDate } from 'proton-mail/helpers/date';
import {
    createHTMLDraftContent,
    generateBlockquote,
    generatePreviousMessageInfos,
} from 'proton-mail/helpers/message/draftContent/html';

// Mock dependencies to avoid DOM and other issues in tests
jest.mock('proton-mail/helpers/message/messageContent', () => ({
    plainTextToHTML: jest.fn((_message, body) => {
        return `<p>${body}</p>`;
    }),
    getDocumentContent: jest.fn((doc: any) => {
        return doc?.innerHTML || '<p>HTML content</p>';
    }),
}));

jest.mock('proton-mail/helpers/message/messageSignature', () => ({
    insertSignature: jest.fn((content, signature) => {
        if (signature) {
            return `${content}<div class="protonmail_signature_block">${signature}</div>`;
        }
        return content;
    }),
}));

const ID = 'ID';

describe('draft content html', () => {
    describe('generatePreviousMessageInfos', () => {
        const messageSubject = 'Subject';
        const meRecipient = { Name: 'me', Address: 'me@protonmail.com' };
        const toRecipient = { Name: 'toRecipient', Address: 'toRecipient@protonmail.com' };
        const ccRecipient = { Address: 'ccRecipient@protonmail.com' };
        const sender = { Name: 'sender', Address: 'sender@protonmail.com' } as Recipient;
        const toList = [meRecipient, toRecipient] as Recipient[];
        const ccList = [ccRecipient] as Recipient[];

        const generateMessage = (hasCCList = true) => {
            return {
                localID: ID,
                data: {
                    ID,
                    Subject: messageSubject,
                    Sender: sender,
                    ToList: toList,
                    CCList: hasCCList ? ccList : undefined,
                },
            } as MessageState;
        };

        it('should return the correct message blockquotes info for a reply', () => {
            const referenceMessage = generateMessage();

            const messageBlockquotesInfos = generatePreviousMessageInfos(referenceMessage, MESSAGE_ACTIONS.REPLY);

            const expectedString = `On ${formatFullDate(new Date(0))}, ${
                referenceMessage.data?.Sender.Name
            } &lt;${referenceMessage.data?.Sender.Address}&gt; wrote:<br>`;

            expect(messageBlockquotesInfos).toEqual(expectedString);
        });

        it('should return the correct message blockquotes info for a forward', () => {
            const referenceMessage = generateMessage();

            const messageBlockquotesInfos = generatePreviousMessageInfos(referenceMessage, MESSAGE_ACTIONS.FORWARD);

            const expectedString = `${FORWARDED_MESSAGE}<br>
        From: ${referenceMessage.data?.Sender.Name} &lt;${referenceMessage.data?.Sender.Address}&gt;<br>
        Date: On ${formatFullDate(new Date(0))}<br>
        Subject: ${messageSubject}<br>
        To: ${meRecipient.Name} &lt;${meRecipient.Address}&gt;, ${toRecipient.Name} &lt;${toRecipient.Address}&gt;<br>
        CC: ${ccRecipient.Address} &lt;${ccRecipient.Address}&gt;<br><br>`;

            expect(messageBlockquotesInfos).toEqual(expectedString);
        });

        it('should return the correct message blockquotes info for a forward with no CC', () => {
            const referenceMessage = generateMessage(false);

            const messageBlockquotesInfos = generatePreviousMessageInfos(referenceMessage, MESSAGE_ACTIONS.FORWARD);

            const expectedString = `${FORWARDED_MESSAGE}<br>
        From: ${referenceMessage.data?.Sender.Name} &lt;${referenceMessage.data?.Sender.Address}&gt;<br>
        Date: On ${formatFullDate(new Date(0))}<br>
        Subject: ${messageSubject}<br>
        To: ${meRecipient.Name} &lt;${meRecipient.Address}&gt;, ${toRecipient.Name} &lt;${toRecipient.Address}&gt;<br>
        <br>`;

            expect(messageBlockquotesInfos).toEqual(expectedString);
        });
    });

    describe('generateBlockquote', () => {
        const sender = { Name: 'sender', Address: 'sender@protonmail.com' } as Recipient;
        const mailSettings = {} as any;
        const userSettings = {} as any;
        const addresses = [] as any[];

        it('should generate HTML blockquote for plaintext message', () => {
            const referenceMessage = {
                data: {
                    ID: 'test-id',
                    Time: Date.now() / 1000,
                    Subject: 'Test Subject',
                    Sender: sender,
                    MIMEType: 'text/plain',
                },
                decryption: {
                    decryptedBody: 'Original plaintext message',
                },
            } as any;

            const result = generateBlockquote(
                referenceMessage,
                mailSettings,
                userSettings,
                addresses,
                MESSAGE_ACTIONS.REPLY
            );

            expect(result).toContain('class="protonmail_quote"');
            expect(result).toContain('<blockquote');
            expect(result).toContain('type="cite"');
            expect(result).toContain('wrote:');
        });

        it('should generate HTML blockquote for HTML message', () => {
            const referenceMessage = {
                data: {
                    ID: 'test-id',
                    Time: Date.now() / 1000,
                    Subject: 'Test Subject',
                    Sender: sender,
                    MIMEType: 'text/html',
                },
                messageDocument: {
                    document: {
                        innerHTML: '<p>Original HTML message</p>',
                    } as any,
                },
                messageImages: undefined,
            } as any;

            const result = generateBlockquote(
                referenceMessage,
                mailSettings,
                userSettings,
                addresses,
                MESSAGE_ACTIONS.REPLY
            );

            expect(result).toContain('class="protonmail_quote"');
            expect(result).toContain('<blockquote');
            expect(result).toContain('<p>Original HTML message</p>');
        });

        it('should include forward headers in blockquote', () => {
            const referenceMessage = {
                data: {
                    ID: 'test-id',
                    Time: Date.now() / 1000,
                    Subject: 'Test Subject',
                    Sender: sender,
                    ToList: [{ Name: 'Recipient', Address: 'recipient@protonmail.com' }],
                    CCList: [{ Address: 'cc@protonmail.com' }],
                    MIMEType: 'text/plain',
                },
                decryption: {
                    decryptedBody: 'Message to forward',
                },
            } as any;

            const result = generateBlockquote(
                referenceMessage,
                mailSettings,
                userSettings,
                addresses,
                MESSAGE_ACTIONS.FORWARD
            );

            expect(result).toContain(FORWARDED_MESSAGE);
            expect(result).toContain('From:');
            expect(result).toContain('Date:');
            expect(result).toContain('Subject:');
            expect(result).toContain('To:');
            expect(result).toContain('CC:');
        });
    });

    describe('createHTMLDraftContent', () => {
        const sender = { Name: 'sender', Address: 'sender@protonmail.com' } as Recipient;
        const mailSettings = {} as any;
        const userSettings = {} as any;
        const addresses = [] as any[];
        const fontStyle = 'font-family: Arial, sans-serif; font-size: 14px;';
        const senderAddress = { Signature: '<div>HTML Signature</div>' };

        it('should create new HTML draft with signature', () => {
            const result = createHTMLDraftContent({
                action: MESSAGE_ACTIONS.NEW,
                referenceMessage: undefined,
                mailSettings,
                userSettings,
                addresses,
                senderAddress,
                fontStyle,
            });

            expect(result.plainText).toBeUndefined();
            expect(result.document).toBeDefined();
            expect(result.document?.innerHTML).toContain('HTML Signature');
        });

        it('should create reply HTML draft with blockquote', () => {
            const referenceMessage = {
                data: {
                    ID: 'test-id',
                    Time: Date.now() / 1000,
                    Subject: 'Test Subject',
                    Sender: sender,
                    MIMEType: 'text/html',
                },
                messageDocument: {
                    document: {
                        innerHTML: '<p>Original message</p>',
                    } as any,
                },
                messageImages: undefined,
            } as any;

            const result = createHTMLDraftContent({
                action: MESSAGE_ACTIONS.REPLY,
                referenceMessage,
                mailSettings,
                userSettings,
                addresses,
                senderAddress,
                fontStyle,
            });

            expect(result.document).toBeDefined();
            expect(result.document?.innerHTML).toContain('HTML Signature');
            expect(result.document?.innerHTML).toContain('blockquote');
            expect(result.document?.innerHTML).toContain('protonmail_quote');
        });

        it('should create forward HTML draft with headers', () => {
            const referenceMessage = {
                data: {
                    ID: 'test-id',
                    Time: Date.now() / 1000,
                    Subject: 'Test Subject',
                    Sender: sender,
                    ToList: [{ Name: 'Recipient', Address: 'recipient@protonmail.com' }],
                    MIMEType: 'text/html',
                },
                messageDocument: {
                    document: {
                        innerHTML: '<p>Message to forward</p>',
                    } as any,
                },
                messageImages: undefined,
            } as any;

            const result = createHTMLDraftContent({
                action: MESSAGE_ACTIONS.FORWARD,
                referenceMessage,
                mailSettings,
                userSettings,
                addresses,
                senderAddress,
                fontStyle,
            });

            expect(result.document).toBeDefined();
            expect(result.document?.innerHTML).toContain('HTML Signature');
            expect(result.document?.innerHTML).toContain(FORWARDED_MESSAGE);
            expect(result.document?.innerHTML).toContain('From:');
            expect(result.document?.innerHTML).toContain('Subject:');
        });

        it('should handle draft without signature', () => {
            const result = createHTMLDraftContent({
                action: MESSAGE_ACTIONS.NEW,
                referenceMessage: undefined,
                mailSettings,
                userSettings,
                addresses,
                senderAddress: { Signature: '' },
                fontStyle,
            });

            expect(result.document).toBeDefined();
            expect(result.document?.innerHTML).not.toContain('HTML Signature');
        });

        it('should parse HTML content into DOM element', () => {
            const referenceMessage = {
                data: {
                    ID: 'test-id',
                    Time: Date.now() / 1000,
                    Sender: sender,
                    MIMEType: 'text/html',
                },
                decryption: {
                    decryptedBody: '<div>Test content</div>',
                },
            } as any;

            const result = createHTMLDraftContent({
                action: MESSAGE_ACTIONS.NEW,
                referenceMessage,
                mailSettings,
                userSettings,
                addresses,
                senderAddress,
                fontStyle,
            });

            expect(result.document).toBeDefined();
            expect(result.document?.tagName).toBe('BODY');
            expect(result.document?.innerHTML).toContain('Test content');
        });
    });
});
