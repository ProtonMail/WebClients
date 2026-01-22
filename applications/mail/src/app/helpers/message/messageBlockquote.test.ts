import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import type { PartialMessageState } from '@proton/mail/store/messages/messagesTypes';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import type { Address, MailSettings, Recipient, UserSettings } from '@proton/shared/lib/interfaces';
import { PM_SIGNATURE } from '@proton/shared/lib/mail/mailSettings';
import { FORWARDED_MESSAGE } from '@proton/shared/lib/mail/messages';
import { getProtonMailSignature } from '@proton/shared/lib/mail/signature';

import { formatFullDate } from 'proton-mail/helpers/date';
import { createNewDraft } from 'proton-mail/helpers/message/messageDraft';

import mails from './__fixtures__/messageBlockquote.fixtures';
import {
    locateBlockquote,
    locatePlaintextInternalBlockquotes,
    removeSignatureFromHTMLMessage,
    removeSignatureFromPlainTextMessage,
} from './messageBlockquote';
import { exportPlainTextSignature } from './messageSignature';

// Normalize whitespace for comparison (editors often strip trailing spaces)
const normalize = (str: string) =>
    str
        .split('\n')
        .map((line) => line.trimEnd())
        .join('\n');

/**
 * Creating a whole document each time is needed because locate blockquote is using xpath request
 * which will fail if the content is not actually in the document
 */
const createDocument = (content: string) => {
    const newDocument = document.implementation.createHTMLDocument();
    newDocument.body.innerHTML = content;
    return newDocument.body;
};

describe('messageBlockquote', () => {
    Object.entries(mails as { [name: string]: string }).forEach(([name, content]) => {
        it(`should find the blockquote in the mail ${name}`, () => {
            const [, blockquote] = locateBlockquote(createDocument(content));
            expect(blockquote.length).not.toBe(0);
        });
    });

    it(`should correctly detect proton blockquote with default font and no signature`, () => {
        const content = `
            <div style="font-family: verdana; font-size: 20px;">
                <div style="font-family: verdana; font-size: 20px;"><br></div>
                <div class="protonmail_signature_block protonmail_signature_block-empty" style="font-family: verdana; font-size: 20px;">
                    <div class="protonmail_signature_block-user protonmail_signature_block-empty"></div>
                    <div class="protonmail_signature_block-proton protonmail_signature_block-empty"></div>
                </div>
                <div style="font-family: verdana; font-size: 20px;"><br></div>
                <div class="protonmail_quote">
                    On Tuesday, January 4th, 2022 at 17:13, Swiip - Test account &lt;swiip.test@protonmail.com&gt; wrote:<br>
                    <blockquote class="protonmail_quote" type="cite">
                        <div style="font-family: verdana; font-size: 20px;">
                            <div style="font-family: verdana; font-size: 20px;">test</div>
                            <div class="protonmail_signature_block protonmail_signature_block-empty" style="font-family: verdana; font-size: 20px;">
                                <div class="protonmail_signature_block-user protonmail_signature_block-empty"></div>
                                <div class="protonmail_signature_block-proton protonmail_signature_block-empty"></div>
                            </div>
                        </div>
                    </blockquote><br>
                </div>
            </div>`;

        const [before, after] = locateBlockquote(createDocument(content));

        expect(before).not.toContain('On Tuesday');
        expect(after).toContain('On Tuesday');
    });

    it(`should take the last element containing text in case of siblings blockquotes`, () => {
        const content = `
            Email content
            <div class="protonmail_quote">
                blockquote1
            </div>
            <div class="protonmail_quote">
                blockquote2
            </div>`;

        const [before, after] = locateBlockquote(createDocument(content));

        expect(before).toContain('Email content');
        expect(before).toContain('blockquote1');
        expect(before).not.toContain('blockquote2');
        expect(after).toContain('blockquote2');
        expect(after).not.toContain('blockquote1');
    });

    it(`should take the last element containing an image in case of siblings blockquotes`, () => {
        const content = `
            Email content
            <div class="protonmail_quote">
                blockquote1
            </div>
            <div class="protonmail_quote">
                <span class="proton-image-anchor" />
            </div>`;

        const [before, after] = locateBlockquote(createDocument(content));

        expect(before).toContain('Email content');
        expect(before).toContain('blockquote1');
        expect(before).not.toContain('proton-image-anchor');
        expect(after).toContain('proton-image-anchor');
        expect(after).not.toContain('blockquote1');
    });

    it(`should display nothing in blockquote when there is text after blockquotes`, () => {
        const content = `
            Email content
            <div class="protonmail_quote">
                blockquote1
            </div>
            text after blockquote`;

        const [before, after] = locateBlockquote(createDocument(content));

        expect(before).toContain('Email content');
        expect(before).toContain('blockquote1');
        expect(before).toContain('text after blockquote');
        expect(after).toEqual('');
    });

    it(`should display nothing in blockquote when there is an image after blockquotes`, () => {
        const content = `
            Email content
            <div class="protonmail_quote">
                blockquote1
            </div>
             <span class="proton-image-anchor" />`;

        const [before, after] = locateBlockquote(createDocument(content));

        expect(before).toContain('Email content');
        expect(before).toContain('blockquote1');
        expect(before).toContain('proton-image-anchor');
        expect(after).toEqual('');
    });

    it('should detect Microsoft Word email border separator and wrap the following content in a blockquote', () => {
        const content = `
            <div class="WordSection1">
                <p>Original email content</p>
                <div style="border:none;border-top:solid #E1E1E1 1.0pt;padding:3.0pt 0cm 0cm 0cm">
                    <p><b>From:</b> sender@example.com</p>
                    <p><b>Sent:</b> Monday, January 1, 2024</p>
                </div>
                <p>Previous message content</p>
            </div>`;

        const [before, after] = locateBlockquote(createDocument(content));

        expect(before).toContain('Original email content');
        expect(before).not.toContain('From:');
        expect(before).not.toContain('Previous message content');
        expect(after).toContain('blockquote');
        expect(after).toContain('From:');
        expect(after).toContain('Previous message content');
        expect(after).toContain('border:none;border-top:solid #E1E1E1 1.0pt;padding:3.0pt 0cm 0cm 0cm');
    });
});

