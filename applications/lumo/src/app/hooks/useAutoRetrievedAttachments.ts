import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { getKnowledgeFileReads } from '../features/client-tools/retrievalTool/knowledgeReads';
import { getSummarizedMessageIds } from '../llm/compaction';
import { useLumoMemoSelector, useLumoSelector } from '../redux/hooks';
import { selectAttachments, selectContextFilters, selectMessagesByConversationId } from '../redux/selectors';
import type { AttachmentMap } from '../redux/slices/core/attachments';
import { SearchService } from '../services/search/searchService';
import { type Attachment, type Message, Role } from '../types';
import { getMimeTypeFromName } from '../util/filetypes';
import { getAttachmentDocumentKey } from '../util/resolveProjectFiles';

export type AutoRetrievedAttachment = Attachment & { messageId: string };

/**
 * Text of the indexed files the lookup tools read that have no attachment to show it from,
 * so they can be previewed. Kept in memory only; the index holds the encrypted copy.
 */
const useIndexedTextOfReadFiles = (messageChain: Message[], attachments: AttachmentMap) => {
    const userId = useLumoSelector((state) => state.user?.value?.ID);
    const [indexedText, setIndexedText] = useState<Record<string, string>>({});
    const missingIds = useMemo(() => {
        const stored = Object.values(attachments);
        return messageChain
            .filter((msg) => msg.role === Role.Assistant)
            .flatMap((msg) => getKnowledgeFileReads(msg).map(({ fileId }) => fileId))
            .filter(
                (fileId) =>
                    !attachments[fileId] &&
                    !stored.some((attachment) => attachment.driveNodeId === fileId) &&
                    indexedText[fileId] === undefined
            );
    }, [messageChain, attachments, indexedText]);
    const missingKey = [...new Set(missingIds)].sort().join(',');

    useEffect(() => {
        if (!userId || !missingKey) {
            return;
        }
        let cancelled = false;
        void (async () => {
            const service = SearchService.get(userId);
            const found: Record<string, string> = {};
            for (const fileId of missingKey.split(',')) {
                const document = await service.getIndexedDocument(fileId).catch(() => undefined);
                found[fileId] = document?.text ?? '';
            }
            if (!cancelled) {
                setIndexedText((previous) => ({ ...previous, ...found }));
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [userId, missingKey]);

    return indexedText;
};

/**
 * Collects, deduplicates, and splits auto-retrieved attachments from a conversation.
 *
 * Auto-retrieved files are injected by RAG for both Drive files and uploaded project files.
 * Drive files carry a driveNodeId; project files only carry autoRetrieved on the shallow
 * attachment. Both sources are deduplicated by driveNodeId (preferred) or filename, keeping
 * the copy with the highest relevance score.
 */
export const useAutoRetrievedAttachments = (messageChain: Message[]) => {
    const allAttachmentsState = useLumoSelector(selectAttachments);
    const contextFilters = useLumoSelector(selectContextFilters);
    const conversationId = messageChain[0]?.conversationId;
    const messageMap = useLumoMemoSelector(selectMessagesByConversationId, [conversationId]);
    const summarizedMessageIds = useMemo(
        () => getSummarizedMessageIds(messageChain, messageMap),
        [messageChain, messageMap]
    );
    const indexedText = useIndexedTextOfReadFiles(messageChain, allAttachmentsState);

    const autoRetrievedAttachments = useMemo<AutoRetrievedAttachment[]>(() => {
        const attachmentsByKey = new Map<string, AutoRetrievedAttachment>();

        messageChain.forEach((msg) => {
            if (!msg.attachments) return;

            msg.attachments.forEach((shallowAtt) => {
                const fullAtt = allAttachmentsState[shallowAtt.id];

                // autoRetrieved may live on the shallow attachment only (project files skip Redux upsert)
                const isAutoRetrieved = shallowAtt.autoRetrieved || fullAtt?.autoRetrieved;
                if (!isAutoRetrieved) return;

                // Drive files without a full attachment have been deleted (e.g. unlinked folder)
                if (shallowAtt.driveNodeId && !fullAtt) {
                    console.log(
                        '[useAutoRetrievedAttachments] Skipping deleted Drive attachment:',
                        shallowAtt.id,
                        shallowAtt.filename
                    );
                    return;
                }

                const baseAttachment =
                    fullAtt ||
                    ({
                        ...shallowAtt,
                        // translator: Fallback name of an automatically retrieved attachment.
                        filename: shallowAtt.filename || c('collider_2025:Label').t`Unknown file`,
                    } as Attachment);

                const mergedAtt: AutoRetrievedAttachment = {
                    ...baseAttachment,
                    autoRetrieved: true,
                    relevanceScore: shallowAtt.relevanceScore ?? fullAtt?.relevanceScore,
                    messageId: msg.id,
                };

                // Keep highest-relevance copy when the same document appears across multiple messages
                const key = getAttachmentDocumentKey(mergedAtt);
                const existing = attachmentsByKey.get(key);
                if (!existing || (mergedAtt.relevanceScore ?? 0) > (existing.relevanceScore ?? 0)) {
                    attachmentsByKey.set(key, mergedAtt);
                }
            });
        });

        // Files the lookup tools read for a reply; ones attached to the chat are listed as such already.
        const attachedIds = new Set(messageChain.flatMap((msg) => msg.attachments?.map(({ id }) => id) ?? []));
        const attachments = Object.values(allAttachmentsState);
        messageChain.forEach((msg) => {
            if (msg.role !== Role.Assistant) return;
            getKnowledgeFileReads(msg).forEach(({ fileId, fileName }) => {
                if (attachedIds.has(fileId)) return;
                const stored =
                    allAttachmentsState[fileId] ?? attachments.find((attachment) => attachment.driveNodeId === fileId);
                const readAtt: AutoRetrievedAttachment = {
                    ...(stored ??
                        ({
                            id: fileId,
                            driveNodeId: fileId,
                            uploadedAt: msg.createdAt,
                            mimeType: getMimeTypeFromName(fileName),
                            markdown: indexedText[fileId],
                        } as Attachment)),
                    filename: fileName,
                    autoRetrieved: true,
                    messageId: msg.id,
                };
                const key = getAttachmentDocumentKey(readAtt);
                if (!attachmentsByKey.has(key)) {
                    attachmentsByKey.set(key, readAtt);
                }
            });
        });

        return Array.from(attachmentsByKey.values()).sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
    }, [messageChain, allAttachmentsState, indexedText]);

    const isExcluded = (file: AutoRetrievedAttachment) => {
        const filter = contextFilters.find((f: any) => f.messageId === file.messageId);
        return filter ? filter.excludedFiles.includes(file.filename) : false;
    };

    const activeAutoRetrieved = useMemo(
        () => autoRetrievedAttachments.filter((f) => !isExcluded(f) && !summarizedMessageIds.has(f.messageId)),
        [autoRetrievedAttachments, contextFilters, summarizedMessageIds]
    );

    const excludedAutoRetrieved = useMemo(
        () => autoRetrievedAttachments.filter((f) => isExcluded(f) && !summarizedMessageIds.has(f.messageId)),
        [autoRetrievedAttachments, contextFilters, summarizedMessageIds]
    );

    const compactedAutoRetrieved = useMemo(
        () => autoRetrievedAttachments.filter((f) => summarizedMessageIds.has(f.messageId)),
        [autoRetrievedAttachments, summarizedMessageIds]
    );

    return { autoRetrievedAttachments, activeAutoRetrieved, excludedAutoRetrieved, compactedAutoRetrieved };
};
