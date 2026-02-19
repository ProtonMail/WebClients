import { useCallback, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import type { MaybeNode } from '@proton/drive';
import { AbortError, MemberRole, ProtonDriveError } from '@proton/drive';
import useLoading from '@proton/hooks/useLoading';

import { getNodeDisplaySize } from '../../utils/sdk/getNodeDisplaySize';
import { getNodeEffectiveRole } from '../../utils/sdk/getNodeEffectiveRole';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { ContentPreviewMethod, downloadContent, getContentPreviewMethod } from './content';
import type { Drive } from './interface';
import { logger } from './logger';
import { getNavigation } from './navigation';
import { getNodeActiveRevisionUid, getNodeMimeType, getNodeName, getSharedStatus } from './nodeUtils';
import { getContentSignatureIssue } from './signatures';
import { useVideoStreaming } from './streaming';
import { getLargeThumbnail, useThumbnailLoader } from './thumbnails';
import usePreviewActions from './usePreviewActions';

export function usePreviewState({
    drive,
    nodeUid: passedNodeUid,
    previewableNodeUids,
    onNodeChange,
    verifySignatures = true,
}: {
    drive: Drive;
    nodeUid: string;
    previewableNodeUids?: string[];
    onNodeChange?: (nodeUid: string) => void;
    verifySignatures: boolean;
}) {
    const [nodeUid, setNodeUid] = useState<string>(passedNodeUid);
    const nodeUidRef = useRef<string>(nodeUid);
    nodeUidRef.current = nodeUid;

    const [node, setNode] = useState<MaybeNode | undefined>(undefined);
    const [isLoading, withIsLoading] = useLoading(true);
    const [isContentLoading, withIsContentLoading] = useLoading(false);
    const [nodeData, setNodeData] = useState<Uint8Array<ArrayBuffer>[] | undefined>(undefined);
    const [role, setRole] = useState<MemberRole>();
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

    const [smallThumbnailUrl, setSmallThumbnailUrl] = useState<string | undefined>(undefined);
    const [largeThumbnail, setLargeThumbnail] = useState<{ url: string; data: Uint8Array<ArrayBuffer>[] } | undefined>(
        undefined
    );
    const { getSmallThumbnailUrl } = useThumbnailLoader({ drive });

    const previewMethod = node ? getContentPreviewMethod(node) : undefined;
    const [isLargeThumbnailLoading, withIsLargeThumbnailLoading] = useLoading(false);

    const shouldIgnoreError = (nodeUid: string, error: unknown) => {
        return nodeUid !== nodeUidRef.current || error instanceof AbortError;
    };

    const loadMetadata = useCallback(() => {
        setNode(undefined);
        setNodeData(undefined);
        setErrorMessage(undefined);
        setSmallThumbnailUrl(undefined);
        setLargeThumbnail(undefined);
        void withIsLoading(
            drive
                .getNode(nodeUid)
                .then(async (node) => {
                    setNode(node);
                    const effectiveRole = await getNodeEffectiveRole(getNodeEntity(node).node, drive);
                    setRole(effectiveRole);
                })
                .catch((error) => {
                    if (shouldIgnoreError(nodeUid, error)) {
                        return;
                    }

                    const errorMessage =
                        error instanceof ProtonDriveError ? error.message : c('Error').t`Unknown error`;
                    setErrorMessage(errorMessage);
                })
        );
    }, [drive, nodeUid, withIsLoading]);

    const loadSmallThumbnail = useCallback(() => {
        if (!node) {
            return;
        }

        const activeRevisionUid = getNodeActiveRevisionUid(node);
        if (activeRevisionUid) {
            void getSmallThumbnailUrl(nodeUid, activeRevisionUid)
                .then((url) => {
                    setSmallThumbnailUrl(url);
                })
                .catch((error: unknown) => {
                    if (shouldIgnoreError(nodeUid, error)) {
                        return;
                    }

                    logger.debug(`Failed to get small thumbnail: ${error}`);
                });
        }
    }, [getSmallThumbnailUrl, node, nodeUid]);

    const loadLargeThumbnail = useCallback(() => {
        void withIsLargeThumbnailLoading(
            getLargeThumbnail(drive, nodeUid)
                .then((thumbnail) => {
                    setLargeThumbnail(thumbnail);
                })
                .catch((error: unknown) => {
                    if (shouldIgnoreError(nodeUid, error)) {
                        return;
                    }

                    logger.debug(`Failed to get large thumbnail: ${error}`);
                })
        );
    }, [drive, nodeUid, withIsLargeThumbnailLoading]);

    const loadContents = useCallback(
        (abortSignal: AbortSignal) => {
            if (!node || previewMethod !== ContentPreviewMethod.Buffer) {
                return;
            }

            void withIsContentLoading(
                downloadContent(drive, nodeUid, abortSignal)
                    .then((contents) => {
                        setNodeData(contents);
                    })
                    .catch((error) => {
                        if (shouldIgnoreError(nodeUid, error)) {
                            return;
                        }

                        const errorMessage =
                            error instanceof ProtonDriveError ? error.message : c('Error').t`Unknown error`;
                        setErrorMessage(errorMessage);
                    })
            );
        },
        [drive, node, nodeUid, previewMethod, withIsContentLoading]
    );

    // Metadata load is triggered by the node UID change.
    useEffect(() => {
        loadMetadata();
    }, [loadMetadata]);
    // To load the small thumbnail, we need to know the node info and we need to reload it from the zustand store.
    // TODO: We need to remove the dependency on implementation details.
    useEffect(() => {
        loadSmallThumbnail();
    }, [loadSmallThumbnail]);
    // To load the large thumbnail, we need only the nodeUid as we use SDK directly.
    useEffect(() => {
        loadLargeThumbnail();
    }, [loadLargeThumbnail]);
    // To load the contents, we need to know ifno about the node and load content based on the mimetype etc.
    useEffect(() => {
        const ac = new AbortController();
        loadContents(ac.signal);
        return () => {
            ac.abort();
        };
    }, [loadContents, node]);

    const directRole = node?.ok ? node.value.directRole : node?.error.directRole;
    const canShare = directRole === MemberRole.Admin;

    const mimeType = node ? getNodeMimeType(node) : undefined;
    const videoStreaming = useVideoStreaming({ nodeUid, mimeType });

    const navigation = getNavigation(nodeUid, previewableNodeUids, (nodeUid) => {
        setNodeUid(nodeUid);
        onNodeChange?.(nodeUid);
    });

    const actions = usePreviewActions({ drive, nodeUid, node, nodeData, role });

    const result = {
        node: {
            nodeUid,
            name: node ? getNodeName(node) : undefined,
            mediaType: mimeType,
            sharedStatus: getSharedStatus(node),
            displaySize: node ? getNodeDisplaySize(node) : undefined,
            contentSignatureIssue: verifySignatures ? getContentSignatureIssue(node) : undefined,
        },
        content: {
            thumbnailUrl: largeThumbnail?.url || smallThumbnailUrl,
            data: previewMethod === ContentPreviewMethod.Buffer ? nodeData : largeThumbnail?.data,
            videoStreaming: previewMethod === ContentPreviewMethod.Streaming ? videoStreaming : undefined,
            previewMethod,
        },
        canShare,
        isLoading,
        isContentLoading:
            previewMethod === ContentPreviewMethod.Thumbnail
                ? isContentLoading || isLargeThumbnailLoading
                : isContentLoading,
        errorMessage,
        navigation,
        actions,
    };

    return result;
}