describe('locatePlaintextInternalBlockquotes', () => {
    const messageDate = new Date(2025, 2, 4, 12, 21);
    const referenceMessageSender = {
        Name: 'Sender',
        Address: 'sender@proton.me',
    } as Recipient;
    const me = {
        Name: 'Me',
        Address: 'me@proton.me',
    } as Recipient;
    const toRecipient = {
        Name: 'ToRecipient',
        Address: 'to-recipient@proton.me',
    } as Recipient;
    const ccRecipient = {
        Name: 'CCRecipient',
        Address: 'cc-recipient@proton.me',
    } as Recipient;

    const referenceMessage = {
        data: {
            MIMEType: MIME_TYPES.PLAINTEXT,
            Subject: 'Mail subject',
            Sender: referenceMessageSender,
            ToList: [me, toRecipient],
            CCList: [ccRecipient],
            Attachments: [],
            Time: messageDate.getTime() / 1000,
        },
        decryption: {
            decryptedBody: `Hello this is the original message`,
        },
    } as PartialMessageState;

    const expectedMessageBody = `



${exportPlainTextSignature(getProtonMailSignature())}

`;

    const formattedDate = formatFullDate(messageDate);

    it(`should locate reply internal plaintext blockquotes`, () => {
        const newMessage = createNewDraft({
            action: MESSAGE_ACTIONS.REPLY,
            referenceMessage,
            mailSettings: { PMSignature: PM_SIGNATURE.ENABLED } as MailSettings,
            userSettings: {} as UserSettings,
            addresses: [] as Address[],
            getAttachment: jest.fn(),
        });

        const expectedBlockquotes = `On ${formattedDate}, ${referenceMessageSender.Name} <${referenceMessageSender.Address}> wrote:

> ${referenceMessage.decryption?.decryptedBody}`;

        expect(newMessage.messageDocument?.plainText).toEqual(`${expectedMessageBody}${expectedBlockquotes}`);
        const [content, blockquotes] = locatePlaintextInternalBlockquotes(newMessage.messageDocument?.plainText);
        expect(content).toEqual(expectedMessageBody);
        expect(blockquotes).toEqual(expectedBlockquotes);
    });

    it(`should locate forward internal plaintext blockquotes`, () => {
        const newMessage = createNewDraft({
            action: MESSAGE_ACTIONS.FORWARD,
            referenceMessage,
            mailSettings: { PMSignature: PM_SIGNATURE.ENABLED } as MailSettings,
            userSettings: {} as UserSettings,
            addresses: [] as Address[],
            getAttachment: jest.fn(),
        });

        const expectedBlockquotes = `${FORWARDED_MESSAGE}
From: ${referenceMessageSender.Name} <${referenceMessageSender.Address}>
Date: On ${formattedDate}
Subject: ${referenceMessage.data?.Subject}
To: ${me.Name} <${me.Address}>, ${toRecipient.Name} <${toRecipient.Address}>
CC: ${ccRecipient.Name} <${ccRecipient.Address}>


> ${referenceMessage.decryption?.decryptedBody}`;

        expect(newMessage.messageDocument?.plainText).toEqual(`${expectedMessageBody}${expectedBlockquotes}`);
        const [content, blockquotes] = locatePlaintextInternalBlockquotes(newMessage.messageDocument?.plainText);
        expect(content).toEqual(expectedMessageBody);
        expect(blockquotes).toEqual(expectedBlockquotes);
    });

    it(`should not locate plaintext blockquotes`, () => {
        // Using plaintext reply from outlook
        const messageContent = `This is a reply



________________________________________
From: sender@proton.me <sender@proton.me>
Sent: Wednesday, September 25, 2024 5:13 PM
To: recipient@outlook.com <recipient@outlook.com>
Subject: plain

Heyyyyyyy


Envoyé avec la messagerie sécurisée Proton Mail.`;

        const [content, blockquotes] = locatePlaintextInternalBlockquotes(messageContent);
        expect(content).toEqual(messageContent);
        expect(blockquotes).toEqual('');
    });
});

