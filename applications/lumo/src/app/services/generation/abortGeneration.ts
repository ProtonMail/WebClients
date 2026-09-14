import { selectMessagesByConversationId } from '../../redux/selectors';
import { updateConversationStatus } from '../../redux/slices/core/conversations';
import { deleteMessage, finishMessage } from '../../redux/slices/core/messages';
import type { LumoDispatch, LumoState } from '../../redux/store';
import { type ConversationId, ConversationStatus, Role, isCompactionMessage } from '../../types';
import { generationRegistry } from './generationRegistry';

export function isAbortError(error: unknown): boolean {
    if (!(error instanceof Error)) {
        return false;
    }
    return error.name === 'AbortError' || (error as Error & { code?: string }).code === 'AbortError';
}

export function throwIfAborted(signal?: AbortSignal): void {
    if (signal?.aborted) {
        throw new DOMException('The operation was aborted', 'AbortError');
    }
}

type CancelGenerationOptions = {
    /** When the AbortController was already triggered elsewhere. */
    skipSignalAbort?: boolean;
};

/**
 * Stop an in-flight generation and return the conversation UI to an idle state.
 * Aborts the registered signal, finalizes placeholder assistant messages with any
 * streamed content, and removes in-progress compaction markers.
 */
export function cancelConversationGeneration(
    dispatch: LumoDispatch,
    getState: () => LumoState,
    conversationId: ConversationId,
    options: CancelGenerationOptions = {}
): void {
    if (!options.skipSignalAbort) {
        generationRegistry.abort(conversationId);
    }

    const state = getState();
    const spaceId = state.conversations[conversationId]?.spaceId;
    if (!spaceId) {
        dispatch(updateConversationStatus({ id: conversationId, status: ConversationStatus.COMPLETED }));
        return;
    }

    const conversationMessages = selectMessagesByConversationId(conversationId)(state);

    for (const message of Object.values(conversationMessages)) {
        if (message.compaction?.status === 'compacting' && isCompactionMessage(message)) {
            dispatch(deleteMessage(message.id));
            continue;
        }

        if (message.role === Role.Assistant && message.placeholder) {
            dispatch(
                finishMessage({
                    messageId: message.id,
                    conversationId,
                    spaceId,
                    content: message.content ?? '',
                    status: 'succeeded',
                    role: Role.Assistant,
                })
            );
        }
    }

    dispatch(updateConversationStatus({ id: conversationId, status: ConversationStatus.COMPLETED }));
}
