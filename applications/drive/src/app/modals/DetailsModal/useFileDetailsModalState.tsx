import { useEffect, useState } from 'react';

import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components';
import type { ProtonDriveClient } from '@proton/drive';
import { type Author, type MaybeNode, MemberRole, NodeType, getDrive } from '@proton/drive';
import { useLoading } from '@proton/hooks';

import { getMimeTypeDescription } from '../../components/sections/helpers';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { getFormattedNodeLocation } from '../../utils/sdk/getNodeLocation';
import { getNodeName } from '../../utils/sdk/getNodeName';
import { isOwnFile } from '../../utils/sdk/isOwnFile';
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
    drive?: Drive;
    verifySignatures?: boolean;
    onClose?: () => void;
    /** @deprecated This is temporay helper until we figure out on how to fix it on public page **/
    showLocation?: boolean;
};

export function useFileDetailsModalState({
    nodeUid,
    drive = getDrive(),
    showLocation = true,
    verifySignatures = true,
    open,
    onClose,
    onExit,
}: UseFileDetailsModalProps) {
    const { handleError } = useSdkErrorHandler();

    const [isLoading, withLoading] = useLoading();
    const [title, setTitle] = useState<string>(getTitle());
    const [hasError, setHasError] = useState<boolean>(false);
    const [details, setDetails] = useState<FileDetails | undefined>();

    useEffect(() => {
        const fetchFileDetails = async () => {
            try {
                const node = await drive.getNode(nodeUid);
                setTitle(getTitle(node));

                const fileType = node.ok ? node.value.type : node.error.type;
                const location = showLocation ? await getFormattedNodeLocation(drive, node) : '';
                const nodeEntity = node.ok ? node.value : node.error;
                // eslint-disable-next-line no-nested-ternary
                const activeRevision = node.ok
                    ? node.value.activeRevision
                    : node.error.activeRevision?.ok
                      ? node.error.activeRevision.value
                      : undefined;
                const numberOfDownloads =
                    nodeEntity.directRole === MemberRole.Admin ? await getNumberOfDownloads(drive, nodeUid) : undefined;

                setDetails({
                    uid: nodeEntity.uid,
                    hasDecryptionError: hasDecryptionError(node),
                    authorshipStatus: verifySignatures ? getAuthorshipStatus(node) : null,
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
                    numberOfDownloads,
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
                handleError(error, { showNotification: false, extra: { nodeUid } });
                setHasError(true);
            }
        };
        void withLoading(fetchFileDetails());
    }, [nodeUid, drive, withLoading, handleError, verifySignatures]);

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
