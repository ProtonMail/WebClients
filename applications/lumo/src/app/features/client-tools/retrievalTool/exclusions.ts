import type { ContextFilter } from '../../../llm/contextFilter';
import type { Message } from '../../../types';
import { getKnowledgeFileReads } from './knowledgeReads';

export type RetrievalExclusions = {
    /** Attachments the user switched off in this chat. */
    attachmentIds: ReadonlySet<string>;
    /** Their search index documents: the attachment id for uploads, the Drive node for Drive files. */
    documentIds: ReadonlySet<string>;
};

/**
 * Files the user turned off in this chat, which the lookup tools must neither find nor read.
 * Context filters exclude by filename per message, the same way prompt building applies them:
 * a message's attachments, and the files the lookup tools read while writing a reply.
 */
export function collectRetrievalExclusions(chain: Message[], contextFilters: ContextFilter[]): RetrievalExclusions {
    const attachmentIds = new Set<string>();
    const documentIds = new Set<string>();
    for (const message of chain) {
        const excluded = contextFilters.find((filter) => filter.messageId === message.id)?.excludedFiles;
        if (!excluded?.length) {
            continue;
        }
        for (const attachment of message.attachments ?? []) {
            if (excluded.includes(attachment.filename)) {
                attachmentIds.add(attachment.id);
                documentIds.add(attachment.driveNodeId ?? attachment.id);
            }
        }
        for (const read of getKnowledgeFileReads(message)) {
            if (excluded.includes(read.fileName)) {
                attachmentIds.add(read.fileId);
                documentIds.add(read.fileId);
            }
        }
    }
    return { attachmentIds, documentIds };
}
