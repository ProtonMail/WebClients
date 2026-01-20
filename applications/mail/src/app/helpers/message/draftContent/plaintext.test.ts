import { addDays, getUnixTime } from 'date-fns';

import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import type { Recipient } from '@proton/shared/lib/interfaces';
import { FORWARDED_MESSAGE } from '@proton/shared/lib/mail/messages';

import { formatFullDate } from 'proton-mail/helpers/date';
import {
    createPlaintextDraftContent,
    generatePlaintextBlockquote,
    generatePlaintextPreviousMessageInfos,
} from 'proton-mail/helpers/message/draftContent/plaintext';

// Mock messageContent to avoid DOM dependencies in tests
jest.mock('proton-mail/helpers/message/messageContent', () => ({
    exportPlainText: jest.fn((html: string) => {
        // Remove HTML tags and decode common entities
        return html
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .trim();
    }),
    getDocumentContent: jest.fn((doc: any) => {
        // Return the innerHTML if available, otherwise a default
        return doc?.innerHTML || '<p>HTML content</p>';
    }),
}));

const ID = 'ID';
const now = new Date();
const receiveDate = addDays(now, -5);
const Time = getUnixTime(receiveDate);
const Subject = 'test';
const recipient1 = { Address: 'test1@proton.me' };
const recipient2 = { Address: 'test2@proton.me' };
const recipient3 = { Address: 'test3@proton.me' };

