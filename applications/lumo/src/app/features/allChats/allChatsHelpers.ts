import { c } from 'ttag';

import { isGeneratedImageAttachment } from '../../lib/imageAttachment';
import { getMessageDisplayContent } from '../../messageHelpers';
import type { AttachmentMap } from '../../redux/slices/core/attachments';
import type { Message } from '../../types';

const PREVIEW_MAX_LENGTH = 200;

const normalizeWhitespace = (text: string): string => {
    return text.replace(/\s+/g, ' ').trim();
};

const stripMarkdownForPreview = (text: string): string => {
    return text
        .replace(/^#+\s+/gm, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/`/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
};

const truncatePreview = (text: string): string => {
    const normalized = normalizeWhitespace(text);
    const firstLine = normalized.split('\n')[0] ?? normalized;
    if (firstLine.length <= PREVIEW_MAX_LENGTH) {
        return firstLine;
    }
    return `${firstLine.slice(0, PREVIEW_MAX_LENGTH - 1)}…`;
};

const messageHasImages = (message: Message, attachments: AttachmentMap): boolean => {
    return (message.attachments ?? []).some((shallow) => {
        const attachment = attachments[shallow.id] ?? shallow;
        if (attachment.mimeType?.startsWith('image/')) {
            return true;
        }
        return isGeneratedImageAttachment(attachment);
    });
};

export const getConversationPreview = (conversationMessages: Message[], attachments: AttachmentMap): string => {
    for (const message of conversationMessages) {
        const rawContent = getMessageDisplayContent(message);
        const content = stripMarkdownForPreview(rawContent);
        if (content) {
            return truncatePreview(content);
        }

        if (messageHasImages(message, attachments)) {
            return c('collider_2025:Info').t`Image`;
        }

        if ((message.attachments?.length ?? 0) > 0) {
            return c('collider_2025:Info').t`File attached`;
        }
    }

    return '';
};
