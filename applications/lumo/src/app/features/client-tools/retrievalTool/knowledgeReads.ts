import { findToolResultForCall, getMessageBlocks } from '../../../messageHelpers';
import { type ContentBlock, type Message, type ToolCallBlock, isToolCallBlock } from '../../../types';
import { READ_KNOWLEDGE_TOOL_NAME, SEARCH_KNOWLEDGE_TOOL_NAME } from './schema';

/** A file the read tool returned content of, in one reply. */
export type KnowledgeFileRead = { fileId: string; fileName: string };

const REMOVED_FILE_RESULT = JSON.stringify({
    ok: false,
    error: 'The user removed this file from the conversation. Do not use or repeat what it said.',
});

const parseObject = (value: string | undefined): Record<string, unknown> | undefined => {
    try {
        const parsed = value === undefined ? undefined : JSON.parse(value);
        return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : undefined;
    } catch {
        return undefined;
    }
};

function toolCallName(block: ToolCallBlock): string | undefined {
    const name = (block.toolCall as { name?: unknown } | undefined)?.name ?? parseObject(block.content)?.name;
    return typeof name === 'string' ? name : undefined;
}

const isKnowledgeCall = (block: ContentBlock): block is ToolCallBlock => {
    if (!isToolCallBlock(block)) {
        return false;
    }
    const name = toolCallName(block);
    return name === SEARCH_KNOWLEDGE_TOOL_NAME || name === READ_KNOWLEDGE_TOOL_NAME;
};

/** Files whose content the knowledge tools returned in `message`, once each, in reading order. */
export function getKnowledgeFileReads(message: Message): KnowledgeFileRead[] {
    const blocks = getMessageBlocks(message);
    const reads = new Map<string, KnowledgeFileRead>();
    for (const block of blocks) {
        if (!isKnowledgeCall(block) || toolCallName(block) !== READ_KNOWLEDGE_TOOL_NAME) {
            continue;
        }
        const result = parseObject(findToolResultForCall(blocks, block)?.content);
        const fileId = result?.file_id;
        const fileName = result?.file_name;
        if (result?.ok === true && typeof fileId === 'string' && typeof fileName === 'string' && !reads.has(fileId)) {
            reads.set(fileId, { fileId, fileName });
        }
    }
    return [...reads.values()];
}

function redactResult(content: string, excludedFileIds: ReadonlySet<string>): string {
    const result = parseObject(content);
    if (!result) {
        return content;
    }
    if (typeof result.file_id === 'string' && excludedFileIds.has(result.file_id)) {
        return REMOVED_FILE_RESULT;
    }
    const isExcludedEntry = (entry: unknown) => {
        const fileId = (entry as { file_id?: unknown } | null)?.file_id;
        return typeof fileId === 'string' && excludedFileIds.has(fileId);
    };
    let changed = false;
    const redacted: Record<string, unknown> = { ...result };
    for (const key of ['results', 'mentioned_files']) {
        const list = result[key];
        if (Array.isArray(list) && list.some(isExcludedEntry)) {
            redacted[key] = list.filter((entry) => !isExcludedEntry(entry));
            changed = true;
        }
    }
    return changed ? JSON.stringify(redacted) : content;
}

/**
 * `blocks` with what knowledge lookups returned from excluded files taken out of their results:
 * reads of them, search hits in them and mentions of them. Other tools' results are untouched.
 */
export function redactExcludedKnowledge(blocks: ContentBlock[], excludedFileIds: ReadonlySet<string>): ContentBlock[] {
    if (excludedFileIds.size === 0) {
        return blocks;
    }
    const redacted = new Map<ContentBlock, ContentBlock>();
    for (const block of blocks) {
        if (!isKnowledgeCall(block)) {
            continue;
        }
        const result = findToolResultForCall(blocks, block);
        if (result) {
            const content = redactResult(result.content, excludedFileIds);
            if (content !== result.content) {
                redacted.set(result, { ...result, content, toolResult: undefined });
            }
        }
    }
    return redacted.size === 0 ? blocks : blocks.map((block) => redacted.get(block) ?? block);
}
