import { getApproximateTokenCount } from '../llm/tokenizer';
import { newAttachmentId } from '../redux/slices/core/attachments';
import { SearchService } from '../services/search/searchService';
import type { Attachment, SpaceId } from '../types';
import { getMimeTypeFromName } from './filetypes';
import { parseFileReferences } from './fileReferences';

type IndexDocument = NonNullable<ReturnType<SearchService['retrieveDocumentForMention']>>;

/** Stable key for deduplicating the same document across auto-retrieved and @mentioned attachments. */
export function getAttachmentDocumentKey(att: Pick<Attachment, 'filename' | 'driveNodeId'>): string {
    return (att.driveNodeId || att.filename).toLowerCase();
}

/** Keep one entry per document; prefer auto-retrieved copies when both exist. */
export function dedupeAttachmentsByDocumentKey<T extends Pick<Attachment, 'filename' | 'driveNodeId' | 'autoRetrieved'>>(
    files: T[],
    preferAutoRetrieved = true
): T[] {
    const byKey = new Map<string, T>();

    for (const file of files) {
        const key = getAttachmentDocumentKey(file);
        const existing = byKey.get(key);
        if (!existing) {
            byKey.set(key, file);
            continue;
        }
        if (preferAutoRetrieved && file.autoRetrieved && !existing.autoRetrieved) {
            byKey.set(key, file);
        }
    }

    return Array.from(byKey.values());
}

export function attachmentMatchesFileReference(
    att: Pick<Attachment, 'filename' | 'driveNodeId'>,
    fileName: string,
    driveNodeId?: string
): boolean {
    const lowerName = fileName.toLowerCase();
    if (att.filename.toLowerCase() === lowerName) {
        return true;
    }
    return Boolean(driveNodeId && att.driveNodeId === driveNodeId);
}

function findAttachmentForFileReference(
    fileName: string,
    attachments: Attachment[],
    driveNodeId?: string
): Attachment | undefined {
    return attachments.find((att) => attachmentMatchesFileReference(att, fileName, driveNodeId));
}

function attachmentHasUsableContent(att: Attachment): boolean {
    return Boolean(att.markdown || att.data);
}

function resolveDocumentFromIndex(
    searchService: SearchService,
    fileName: string,
    spaceId?: SpaceId,
    query?: string,
    documentId?: string
): IndexDocument | null {
    return searchService.retrieveDocumentForMention(fileName, spaceId, query, documentId);
}

function resolveDocumentForAttachment(
    attachment: Attachment,
    searchService: SearchService,
    spaceId?: SpaceId,
    query?: string
): IndexDocument | null {
    const documentId =
        attachment.driveNodeId ||
        (attachment.spaceId ? attachment.id : undefined) ||
        undefined;

    return (
        (documentId && resolveDocumentFromIndex(searchService, attachment.filename, spaceId, query, documentId)) ||
        resolveDocumentFromIndex(searchService, attachment.filename, spaceId, query)
    );
}

/**
 * Fill an attachment's markdown from the search index when it has no content yet.
 */
export function fillAttachmentFromSearchIndex(
    attachment: Attachment,
    searchService: SearchService,
    spaceId?: SpaceId,
    query?: string
): Attachment {
    if (attachment.markdown || attachment.data) {
        return attachment;
    }

    // Non-drive attachments still processing cannot be resolved yet.
    if (attachment.processing && !attachment.driveNodeId) {
        return attachment;
    }

    const doc = resolveDocumentForAttachment(attachment, searchService, spaceId, query);
    if (!doc?.content) {
        return attachment;
    }

    return attachmentWithIndexContent(attachment, doc);
}

/**
 * Always overwrite markdown from the live search index for index-backed attachments.
 * Direct user uploads that already carry markdown are left unchanged.
 */
