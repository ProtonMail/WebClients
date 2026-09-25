import { c } from 'ttag';

import { selectMessagesByConversationId } from '../../../redux/selectors';
import type { LumoState } from '../../../redux/store';
import type { Conversation } from '../../../types';
import { triggerFileDownload } from '../../../util/triggerFileDownload';
import { convertConversationToJson } from './convertConversationToJson';
import { convertConversationToMarkdown } from './convertConversationToMarkdown';

export type Format = 'json' | 'md';

const sanitizeTitle = (title: string) => {
    // Strip characters illegal in filenames on Windows/macOS/Linux, plus control characters, then trim trailing
    // dots/spaces (invalid on Windows) and cap the length so titles don't produce unwieldy filenames.
    return title
        .trim()
        .replace(/[\x00-\x1f<>:"/\\|?*]+/g, '')
        .slice(0, 80)
        .replace(/[. ]+$/, '');
};

const toFilename = (conversation: Conversation, extension: string) => {
    return `${
        sanitizeTitle(conversation.title) ||
        // translator: Fallback filename slug used when the conversation has no title.
        sanitizeTitle(c('collider_2025:Title').t`Untitled conversation`)
    }.${extension}`;
};

export const exportConversation = (state: LumoState, conversation: Conversation, format: Format) => {
    const messages = selectMessagesByConversationId(conversation.id)(state);

    switch (format) {
        case 'json': {
            triggerFileDownload(
                new Blob([convertConversationToJson(conversation, messages)], { type: 'application/json' }),
                toFilename(conversation, 'json')
            );
            return;
        }
        case 'md': {
            triggerFileDownload(
                new Blob([convertConversationToMarkdown(conversation, messages)], { type: 'text/markdown' }),
                toFilename(conversation, 'md')
            );
            return;
        }
    }
};