describe('removeSignatureFromHTMLMessage', () => {
    it('should remove the signature out of the HTML', () => {
        const content = `
            <body>
                <div>
                    <p>Hi John,</p>
                    <p>Thank you for your email. I've reviewed the proposal and I think it looks great!</p>
                    <p>I have a few minor suggestions:</p>
                    <ul>
                        <li>Update the timeline in section 3</li>
                        <li>Add more detail about the budget breakdown</li>
                        <li>Include the risk assessment we discussed</li>
                    </ul>
                    <p>Let me know if you'd like to schedule a call to discuss these points further.</p>
                    <p>Best regards,</p>
                </div>
                <div class="protonmail_signature_block" style="margin-top: 14px;">
                    <div>Sarah Mitchell</div>
                    <div>Senior Product Manager</div>
                    <div>Acme Corporation</div>
                    <div>sarah.mitchell@acme.com</div>
                    <div>+1 (555) 123-4567</div>
                </div>
            </body>
        `;

        const expectedContent = `<body>
                <div>
                    <p>Hi John,</p>
                    <p>Thank you for your email. I've reviewed the proposal and I think it looks great!</p>
                    <p>I have a few minor suggestions:</p>
                    <ul>
                        <li>Update the timeline in section 3</li>
                        <li>Add more detail about the budget breakdown</li>
                        <li>Include the risk assessment we discussed</li>
                    </ul>
                    <p>Let me know if you'd like to schedule a call to discuss these points further.</p>
                    <p>Best regards,</p>
                </div>


        </body>`;

        const contentWithoutSignature = removeSignatureFromHTMLMessage(content);
        expect(normalize(contentWithoutSignature)).toEqual(normalize(expectedContent));
    });
    it('should locate content before blockquote and remove the signature', () => {
        const content = `
        <div style="font-family: verdana; font-size: 20px;">
            <div style="font-family: verdana; font-size: 20px;">This is the content before the blockquote and signature<br></div>
            <div class="protonmail_signature_block protonmail_signature_block-empty" style="font-family: verdana; font-size: 20px;">
                <div class="protonmail_signature_block-user protonmail_signature_block-empty"></div>
                <div class="protonmail_signature_block-proton protonmail_signature_block-empty"></div>
            </div>
            <div class="protonmail_quote">
                On Tuesday, January 4th, 2022 at 17:13, Swiip - Test account &lt;swiip.test@protonmail.com&gt; wrote:<br>
                <blockquote class="protonmail_quote" type="cite">
                    <div style="font-family: verdana; font-size: 20px;">
                        <div style="font-family: verdana; font-size: 20px;">test</div>
                        <div class="protonmail_signature_block protonmail_signature_block-empty" style="font-family: verdana; font-size: 20px;">
                            <div class="protonmail_signature_block-user protonmail_signature_block-empty"></div>
                            <div class="protonmail_signature_block-proton protonmail_signature_block-empty"></div>
                        </div>
                    </div>
                </blockquote><br>
            </div>
        </div>`;

        const expectedContent = `<body><div style=\"font-family: verdana; font-size: 20px;\">
            <div style=\"font-family: verdana; font-size: 20px;\">This is the content before the blockquote and signature<br></div>

            </div></body>`;

        const [contentWithoutBlockQuotes] = locateBlockquote(createDocument(content));
        const contentWithoutSignature = removeSignatureFromHTMLMessage(contentWithoutBlockQuotes);
        expect(normalize(contentWithoutSignature)).toEqual(normalize(expectedContent));
    });
});

