import { MIME_TYPES } from '@proton/shared/lib/constants';
import type { Address, MailSettings, Recipient, UserSettings } from '@proton/shared/lib/interfaces';
import { FORWARDED_MESSAGE } from '@proton/shared/lib/mail/messages';

import { MESSAGE_ACTIONS } from 'proton-mail/constants';
import { formatFullDate } from 'proton-mail/helpers/date';
import { createNewDraft } from 'proton-mail/helpers/message/messageDraft';
import type { PartialMessageState } from 'proton-mail/store/messages/messagesTypes';

import mails from './__fixtures__/messageBlockquote.fixtures';
import { locateBlockquote, locatePlaintextInternalBlockquotes } from './messageBlockquote';

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




Sent with Proton Mail secure email.

`;

    const formattedDate = formatFullDate(messageDate);

    it(`should locate reply internal plaintext blockquotes`, () => {
        const newMessage = createNewDraft(
            MESSAGE_ACTIONS.REPLY,
            referenceMessage,
            {} as MailSettings,
            {} as UserSettings,
            [] as Address[],
            jest.fn()
        );

        const expectedBlockquotes = `On ${formattedDate}, ${referenceMessageSender.Name} <${referenceMessageSender.Address}> wrote:

> ${referenceMessage.decryption?.decryptedBody}`;

        expect(newMessage.messageDocument?.plainText).toEqual(`${expectedMessageBody}${expectedBlockquotes}`);
        const [content, blockquotes] = locatePlaintextInternalBlockquotes(newMessage.messageDocument?.plainText);
        expect(content).toEqual(expectedMessageBody);
        expect(blockquotes).toEqual(expectedBlockquotes);
    });

    it(`should locate forward internal plaintext blockquotes`, () => {
        const newMessage = createNewDraft(
            MESSAGE_ACTIONS.FORWARD,
            referenceMessage,
            {} as MailSettings,
            {} as UserSettings,
            [] as Address[],
            jest.fn()
        );

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
