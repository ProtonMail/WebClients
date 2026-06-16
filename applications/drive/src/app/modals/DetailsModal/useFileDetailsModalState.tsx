import { useEffect, useState } from 'react';

import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components';
import type { Author, NodeEntity, ProtonDriveClient, Revision } from '@proton/drive';
import { MemberRole, NodeType, getDrive } from '@proton/drive';
import { handleSdkError } from '@proton/drive/legacy/errorHandling';
import { getFormattedNodeLocation, getNodeName } from '@proton/drive/modules/nodes';
import { useLoading } from '@proton/hooks';

import { getMimeTypeDescription } from '../../legacy/components/sections/helpers';
import { getAuthorshipStatus } from './authorship';

/**
 * Drive client required by the details modal.
 *
 * To show the details, getNode is required, as it gets the node metadata.
 * Optionally, if the client supports it, getSharingInfo can add ability
 * to show the sharing info.
 */
type Drive = Pick<ProtonDriveClient, 'getNode'> & Partial<Pick<ProtonDriveClient, 'getSharingInfo'>>;

export type FileDetails = {
    uid: string;
    hasDecryptionError: boolean;
    authorshipStatus: {
        ok: boolean;
        message: string;
        details: string[];
    } | null;
    name: string;
    location: string;
    createdBy: string;
    lastUploadedBy?: string;
    uploadedTime: Date;
    claimedModifiedTime?: Date;
    isShared?: boolean;
    numberOfDownloads?: number | string;
    file?: {
        mediaType?: string;
        descriptiveMediaType?: string;
        storageSize?: number;
        claimedSize?: number;
        claimedSha1?: string;
    };
    safeEntityInJson: string;
    fullEntityInJson: string;
};

export type UseFileDetailsModalProps = ModalStateProps & {
    nodeUid: string;
    revision?: Revision;
    drive?: Drive;
    onClose?: () => void;
};

export function useFileDetailsModalState({
    nodeUid,
    revision,
    drive = getDrive(),
    open,
    onClose,
    onExit,
}: UseFileDetailsModalProps) {
    const [isLoading, withLoading] = useLoading();
    const [title, setTitle] = useState<string>(getTitle());
    const [hasError, setHasError] = useState<boolean>(false);
    const [details, setDetails] = useState<FileDetails | undefined>();

    useEffect(() => {
        const fetchFileDetails = async () => {
            try {
                const node = await drive.getNode(nodeUid);
                setTitle(getTitle(node));

                const activeRevision = revision ?? (node.activeRevision?.ok ? node.activeRevision.value : undefined);
                const location = await getFormattedNodeLocation(drive, node);

                const numberOfDownloads =
                    node.directRole === MemberRole.Admin ? await getNumberOfDownloads(drive, nodeUid) : undefined;

                setDetails({
                    uid: node.uid,
                    hasDecryptionError: hasDecryptionError(node),
                    authorshipStatus: getAuthorshipStatus(node),
                    name: getNodeName(node),
                    location,
                    safeEntityInJson: JSON.stringify({
                        uid: node.uid,
                        parentUid: node.parentUid,
                        keyAuthor: node.keyAuthor,
                        nameAuthor: node.nameAuthor,
                        directRole: node.directRole,
                        type: node.type,
                        mediaType: node.mediaType,
                        isShared: node.isShared,
                        creationTime: node.creationTime,
                        totalStorageSize: node.totalStorageSize,
                        activeRevision: activeRevision && {
                            uid: activeRevision.uid,
                            contentAuthor: activeRevision.contentAuthor,
                            storageSize: activeRevision.storageSize,
                        },
                        errors: node.errors,
                    }),
                    fullEntityInJson: JSON.stringify(node),
                    createdBy: getAuthorTitle(node.keyAuthor),
                    lastUploadedBy: activeRevision?.contentAuthor
                        ? getAuthorTitle(activeRevision.contentAuthor)
                        : undefined,
                    uploadedTime: node.creationTime,
                    claimedModifiedTime: activeRevision?.claimedModificationTime,
                    isShared: node.directRole === MemberRole.Admin ? node.isShared : undefined,
                    numberOfDownloads,
                    file:
                        node.type === NodeType.File
                            ? {
                                  descriptiveMediaType: getDescriptiveMediaType(node),
                                  mediaType: node.mediaType,
                                  storageSize: activeRevision?.storageSize,
                                  claimedSize: activeRevision?.claimedSize,
                                  claimedSha1: activeRevision?.claimedDigests?.sha1,
                              }
                            : undefined,
                });
            } catch (error: unknown) {
                handleSdkError(error, { showNotification: false, extra: { nodeUid } });
                setHasError(true);
            }
        };
        void withLoading(fetchFileDetails());
    }, [nodeUid, drive, withLoading, revision]);

    return {
        open,
        onClose,
        onExit,
        isLoading,
        title,
        hasError,
        details,
    };
}

function getTitle(node?: NodeEntity): string {
    if (node === undefined) {
        return c('Title').t`Item details`;
    }

    if (node.type === NodeType.File) {
        return c('Title').t`File details`;
    }
    if (node.type === NodeType.Folder) {
        return c('Title').t`Folder details`;
    }
    if (node.type === NodeType.Album) {
        return c('Title').t`Album details`;
    }
    return c('Title').t`Item details`;
}

function getAuthorTitle(author: Author): string {
    if (author.ok) {
        if (author.value === null) {
            return c('Title').t`Anonymous user`;
        }
        return author.value;
    }
    if (author.error && author.error.claimedAuthor) {
        return author.error.claimedAuthor;
    }
    return c('Title').t`Unknown user`;
}

function hasDecryptionError(node: NodeEntity): boolean {
    if (node.name.ok === false && node.name.error instanceof Error) {
        return true;
    }
    if (node.activeRevision?.ok === false) {
        return true;
    }
    if ((node.errors?.length || 0) > 0) {
        return true;
    }
    return false;
}

async function getNumberOfDownloads(drive: Drive, nodeUid: string): Promise<number | string | undefined> {
    if (!drive.getSharingInfo) {
        return undefined;
    }

    try {
        const sharingInfo = await drive.getSharingInfo(nodeUid);
        if (!sharingInfo?.publicLink) {
            return undefined;
        }
        return sharingInfo.publicLink.numberOfInitializedDownloads;
    } catch (error: unknown) {
        console.error(error);
        return c('Error').t`Unknown number of downloads`;
    }
}

function getDescriptiveMediaType(node: NodeEntity): string {
    if (node.type === NodeType.Folder) {
        return c('Title').t`Folder`;
    }
    if (node.type === NodeType.Album) {
        return c('Title').t`Album`;
    }
    return getMimeTypeDescription(node.mediaType || '');
}