export function refreshAttachmentFromSearchIndex(
    attachment: Attachment,
    searchService: SearchService,
    spaceId?: SpaceId,
    query?: string
): Attachment {
    const isIndexBacked =
        attachment.conversationContext ||
        attachment.driveNodeId ||
        attachment.autoRetrieved ||
        (!attachment.markdown && !attachment.data);

    if (!isIndexBacked) {
        return attachment;
    }

    const doc = resolveDocumentForAttachment(attachment, searchService, spaceId, query);
    if (!doc?.content) {
        return attachment;
    }

    return attachmentWithIndexContent(attachment, doc);
}

function attachmentWithIndexContent(attachment: Attachment, doc: IndexDocument): Attachment {
    return {
        ...attachment,
        filename: doc.name,
        markdown: doc.content,
        rawBytes: doc.size || attachment.rawBytes || new TextEncoder().encode(doc.content).length,
        tokenCount: getApproximateTokenCount(doc.content),
        processing: false,
        ...(doc.isDriveDocument ? { driveNodeId: doc.id } : {}),
        ...(doc.isChunk && {
            isChunk: doc.isChunk,
            chunkTitle: doc.chunkTitle,
        }),
    };
}

/**
 * Resolve @mentioned project/Drive files at send time using the live search index.
 *
 * Text-only @mentions (no composer chip) and re-mentions of already-attached files are
 * both handled here so the LLM always receives current file content.
 */
export async function resolveReferencedFilesForSend(
    content: string,
    existingAttachments: Attachment[],
    userId: string | undefined,
    spaceId: SpaceId | undefined,
    conversationAttachments: Attachment[] = []
): Promise<Attachment[]> {
    if (!userId || !spaceId) {
        return [];
    }

    const references = parseFileReferences(content);
    if (references.length === 0) {
        return [];
    }

    const searchService = SearchService.get(userId);
    await searchService.ensureManifestReady();

    const resolved: Attachment[] = [];

    for (const ref of references) {
        const lowerName = ref.fileName.toLowerCase();
        const existingIdx = existingAttachments.findIndex((att) => att.filename.toLowerCase() === lowerName);

        if (existingIdx >= 0) {
            existingAttachments[existingIdx] = refreshAttachmentFromSearchIndex(
                existingAttachments[existingIdx]!,
                searchService,
                spaceId,
                content
            );
            continue;
        }

        const doc = resolveDocumentFromIndex(searchService, ref.fileName, spaceId, content);
        const driveNodeId = doc?.isDriveDocument ? doc.id : undefined;

        const priorAttachment = findAttachmentForFileReference(
            ref.fileName,
            conversationAttachments,
            driveNodeId
        );
        if (priorAttachment && (attachmentHasUsableContent(priorAttachment) || priorAttachment.autoRetrieved)) {
            continue;
        }

        if (!doc?.content) {
            continue;
        }

        resolved.push({
            id: newAttachmentId(),
            filename: doc.name,
            mimeType: getMimeTypeFromName(doc.name),
            uploadedAt: new Date().toISOString(),
            rawBytes: doc.size || new TextEncoder().encode(doc.content).length,
            markdown: doc.content,
            tokenCount: getApproximateTokenCount(doc.content),
            ...(doc.isDriveDocument ? { driveNodeId: doc.id } : {}),
            conversationContext: true,
            ...(doc.isChunk && {
                isChunk: doc.isChunk,
                chunkTitle: doc.chunkTitle,
            }),
        });
    }

    return resolved;
}

/** Filenames @mentioned in content that already have usable content in the conversation. */
export function referencedFileNamesWithContent(
    content: string,
    attachments: Attachment[],
    conversationAttachments: Attachment[] = []
): Set<string> {
    const references = parseFileReferences(content);
    const names = new Set<string>();
    const allAttachments = [...attachments, ...conversationAttachments];

    for (const ref of references) {
        const lowerName = ref.fileName.toLowerCase();
        const match = findAttachmentForFileReference(ref.fileName, allAttachments);
        if (match && (attachmentHasUsableContent(match) || match.autoRetrieved)) {
            names.add(lowerName);
        }
    }

    return names;
}