describe('draft content plaintext', () => {
    describe('generatePlaintextPreviousMessageInfos', () => {
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

        it('should return the correct plaintext message info for a reply', () => {
            const referenceMessage = generateMessage();

            const messageInfos = generatePlaintextPreviousMessageInfos(referenceMessage, MESSAGE_ACTIONS.REPLY);

            const expectedString = `On ${formatFullDate(new Date(0))}, ${referenceMessage.data?.Sender.Name} <${
                referenceMessage.data?.Sender.Address
            }> wrote:`;

            expect(messageInfos).toEqual(expectedString);
        });

        it('should return the correct plaintext message info for a forward', () => {
            const referenceMessage = generateMessage();

            const messageInfos = generatePlaintextPreviousMessageInfos(referenceMessage, MESSAGE_ACTIONS.FORWARD);

            const expectedString = `${FORWARDED_MESSAGE}
From: ${referenceMessage.data?.Sender.Name} <${referenceMessage.data?.Sender.Address}>
Date: On ${formatFullDate(new Date(0))}
Subject: ${messageSubject}
To: ${meRecipient.Name} <${meRecipient.Address}>, ${toRecipient.Name} <${toRecipient.Address}>
CC: ${ccRecipient.Address} <${ccRecipient.Address}>
`;

            expect(messageInfos).toEqual(expectedString);
        });

        it('should return the correct plaintext message info for a forward with no CC', () => {
            const referenceMessage = generateMessage(false);

            const messageInfos = generatePlaintextPreviousMessageInfos(referenceMessage, MESSAGE_ACTIONS.FORWARD);

            const expectedString = `${FORWARDED_MESSAGE}
From: ${referenceMessage.data?.Sender.Name} <${referenceMessage.data?.Sender.Address}>
Date: On ${formatFullDate(new Date(0))}
Subject: ${messageSubject}
To: ${meRecipient.Name} <${meRecipient.Address}>, ${toRecipient.Name} <${toRecipient.Address}>
`;

            expect(messageInfos).toEqual(expectedString);
        });
    });

    describe('generatePlaintextBlockquote', () => {
        const messageBody = `This is the message body.
With multiple lines.
And some content.`;

        const sender = { Name: 'sender', Address: 'sender@protonmail.com' } as Recipient;

        it('should generate plaintext blockquote for plaintext message', () => {
            const referenceMessage = {
                localID: ID,
                data: {
                    ID,
                    Time,
                    Subject,
                    Sender: sender,
                    MIMEType: 'text/plain',
                },
                decryption: {
                    decryptedBody: messageBody,
                },
            } as MessageState;

            const result = generatePlaintextBlockquote(referenceMessage, MESSAGE_ACTIONS.REPLY);

            const expected = `On ${formatFullDate(new Date(Time * 1000))}, sender <${sender.Address}> wrote:

> This is the message body.
> With multiple lines.
> And some content.`;

            expect(result).toEqual(expected);
        });

        it('should include forward headers for forward action', () => {
            const referenceMessage = {
                localID: ID,
                data: {
                    ID,
                    Time,
                    Subject,
                    Sender: sender,
                    ToList: [recipient1],
                    MIMEType: 'text/plain',
                },
                decryption: {
                    decryptedBody: messageBody,
                },
            } as MessageState;

            const result = generatePlaintextBlockquote(referenceMessage, MESSAGE_ACTIONS.FORWARD);

            const expected = `${FORWARDED_MESSAGE}
From: ${sender.Name} <${sender.Address}>
Date: On ${formatFullDate(new Date(Time * 1000))}
Subject: ${Subject}\nTo: ${recipient1.Address} <${recipient1.Address}>


> This is the message body.
> With multiple lines.
> And some content.`;
            expect(result).toEqual(expected);
        });

        it('should handle HTML message conversion to plaintext', () => {
            const referenceMessage = {
                localID: ID,
                data: {
                    ID,
                    Time,
                    Subject,
                    Sender: sender,
                    MIMEType: 'text/html',
                },
                messageDocument: {
                    document: {
                        innerHTML: '<p>HTML content</p>',
                    } as any,
                },
                messageImages: undefined,
            } as MessageState;

            const result = generatePlaintextBlockquote(referenceMessage, MESSAGE_ACTIONS.REPLY);

            // Should quote the converted HTML content
            expect(result).toContain('> HTML content');
            expect(result).toContain(`On ${formatFullDate(new Date(Time * 1000))}`);
        });

        it('should handle forward with CC recipients', () => {
            const referenceMessage = {
                localID: ID,
                data: {
                    ID,
                    Time,
                    Subject,
                    Sender: sender,
                    ToList: [recipient1],
                    CCList: [recipient2, recipient3],
                    MIMEType: 'text/plain',
                },
                decryption: {
                    decryptedBody: 'Message content',
                },
            } as MessageState;

            const result = generatePlaintextBlockquote(referenceMessage, MESSAGE_ACTIONS.FORWARD);

            expect(result).toContain(FORWARDED_MESSAGE);
            expect(result).toContain('CC:');
            expect(result).toContain(recipient2.Address);
            expect(result).toContain(recipient3.Address);
        });
    });

    describe('createPlaintextDraftContent', () => {
        const sender = { Name: 'sender', Address: 'sender@protonmail.com' } as Recipient;
        const mailSettings = {} as any;
        const userSettings = {} as any;
        const fontStyle = 'font-family: Arial, sans-serif; font-size: 14px;';
        const senderAddress = { Signature: '<div>Test Signature</div>' };

        it('should create new draft with signature and no blockquote', () => {
            const result = createPlaintextDraftContent({
                action: MESSAGE_ACTIONS.NEW,
                referenceMessage: undefined,
                senderAddress,
                mailSettings,
                userSettings,
                fontStyle,
            });

            expect(result.document).toBeUndefined();
            expect(result.plainText).toBeDefined();
            expect(result.plainText).toContain('Test Signature');
            expect(result.plainText).not.toContain('>');
        });

        it('should create new draft without signature', () => {
            const result = createPlaintextDraftContent({
                action: MESSAGE_ACTIONS.NEW,
                referenceMessage: undefined,
                senderAddress: { Signature: '' },
                mailSettings,
                userSettings,
                fontStyle,
            });

            expect(result.plainText).toBeDefined();
            expect(result.plainText).not.toContain('Test Signature');
        });

        it('should create reply draft with signature and blockquote', () => {
            const referenceMessage = {
                data: {
                    ID,
                    Time,
                    Subject,
                    Sender: sender,
                    MIMEType: 'text/plain',
                },
                decryption: {
                    decryptedBody: 'Original message content',
                },
            } as any;

            const result = createPlaintextDraftContent({
                action: MESSAGE_ACTIONS.REPLY,
                referenceMessage,
                senderAddress,
                mailSettings,
                userSettings,
                fontStyle,
            });

            expect(result.plainText).toBeDefined();
            expect(result.plainText).toContain('Test Signature');
            expect(result.plainText).toContain('> Original message content');
            expect(result.plainText).toContain('wrote:');
        });

        it('should create forward draft with signature and blockquote with headers', () => {
            const referenceMessage = {
                data: {
                    ID,
                    Time,
                    Subject,
                    Sender: sender,
                    ToList: [recipient1],
                    CCList: [recipient2],
                    MIMEType: 'text/plain',
                },
                decryption: {
                    decryptedBody: 'Message to forward',
                },
            } as any;

            const result = createPlaintextDraftContent({
                action: MESSAGE_ACTIONS.FORWARD,
                referenceMessage,
                senderAddress,
                mailSettings,
                userSettings,
                fontStyle,
            });

            expect(result.plainText).toBeDefined();
            expect(result.plainText).toContain('Test Signature');
            expect(result.plainText).toContain('> Message to forward');
            expect(result.plainText).toContain(FORWARDED_MESSAGE);
            expect(result.plainText).toContain('From:');
            expect(result.plainText).toContain('Date:');
            expect(result.plainText).toContain('Subject:');
            expect(result.plainText).toContain('To:');
            expect(result.plainText).toContain('CC:');
        });

        it('should verify signature placement with correct newlines', () => {
            const result = createPlaintextDraftContent({
                action: MESSAGE_ACTIONS.NEW,
                referenceMessage: { decryption: { decryptedBody: 'Body content' } } as any,
                senderAddress,
                mailSettings,
                userSettings,
                fontStyle,
            });

            expect(result.plainText).toBeDefined();

            // Draft starts with 4 empty lines
            expect(result.plainText?.startsWith('\n\n\n\n')).toBe(true);

            const signatureIndex = result.plainText?.indexOf('Test Signature');
            const bodyIndex = result.plainText?.indexOf('Body content');

            expect(signatureIndex).toBeGreaterThan(0);
            expect(bodyIndex).toBeGreaterThan(signatureIndex!);

            const betweenText = result.plainText?.slice(signatureIndex! + 'Test Signature'.length, bodyIndex!);
            // 1 empty line between the signature and the blockquotes
            expect(betweenText).toContain('\n\n');
        });

        it('should handle empty signature and empty message', () => {
            const result = createPlaintextDraftContent({
                action: MESSAGE_ACTIONS.NEW,
                referenceMessage: undefined,
                senderAddress: { Signature: '' },
                mailSettings,
                userSettings,
                fontStyle,
            });

            expect(result.plainText).toBeDefined();
            // Should only have the 4 newlines at the start
            expect(result.plainText).toBe('\n\n\n\n');
        });
    });
});
