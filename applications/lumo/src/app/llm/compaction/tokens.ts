import { getMessageBlocks } from '../../messageHelpers';
import type { Attachment, Message, Turn } from '../../types';
import { countTokens } from '../tokenizer';
import { countAttachmentToken } from '../utils';
import { IMAGE_TOKEN_ESTIMATE } from './constants';

/** Minimal shape of a per-message attachment exclusion (mirrors `ContextFilter`). */
export type AttachmentExclusion = { messageId: string; excludedFiles: string[] };

/**
 * Estimate the token cost of a single message, counting all content blocks
 * (text, tool calls, tool results) plus any pre-flattened attachment context.
 *
 * Uses the cheap ~4-chars/token approximation shared by the rest of the app; it
 * is intentionally not exact (we only need it for threshold decisions).
 */
export function estimateMessageTokens(message: Message): number {
    const blocks = getMessageBlocks(message);
    const blockTokens = blocks.reduce((sum, block) => sum + countTokens(block.content), 0);
    const contextTokens = countTokens(message.context);
    return blockTokens + contextTokens;
}

/** Estimate the total token cost of an ordered list of messages. */
export function estimateChainTokens(messages: Message[]): number {
    return messages.reduce((total, message) => total + estimateMessageTokens(message), 0);
}

/**
 * Estimate a message's visible content tokens (blocks only), excluding the
 * pre-flattened `context` field. This mirrors the conversation context
 * indicator (`calculateMessageContentTokens`), which counts attachments
 * separately to avoid double-counting baked-in context.
 */
export function estimateMessageContentTokens(message: Message): number {
    return getMessageBlocks(message).reduce((sum, block) => sum + countTokens(block.content), 0);
}

/** Sum of {@link estimateMessageContentTokens} across messages. */
export function estimateChainContentTokens(messages: Message[]): number {
    return messages.reduce((total, message) => total + estimateMessageContentTokens(message), 0);
}

/** The full attachments a message actually contributes, after applying exclusions. */
function activeMessageAttachments(
    message: Message,
    allAttachments: Attachment[],
    exclusions: AttachmentExclusion[]
): Attachment[] {
    const shallow = message.attachments ?? [];
    if (shallow.length === 0) {
        return [];
    }
    const excludedFiles = exclusions.find((f) => f.messageId === message.id)?.excludedFiles ?? [];
    return shallow
        .filter((s) => !excludedFiles.includes(s.filename))
        .map((s) => allAttachments.find((a) => a.id === s.id))
        .filter((a): a is Attachment => a !== undefined);
}

/**
 * Estimate the attachment-context tokens a message contributes to a request,
 * counting only files that are not excluded. Uses the same per-file accounting
 * (`countAttachmentToken`) as the conversation context indicator so compaction
 * stats line up with what the user sees.
 */
export function estimateMessageAttachmentTokens(
    message: Message,
    allAttachments: Attachment[],
    exclusions: AttachmentExclusion[]
): number {
    return activeMessageAttachments(message, allAttachments, exclusions).reduce(
        (total, attachment) => total + countAttachmentToken(attachment),
        0
    );
}

/** Sum of {@link estimateMessageAttachmentTokens} across messages. */
export function estimateChainAttachmentTokens(
    messages: Message[],
    allAttachments: Attachment[],
    exclusions: AttachmentExclusion[]
): number {
    return messages.reduce(
        (total, message) => total + estimateMessageAttachmentTokens(message, allAttachments, exclusions),
        0
    );
}

/** Estimate token cost of a raw string. */
export function estimateTextTokens(text: string | undefined): number {
    return countTokens(text);
}

/**
 * Estimate the token cost of the actual request payload (the prepared turns).
 *
 * Unlike {@link estimateChainTokens}, this reflects what is really sent to the
 * backend — most importantly the expanded attachment/file-content turns, which
 * are the dominant token sink in attachment-heavy conversations and are not
 * visible at the message-content level.
 */
export function estimateTurnsTokens(turns: Turn[]): number {
    return turns.reduce((sum, turn) => {
        const imageTokens = (turn.images?.length ?? 0) * IMAGE_TOKEN_ESTIMATE;
        return sum + estimateTextTokens(turn.content) + imageTokens;
    }, 0);
}
