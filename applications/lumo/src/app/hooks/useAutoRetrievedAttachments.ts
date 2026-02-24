import { useMemo } from 'react';

import { useLumoSelector } from '../redux/hooks';
import { selectAttachments, selectContextFilters } from '../redux/selectors';
import type { Attachment, Message } from '../types';

export type AutoRetrievedAttachment = Attachment & { messageId: string };

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
                        filename: shallowAtt.filename || 'Unknown file',
                    } as Attachment);

                const mergedAtt: AutoRetrievedAttachment = {
                    ...baseAttachment,
                    autoRetrieved: true,
                    isUploadedProjectFile: shallowAtt.isUploadedProjectFile || fullAtt?.isUploadedProjectFile,
                    relevanceScore: shallowAtt.relevanceScore ?? fullAtt?.relevanceScore,
                    messageId: msg.id,
                };

                // Keep highest-relevance copy when the same document appears across multiple messages
                const key = mergedAtt.driveNodeId || mergedAtt.filename;
                const existing = attachmentsByKey.get(key);
                if (!existing || (mergedAtt.relevanceScore ?? 0) > (existing.relevanceScore ?? 0)) {
                    attachmentsByKey.set(key, mergedAtt);
                }
            });
        });

        return Array.from(attachmentsByKey.values()).sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
    }, [messageChain, allAttachmentsState]);

    const isExcluded = (file: AutoRetrievedAttachment) => {
        const filter = contextFilters.find((f: any) => f.messageId === file.messageId);
        return filter ? filter.excludedFiles.includes(file.filename) : false;
    };

    const activeAutoRetrieved = useMemo(
        () => autoRetrievedAttachments.filter((f) => !isExcluded(f)),
        [autoRetrievedAttachments, contextFilters]
    );

    const excludedAutoRetrieved = useMemo(
        () => autoRetrievedAttachments.filter((f) => isExcluded(f)),
        [autoRetrievedAttachments, contextFilters]
    );

    return { autoRetrievedAttachments, activeAutoRetrieved, excludedAutoRetrieved };
};
