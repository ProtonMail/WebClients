import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import type { Address, MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import { isPlainText } from '@proton/shared/lib/mail/messages';

import {
    getAddressPlainTextSignature,
    getMessageContentBeforeBlockquote,
    hasSignatureContainer,
} from '../../helpers/composer/contentFromComposerMessage';
import { exportPlainText, getPlainTextContent } from '../../helpers/message/messageContentPlainText';

interface DraftBodyOptions {
    message: MessageState;
    addresses: Address[];
    mailSettings: MailSettings;
    userSettings: Partial<UserSettings>;
}

const stripHtmlBlockquote = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('blockquote.protonmail_quote').forEach((el) => el.remove());
    return doc.body.innerHTML;
};

const stripPlainTextQuote = (text: string): string => {
    return text.replace(/\n>[\s\S]*$/, '').replace(/\n[^\n]*\bwrote:\s*$/, '');
};

/**
 * What the user has actually written in a draft: the text before their signature and the quoted
 * conversation. Split exactly as the composer's own `getContentBeforeBlockquote` splits it, but off the
 * stored document rather than the editor, which nothing outside a composer has a handle on. Live to
 * within `updateDraftContent`'s 300ms debounce.
 */
export const writtenDraftBody = ({ message, addresses, mailSettings, userSettings }: DraftBodyOptions): string => {
    if (isPlainText(message.data)) {
        const signature = getAddressPlainTextSignature({
            senderAddress: message.data?.Sender?.Address,
            action: message.draftFlags?.action,
            addresses,
            mailSettings,
            userSettings,
        });

        const content = getMessageContentBeforeBlockquote({
            editorType: 'plaintext',
            editorContent: getPlainTextContent(message),
            addressSignature: signature,
        });

        // When the sender has no signature, getMessageContentBeforeBlockquote has no split point
        // and returns everything — including the quoted conversation. Strip it ourselves.
        return (signature ? content : stripPlainTextQuote(content)).trim();
    }

    // 'html' then exported, not returnType 'plaintext': that path reads `innerText`, which a document
    // that was never rendered does not have.
    const editorContent = message.messageDocument?.document?.innerHTML ?? '';
    const html = getMessageContentBeforeBlockquote({
        editorType: 'html',
        returnType: 'html',
        editorContent,
    });

    // When the document has no signature container, getMessageContentBeforeBlockquote has no split
    // point and the blockquote leaks through — same gap as the plaintext path.
    const cleaned = hasSignatureContainer(editorContent) ? html : stripHtmlBlockquote(html);

    return exportPlainText(cleaned).trim();
};