describe('removeSignatureFromPlainTextMessage', () => {
    it('should remove the signature from plain text content', () => {
        const signature = `This is a test signature`;

        const content = `Hi John,

            Thank you for your email. I've reviewed the proposal and I think it looks great!

            I have a few minor suggestions:
            - Update the timeline in section 3
            - Add more detail about the budget breakdown
            - Include the risk assessment we discussed

            Let me know if you'd like to schedule a call to discuss these points further.

            Best regards,

            ${signature}
        `;

        const expectedContent = `Hi John,

            Thank you for your email. I've reviewed the proposal and I think it looks great!

            I have a few minor suggestions:
            - Update the timeline in section 3
            - Add more detail about the budget breakdown
            - Include the risk assessment we discussed

            Let me know if you'd like to schedule a call to discuss these points further.

            Best regards,

            `;

        const mockAddresses: Address[] = [
            {
                ID: 'address-123',
                Signature: signature,
            } as Address,
        ];

        const contentWithoutSignature = removeSignatureFromPlainTextMessage(content, 'address-123', mockAddresses);
        expect(contentWithoutSignature).toEqual(expectedContent);
    });

    it('should return original content when signature is not found', () => {
        const content = `Hi John,

            This is a simple message without any signature.

            Best regards,
            Sarah
        `;

        const mockAddresses: Address[] = [
            {
                ID: 'address-123',
                Signature: 'This signature does not exist in the content',
            } as Address,
        ];

        const contentWithoutSignature = removeSignatureFromPlainTextMessage(content, 'address-123', mockAddresses);
        expect(contentWithoutSignature).toEqual(content);
    });

    it('should return original content when signature is empty', () => {
        const content = `Hi John,

            This is a simple message.

            Best regards,
            Sarah
        `;

        const mockAddresses: Address[] = [
            {
                ID: 'address-123',
                Signature: '',
            } as Address,
        ];

        const contentWithoutSignature = removeSignatureFromPlainTextMessage(content, 'address-123', mockAddresses);
        expect(contentWithoutSignature).toEqual(content);
    });

    it('should remove only the last occurrence of signature when same text appears in body of message', () => {
        const signature = `Sarah Mitchell`;

        const content = `Hi Sarah Mitchell,

            I wanted to follow up on our conversation.

            Best regards,

            ${signature}
        `;

        const expectedContent = `Hi Sarah Mitchell,

            I wanted to follow up on our conversation.

            Best regards,

            `;

        const mockAddresses: Address[] = [
            {
                ID: 'address-123',
                Signature: signature,
            } as Address,
        ];

        const contentWithoutSignature = removeSignatureFromPlainTextMessage(content, 'address-123', mockAddresses);
        expect(contentWithoutSignature).toEqual(expectedContent);
    });

    it('should remove the signature if the Proton message is the only content after', () => {
        const signature = `Sarah Mitchell`;

        const content = `Hi Sarah Mitchell,

            I wanted to follow up on our conversation.

            Best regards,

            ${signature}

            ${exportPlainTextSignature(getProtonMailSignature())}
        `;

        const expectedContent = `Hi Sarah Mitchell,

            I wanted to follow up on our conversation.

            Best regards,

            `;

        const mockAddresses: Address[] = [
            {
                ID: 'address-123',
                Signature: signature,
            } as Address,
        ];

        const contentWithoutSignature = removeSignatureFromPlainTextMessage(content, 'address-123', mockAddresses);
        expect(contentWithoutSignature).toEqual(expectedContent);
    });

    it('should remove the signature if content after is empty', () => {
        const signature = `Test Signature`;

        const content = `Hi Sarah Mitchell,

            I wanted to follow up on our conversation.

            Best regards,

            ${signature}
        `;

        const expectedContent = `Hi Sarah Mitchell,

            I wanted to follow up on our conversation.

            Best regards,

            `;

        const mockAddresses: Address[] = [
            {
                ID: 'address-123',
                Signature: signature,
            } as Address,
        ];

        const contentWithoutSignature = removeSignatureFromPlainTextMessage(content, 'address-123', mockAddresses);
        expect(contentWithoutSignature).toEqual(expectedContent);
    });

    it('should remove signature if it has newlines before and the content after is empty', () => {
        const signature = `Test Signature`;

        const content = `Hi Sarah Mitchell,

            I wanted to follow up on our conversation.

            ${signature}
        `;

        const expectedContent = `Hi Sarah Mitchell,

            I wanted to follow up on our conversation.

            `;

        const mockAddresses: Address[] = [
            {
                ID: 'address-123',
                Signature: signature,
            } as Address,
        ];

        const contentWithoutSignature = removeSignatureFromPlainTextMessage(content, 'address-123', mockAddresses);
        expect(contentWithoutSignature).toEqual(expectedContent);
    });

    it('should not remove signature if there is a match but it is not at the end', () => {
        const signature = `Test Signature`;

        const content = `Hi Sarah Mitchell,

            ${signature}

            I wanted to follow up on our conversation.
        `;

        const expectedContent = `Hi Sarah Mitchell,

            ${signature}

            I wanted to follow up on our conversation.
        `;

        const mockAddresses: Address[] = [
            {
                ID: 'address-123',
                Signature: signature,
            } as Address,
        ];

        const contentWithoutSignature = removeSignatureFromPlainTextMessage(content, 'address-123', mockAddresses);
        expect(contentWithoutSignature).toEqual(expectedContent);
    });
});
