import {
    exportPlainText,
    plainTextToHTML,
    setDocumentContent,
} from '@proton/mail-message/helpers/message/messageContent';
import { matchSameCidOrLoc, readContentIDandLocation } from '@proton/mail-message/helpers/message/messageEmbeddeds';
import { getEmbeddedImages } from '@proton/mail-message/helpers/message/messageImages';
import type { MessageState, PartialMessageState } from '@proton/mail-message/store/messages/messagesTypes';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';
import type { UserSettings } from '@proton/shared/lib/interfaces/UserSettings';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { defaultFontStyle } from '@proton/shared/lib/mail/fontFace';

/**
 * The draft's attachments that are embedded images. They are matched by CID or location, not by ID,
 * because reply and forward drafts get new attachment IDs when they are saved.
 */
export const getEmbeddedAttachments = (message: MessageState | undefined): Attachment[] => {
    const embeddedImages = getEmbeddedImages(message || {});

    return (message?.data?.Attachments || []).filter((attachment) => {
        const { cid, cloc } = readContentIDandLocation(attachment);
        return embeddedImages.some((image) => matchSameCidOrLoc(image, cid, cloc));
    });
};

/**
 * The message update that turns an HTML draft into plain text, from the editor's current HTML content.
 * Plain text can't show embedded images, so their attachments are removed too: otherwise they would still be sent,
 * hidden from the sender but not from every recipient.
 */
export const getSwitchToPlainTextChange = (
    message: MessageState | undefined,
    editorContent: string
): PartialMessageState => {
    const plainText = exportPlainText(editorContent);
    const messageImages = message?.messageImages ? { ...message.messageImages, images: [] } : undefined;

    const embeddedAttachments = getEmbeddedAttachments(message);
    const Attachments = message?.data?.Attachments?.filter((attachment) => !embeddedAttachments.includes(attachment));

    return {
        messageDocument: { plainText },
        data: { MIMEType: MIME_TYPES.PLAINTEXT, ...(Attachments ? { Attachments } : {}) },
        messageImages,
    };
};

/** The message update that turns a plain-text draft into HTML */
export const getSwitchToHTMLChange = (
    message: MessageState | undefined,
    mailSettings: MailSettings | undefined,
    userSettings: UserSettings | undefined,
    addresses: Address[]
): PartialMessageState => {
    const content = plainTextToHTML(
        message?.data,
        message?.messageDocument?.plainText,
        mailSettings,
        userSettings,
        addresses
    );

    const wrappedContent = `<div style="${defaultFontStyle(mailSettings)}">${content}</div>`;
    const document = setDocumentContent(message?.messageDocument?.document, wrappedContent);

    return { messageDocument: { document }, data: { MIMEType: MIME_TYPES.DEFAULT } };
};
