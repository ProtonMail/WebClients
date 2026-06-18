import { tryParseToolCall } from '../../lib/toolCall/types';
import { getMessageBlocks } from '../../messageHelpers';
import type { Attachment, CompactionAudit, Message, MessageId } from '../../types';
import { CLEARED_TOOL_RESULT_PLACEHOLDER } from './constants';

function toolNameFromCallBlock(content: string): string | undefined {
    const parsed = tryParseToolCall(content);
    if (parsed?.name) {
        return parsed.name;
    }

    // Audit metadata only needs the tool name; some persisted blocks omit full arguments.
    try {
        const json = JSON.parse(content) as { name?: unknown };
        return typeof json.name === 'string' ? json.name : undefined;
    } catch {
        return undefined;
    }
}

/** Filenames / chunk titles referenced by messages in the summarized region. */
export function collectRemovedFiles(messages: Message[], attachments: Attachment[]): string[] {
    const byId = new Map(attachments.map((attachment) => [attachment.id, attachment]));
    const names = new Set<string>();

    for (const message of messages) {
        for (const attachment of message.attachments ?? []) {
            if (attachment.filename) {
                names.add(attachment.filename);
            } else if (attachment.chunkTitle) {
                names.add(attachment.chunkTitle);
            }
        }
        for (const attachmentId of message.contextFiles ?? []) {
            const attachment = byId.get(attachmentId);
            if (attachment?.filename) {
                names.add(attachment.filename);
            } else if (attachment?.chunkTitle) {
                names.add(attachment.chunkTitle);
            }
        }
    }

    return [...names].sort((a, b) => a.localeCompare(b));
}

function collectToolNames(messages: Message[]): string[] {
    const names = new Set<string>();
    for (const message of messages) {
        for (const block of getMessageBlocks(message)) {
            if (block.type !== 'tool_call') {
                continue;
            }
            const name = toolNameFromCallBlock(block.content);
            if (name) {
                names.add(name);
            }
        }
    }
    return [...names].sort((a, b) => a.localeCompare(b));
}

/** Tool names whose results were replaced with the cleared placeholder. */
export function collectClearedToolNames(before: Message[], after: Message[]): string[] {
    const names = new Set<string>();

    for (let messageIndex = 0; messageIndex < before.length; messageIndex += 1) {
        const beforeBlocks = getMessageBlocks(before[messageIndex]);
        const afterBlocks = getMessageBlocks(after[messageIndex] ?? before[messageIndex]);
        let lastToolCallName: string | undefined;

        for (let blockIndex = 0; blockIndex < beforeBlocks.length; blockIndex += 1) {
            const beforeBlock = beforeBlocks[blockIndex];
            const afterBlock = afterBlocks[blockIndex];

            if (beforeBlock.type === 'tool_call') {
                lastToolCallName = toolNameFromCallBlock(beforeBlock.content);
            }

            if (
                beforeBlock.type === 'tool_result' &&
                afterBlock?.type === 'tool_result' &&
                beforeBlock.content !== CLEARED_TOOL_RESULT_PLACEHOLDER &&
                afterBlock.content === CLEARED_TOOL_RESULT_PLACEHOLDER &&
                lastToolCallName
            ) {
                names.add(lastToolCallName);
            }
        }
    }

    return [...names].sort((a, b) => a.localeCompare(b));
}

/** Tool names removed when call/result pairs were dropped entirely. */
export function collectDroppedToolNames(before: Message[], after: Message[]): string[] {
    const beforeNames = new Set(collectToolNames(before));
    const afterNames = new Set(collectToolNames(after));
    return [...beforeNames].filter((name) => !afterNames.has(name)).sort((a, b) => a.localeCompare(b));
}

export function buildCompactionAudit(
    head: Message[],
    attachments: Attachment[],
    clearedTools: string[],
    droppedTools: string[]
): CompactionAudit {
    return {
        removedFiles: collectRemovedFiles(head, attachments),
        clearedTools,
        droppedTools,
    };
}

/** Best-effort audit for older boundaries that predate structured audit metadata. */
export function deriveCompactionAudit(
    summarizedMessageIds: MessageId[],
    messagesById: Record<MessageId, Message | undefined>,
    attachments: Attachment[]
): CompactionAudit {
    const summarized = summarizedMessageIds
        .map((id) => messagesById[id])
        .filter((message): message is Message => message !== undefined);

    return {
        removedFiles: collectRemovedFiles(summarized, attachments),
        clearedTools: [],
        droppedTools: [],
    };
}
