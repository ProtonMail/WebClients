import { useEffect, useState } from 'react';

import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components';
import { type Author, type MaybeNode, MemberRole, NodeType, generateNodeUid, useDrive } from '@proton/drive';
import { useLoading } from '@proton/hooks';

import { getMimeTypeDescription } from '../../components/sections/helpers';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { getAuthorshipStatus } from './authorship';

export type FileDetails = {
    uid: string;
    hasDecryptionError: boolean;
    authorshipStatus: {
        ok: boolean;
        message: string;
        details: string[];
    };
    name: string;
    location: string;
    createdBy: string;
    lastUploadedBy?: string;
    uploadedTime: Date;
    claimedModifiedTime?: Date;
    isShared?: boolean;
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
    onClose?: () => void;
    volumeId: string;
    linkId: string;

    // Only required for the legacy modal.
    shareId: string;
};

export const useFileDetailsModalState = ({ volumeId, linkId, ...modalProps }: UseFileDetailsModalProps) => {
    const { drive } = useDrive();
    const { handleError } = useSdkErrorHandler();

    const [isLoading, withLoading] = useLoading();
    const [title, setTitle] = useState<string>(getTitle());
    const [hasError, setHasError] = useState<boolean>(false);
    const [details, setDetails] = useState<FileDetails | undefined>();

    useEffect(() => {
        const fetchFileDetails = async () => {
            try {
                const node = await drive.getNode(generateNodeUid(volumeId, linkId));
                setTitle(getTitle(node));

                const fileType = node.ok ? node.value.type : node.error.type;
                const location = await getNodeLocation(drive, node);
                const nodeEntity = node.ok ? node.value : node.error;
                const activeRevision = node.ok
                    ? node.value.activeRevision
                    : node.error.activeRevision?.ok
                      ? node.error.activeRevision.value
                      : undefined;

                setDetails({
                    uid: nodeEntity.uid,
                    hasDecryptionError: hasDecryptionError(node),
                    authorshipStatus: getAuthorshipStatus(node),
                    name: getNodeName(node),
                    location,
                    safeEntityInJson: JSON.stringify({
                        ok: node.ok,
                        uid: nodeEntity.uid,
                        parentUid: nodeEntity.parentUid,
                        keyAuthor: nodeEntity.keyAuthor,
                        nameAuthor: nodeEntity.nameAuthor,
                        directRole: nodeEntity.directRole,
                        type: nodeEntity.type,
                        mediaType: nodeEntity.mediaType,
                        isShared: nodeEntity.isShared,
                        creationTime: nodeEntity.creationTime,
                        totalStorageSize: nodeEntity.totalStorageSize,
                        activeRevision: activeRevision && {
                            uid: activeRevision.uid,
                            contentAuthor: activeRevision.contentAuthor,
                            storageSize: activeRevision.storageSize,
                        },
                        errors: !node.ok ? node.error.errors : undefined,
                    }),
                    fullEntityInJson: JSON.stringify(node),
                    createdBy: getAuthorTitle(nodeEntity.keyAuthor),
                    lastUploadedBy: activeRevision?.contentAuthor
                        ? getAuthorTitle(activeRevision.contentAuthor)
                        : undefined,
                    uploadedTime: nodeEntity.creationTime,
                    claimedModifiedTime: activeRevision?.claimedModificationTime,
                    isShared: isOwnFile(node) ? nodeEntity.isShared : undefined,
                    file:
                        fileType === NodeType.File
                            ? {
                                  descriptiveMediaType: getDescriptiveMediaType(node),
                                  mediaType: nodeEntity.mediaType,
                                  storageSize: activeRevision?.storageSize,
                                  claimedSize: activeRevision?.claimedSize,
                                  claimedSha1: activeRevision?.claimedDigests?.sha1,
                              }
                            : undefined,
                });
            } catch (error: unknown) {
                handleError(error, { showNotification: false, extra: { volumeId, linkId } });
                setHasError(true);
            }
        };
        void withLoading(fetchFileDetails());
    }, [volumeId, linkId, drive]);

    return {
        ...modalProps,
        isLoading,
        title,
        hasError,
        details,
    };
};

function getTitle(node?: MaybeNode): string {
    if (node === undefined) {
        return c('Title').t`Item details`;
    }

    const type = node.ok ? node.value.type : node.error.type;
    if (type === NodeType.File) {
        return c('Title').t`File details`;
    }
    if (type === NodeType.Folder) {
        return c('Title').t`Folder details`;
    }
    if (type === NodeType.Album) {
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

function hasDecryptionError(node: MaybeNode): boolean {
    if (node.ok) {
        return false;
    }

    if (node.error.name.ok === false && node.error.name.error instanceof Error) {
        return true;
    }

    if (node.error.activeRevision?.ok === false) {
        return true;
    }

    if ((node.error.errors?.length || 0) > 0) {
        return true;
    }

    return false;
}

async function getNodeLocation(
    drive: {
        getNode: (uid: string) => Promise<MaybeNode>;
        getMyFilesRootFolder: () => Promise<MaybeNode>;
    },
    node: MaybeNode
): Promise<string> {
    const nodeType = node.ok ? node.value.type : node.error.type;
    if (nodeType === NodeType.Album) {
        return c('Title').t`Photos`;
    }

    if (!isOwnFile(node)) {
        return c('Title').t`Shared with me`;
    }

    const myFilesRootFolder = await drive.getMyFilesRootFolder();
    const myFilesRootFolderUid = myFilesRootFolder.ok ? myFilesRootFolder.value.uid : myFilesRootFolder.error.uid;

    const location = [];

    try {
        let parentNodeUid = getNodeParentUid(node);
        while (parentNodeUid) {
            const parentNode = await drive.getNode(parentNodeUid);
            parentNodeUid = getNodeParentUid(parentNode);
            if (parentNodeUid) {
                location.push(getNodeName(parentNode));
            } else {
                const nodeUid = parentNode.ok ? parentNode.value.uid : parentNode.error.uid;
                if (nodeUid === myFilesRootFolderUid) {
                    location.push(c('Title').t`My files`);
                } else {
                    // Root of the device includes the device name.
                    location.push(getNodeName(parentNode));
                    location.push(c('Title').t`Devices`);
                }
            }
        }
    } catch (error: unknown) {
        console.error(error);
        return c('Error').t`Unknown location`;
    }

    return `/${location.reverse().join('/')}`;
}

function getNodeParentUid(node: MaybeNode): string | undefined {
    if (node.ok) {
        return node.value.parentUid;
    }
    return node.error.parentUid;
}

function getNodeName(node: MaybeNode): string {
    if (node.ok) {
        return node.value.name;
    }
    const maybeName = node.error.name;
    if (maybeName.ok) {
        return maybeName.value;
    }
    if (maybeName.error instanceof Error) {
        return c('Error').t`⚠️ Undecryptable name`;
    }
    // Invalid name can still be used to display the node.
    return maybeName.error.name;
}

function getDescriptiveMediaType(node: MaybeNode): string {
    const nodeType = node.ok ? node.value.type : node.error.type;
    if (nodeType === NodeType.Folder) {
        return c('Title').t`Folder`;
    }
    if (nodeType === NodeType.Album) {
        return c('Title').t`Album`;
    }
    const mediaType = node.ok ? node.value.mediaType : node.error.mediaType;
    return getMimeTypeDescription(mediaType || '');
}

function isOwnFile(node: MaybeNode): boolean {
    const memberRole = node.ok ? node.value.directRole : node.error.directRole;
    return memberRole === MemberRole.Admin;
}
