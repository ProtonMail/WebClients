import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import { parseDOMStringToBodyElement } from '@proton/mail/helpers/parseDOMStringToBodyElement';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import type { MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import type { DRAFT_MIME_TYPES } from '@proton/shared/lib/mail/mailSettings';
import { buildAddress } from '@proton/testing/builders/address';

import { locateBlockquote } from '../message/messageBlockquote';
import { createNewDraft } from '../message/messageDraft';
import { CLASSNAME_SIGNATURE_CONTAINER } from '../message/messageSignature';
import { getMessageContentBeforeBlockquote, insertBodyIntoNewDraft } from './contentFromComposerMessage';

describe('getMessageContentBeforeBlockquote', () => {
    it('should return empty string if editorContent is empty', () => {
        expect(
            getMessageContentBeforeBlockquote({
                editorType: 'plaintext',
                editorContent: '',
                addressSignature: 'signature',
            })
        ).toBe('');

        expect(
            getMessageContentBeforeBlockquote({
                editorType: 'html',
                editorContent: '',
                returnType: 'plaintext',
            })
        ).toBe('');
    });

    it('should return content if no signature', () => {
        expect(
            getMessageContentBeforeBlockquote({
                editorType: 'plaintext',
                editorContent: 'Hello this is some plain text content',
                addressSignature: '',
            })
        ).toBe('Hello this is some plain text content');
    });

    it('should return content before signature if signature', () => {
        expect(
            getMessageContentBeforeBlockquote({
                editorType: 'plaintext',
                editorContent: 'Hello this is some plain text content\n\n--\nSignature',
                addressSignature: '\n\n--\nSignature',
            })
        ).toBe('Hello this is some plain text content');

        // Innertext is not supported in jsdom
        // https://github.com/jsdom/jsdom/issues/1245#issuecomment-966545022
        // And alternatives like textContent dont not handle \n.

        // expect(
        //     getMessageContentBeforeBlockquote({
        //         editorType: 'html',
        //         editorContent:
        //             '<div>Hello this is content</div><div class="protonmail_signature_block">Signature</div>',
        //     })
        // ).toBe('Hello this is content');
    });
});

describe('insertBodyIntoNewDraft', () => {
    const mailSettings = {} as MailSettings;
    const userSettings = {} as UserSettings;
    const originalBody = '<div>Hello this is the reference message</div>';

    const buildReplyDraft = (mimeType: DRAFT_MIME_TYPES) => {
        return createNewDraft({
            action: MESSAGE_ACTIONS.REPLY,
            referenceMessage: {
                data: { ID: 'referenceID', Subject: 'subject', MIMEType: mimeType },
                decryption: { decryptedBody: originalBody },
                messageDocument: { document: parseDOMStringToBodyElement(originalBody) },
            },
            mailSettings: { ...mailSettings, DraftMIMEType: mimeType },
            userSettings,
            addresses: [buildAddress({ Signature: '<div>signature</div>' })],
            getAttachment: jest.fn(),
        }) as MessageState;
    };

    it('should put the supplied body before the quote of a reply draft', () => {
        const bodyBeforeQuote = 'Sounds good, see you then.';

        const body = insertBodyIntoNewDraft(buildReplyDraft(MIME_TYPES.DEFAULT), bodyBeforeQuote, mailSettings);
        const [contentBeforeBlockquote, blockquote] = locateBlockquote(parseDOMStringToBodyElement(body));

        expect(contentBeforeBlockquote).toContain(bodyBeforeQuote);
        expect(blockquote).toContain(originalBody);
    });

    it('should not let markup in the supplied body reach the draft', () => {
        const body = insertBodyIntoNewDraft(
            buildReplyDraft(MIME_TYPES.DEFAULT),
            '<img src="x" onerror="alert(1)">',
            mailSettings
        );

        expect(body).not.toContain('<img');
    });

    it('should keep the quote of a plain text reply draft', () => {
        const body = insertBodyIntoNewDraft(buildReplyDraft(MIME_TYPES.PLAINTEXT), 'Sounds good.', mailSettings);

        expect(body).toContain('Sounds good.');
        expect(body).toContain(originalBody);
    });

    it('should put the supplied body above both the signature and the quote', () => {
        const draft = {
            localID: 'draftID',
            data: { MIMEType: MIME_TYPES.DEFAULT },
            messageDocument: {
                document: parseDOMStringToBodyElement(
                    `<div class="${CLASSNAME_SIGNATURE_CONTAINER}">MY SIGNATURE</div><div class="protonmail_quote">QUOTED</div>`
                ),
            },
        } as MessageState;

        const body = insertBodyIntoNewDraft(draft, 'Sounds good.', mailSettings);

        expect(body.indexOf('Sounds good.')).toBeLessThan(body.indexOf('MY SIGNATURE'));
        expect(body.indexOf('MY SIGNATURE')).toBeLessThan(body.indexOf('QUOTED'));
    });
});
