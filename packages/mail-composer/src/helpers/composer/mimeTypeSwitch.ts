import {
    exportPlainText,
    plainTextToHTML,
    setDocumentContent,
} from '@proton/mail-message/helpers/message/messageContent';
import type { MessageState, PartialMessageState } from '@proton/mail-message/store/messages/messagesTypes';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';
import type { UserSettings } from '@proton/shared/lib/interfaces/UserSettings';
import { defaultFontStyle } from '@proton/shared/lib/mail/fontFace';

/** The message update that turns an HTML draft into plain text, from the editor's current HTML content */
export const getSwitchToPlainTextChange = (
    message: MessageState | undefined,
    editorContent: string
): PartialMessageState => {
    const plainText = exportPlainText(editorContent);
    const messageImages = message?.messageImages ? { ...message.messageImages, images: [] } : undefined;

    return { messageDocument: { plainText }, data: { MIMEType: MIME_TYPES.PLAINTEXT }, messageImages };
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
