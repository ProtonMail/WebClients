import { c } from 'ttag';

import { type Conversation, ConversationStatus } from '../types';

const ENGLISH_NEW_CHAT = 'New chat';

export function getDefaultNewConversationTitle(): string {
    return c('collider_2025: Placeholder').t`New chat`;
}

export function isPlaceholderConversationTitle(title: string): boolean {
    const trimmed = title.trim();
    if (!trimmed) {
        return true;
    }

    return trimmed === ENGLISH_NEW_CHAT || trimmed === getDefaultNewConversationTitle();
}

export function shouldPreserveLocalConversationTitle(local: Conversation, remote: Conversation): boolean {
    const localTitle = local.title.trim();
    const remoteTitle = remote.title.trim();

    if (!localTitle || localTitle === remoteTitle) {
        return false;
    }

    if (local.status === ConversationStatus.GENERATING) {
        return true;
    }

    return isPlaceholderConversationTitle(remoteTitle) && !isPlaceholderConversationTitle(localTitle);
}

export function mergeConversationFromRemote(
    local: Conversation | undefined,
    remote: Conversation
): { conversation: Conversation; preserveLocalTitle: boolean } {
    if (!local) {
        return { conversation: remote, preserveLocalTitle: false };
    }

    const preserveLocalTitle = shouldPreserveLocalConversationTitle(local, remote);
    let conversation = remote;

    if (preserveLocalTitle) {
        conversation = { ...conversation, title: local.title };
    }

    if (local.status === ConversationStatus.GENERATING) {
        conversation = { ...conversation, status: ConversationStatus.GENERATING };
    }

    return { conversation, preserveLocalTitle };
}
