/** Aggregates local and Drive files into a stable, deduplicated FileItem list. */
import { useMemo } from 'react';

import { useLumoSelector } from '../../../redux/hooks';
import { selectAttachments, selectAttachmentsBySpaceId, selectProvisionalAttachments } from '../../../redux/selectors';
import type { Attachment, SpaceId } from '../../../types';
import type { FileItem } from './useFileMentionAutocomplete';

export const EMPTY_FILES: FileItem[] = [];

function computeFileList(
    spaceAttachments: Record<string, any>,
    driveFiles: { id: string; name: string }[],
    allAttachments: Record<string, Attachment>,
    provisionalAttachments: Attachment[]
): FileItem[] {
    const provisionalFiles: FileItem[] = provisionalAttachments
        .filter((attachment) => attachment && !attachment.error && !attachment.processing)
        .map((attachment) => ({
            id: attachment.id,
            name: attachment.filename,
            source: 'local' as const,
            attachment,
            mimeType: attachment.mimeType,
        }));

    const spaceFiles: FileItem[] = Object.values(spaceAttachments)
        .filter((attachment) => {
            const existsInStore = attachment && allAttachments[attachment.id];
            return existsInStore && !attachment.error && !attachment.processing && !attachment.autoRetrieved;
        })
        .map((file) => {
            const attachment = allAttachments[file.id];
            return {
                id: file.id,
                name: file.filename,
                source: 'local' as const,
                attachment,
                mimeType: file.mimeType || attachment?.mimeType,
            };
        });

    const driveFilesList: FileItem[] = driveFiles.map((file) => ({
        id: file.id,
        name: file.name,
        source: 'drive' as const,
        mimeType: undefined,
    }));

    const allFilesCombined = [...provisionalFiles, ...spaceFiles, ...driveFilesList];

    const seen = new Set<string>();
    return allFilesCombined.filter((file) => {
        const key = file.name.toLowerCase();
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

export function useFileInventory(
    spaceId: SpaceId | undefined,
    driveFiles: { id: string; name: string }[]
): FileItem[] {
    const allAttachments = useLumoSelector(selectAttachments);
    const provisionalAttachments = useLumoSelector(selectProvisionalAttachments);
    const rawSpaceAttachments = useLumoSelector(selectAttachmentsBySpaceId(spaceId));

    // Stabilize the spaceAttachments reference: reselect-generated selectors may return a new
    // object on every render even when the content is unchanged. Keying on the sorted ID list
    // means the memo only invalidates when IDs actually change, not on every render.
    const spaceAttachmentIdList = Object.keys(rawSpaceAttachments).sort().join(',');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const spaceAttachments = useMemo(() => rawSpaceAttachments, [spaceAttachmentIdList]);

    return useMemo(() => {
        const files = computeFileList(spaceAttachments, driveFiles, allAttachments, provisionalAttachments);
        return files.length === 0 ? EMPTY_FILES : files;
    }, [spaceAttachments, driveFiles, allAttachments, provisionalAttachments]);
}
