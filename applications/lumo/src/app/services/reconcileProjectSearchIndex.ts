import type { Attachment, ProjectSpace, Space } from '../types';
import type { DriveDocument } from '../types/documents';

export type Project = Space & ProjectSpace;

export interface ProjectKnowledgeSnapshot {
    spaceId: string;
    hasLinkedDriveFolder: boolean;
    uploadedAttachmentIds: ReadonlySet<string>;
}

export function buildProjectKnowledgeSnapshots(
    spaces: Record<string, Space>,
    attachments: Record<string, Attachment>
): ProjectKnowledgeSnapshot[] {
    const snapshots: ProjectKnowledgeSnapshot[] = [];

    for (const space of Object.values(spaces)) {
        if (!space.isProject) {
            continue;
        }

        const project = space as Project;
        const uploadedAttachmentIds = new Set<string>();

        for (const attachment of Object.values(attachments)) {
            if (
                attachment.spaceId === project.id &&
                attachment.markdown &&
                !attachment.driveNodeId &&
                !attachment.autoRetrieved
            ) {
                uploadedAttachmentIds.add(attachment.id);
            }
        }

        snapshots.push({
            spaceId: project.id,
            hasLinkedDriveFolder: project.linkedDriveFolder !== undefined,
            uploadedAttachmentIds,
        });
    }

    return snapshots;
}

export function buildProjectKnowledgeSnapshot(
    space: Project,
    attachments: Record<string, Attachment>
): ProjectKnowledgeSnapshot {
    const uploadedAttachmentIds = new Set<string>();

    for (const attachment of Object.values(attachments)) {
        if (
            attachment.spaceId === space.id &&
            attachment.markdown &&
            !attachment.driveNodeId &&
            !attachment.autoRetrieved
        ) {
            uploadedAttachmentIds.add(attachment.id);
        }
    }

    return {
        spaceId: space.id,
        hasLinkedDriveFolder: space.linkedDriveFolder !== undefined,
        uploadedAttachmentIds,
    };
}

/**
 * Returns document IDs that should no longer be in the search index for a project.
 * Covers stale Drive docs after unlinking and uploaded files whose attachments were removed.
 */
export function findStaleProjectDocumentIds(
    documents: readonly DriveDocument[],
    projects: readonly ProjectKnowledgeSnapshot[]
): string[] {
    const projectBySpaceId = new Map(projects.map((project) => [project.spaceId, project]));
    const staleIds: string[] = [];

    for (const doc of documents) {
        if (!doc.spaceId) {
            continue;
        }

        const project = projectBySpaceId.get(doc.spaceId);
        if (!project) {
            continue;
        }

        const parentId = doc.parentDocumentId ?? doc.id;
        const isUploadedFile =
            doc.folderPath === 'Uploaded Files' ||
            project.uploadedAttachmentIds.has(doc.id) ||
            project.uploadedAttachmentIds.has(parentId);

        if (isUploadedFile) {
            if (!project.uploadedAttachmentIds.has(doc.id) && !project.uploadedAttachmentIds.has(parentId)) {
                staleIds.push(doc.id);
            }
            continue;
        }

        if (!project.hasLinkedDriveFolder) {
            staleIds.push(doc.id);
        }
    }

    return staleIds;
}
