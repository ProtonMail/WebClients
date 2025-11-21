import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import type { MaybeNode } from '@proton/drive';
import { AbortError, MemberRole, ProtonDriveError, useDrive } from '@proton/drive';
import useLoading from '@proton/hooks/useLoading';

import { ContentPreviewMethod, downloadContent, getContentPreviewMethod } from './content';
import { logger } from './logger';
import { getNavigation } from './navigation';
import {
    getNodeActiveRevisionUid,
    getNodeDisplaySize,
    getNodeMimeType,
    getNodeName,
    getSharedStatus,
} from './nodeUtils';
import { getContentSignatureIssue } from './signatures';
import { useVideoStreaming } from './streaming';
import { useThumbnailLoader } from './thumbnails';
import usePreviewActions from './usePreviewActions';

export function usePreviewState({
    nodeUid: passedNodeUid,
    previewableNodeUids,
    onNodeChange,
}: {
    nodeUid: string;
    previewableNodeUids?: string[];
    onNodeChange?: (nodeUid: string) => void;
}) {
    const { drive } = useDrive();

    const [nodeUid, setNodeUid] = useState<string>(passedNodeUid);
    const nodeUidRef = useRef<string>(nodeUid);
    nodeUidRef.current = nodeUid;

    const [node, setNode] = useState<MaybeNode | undefined>(undefined);
    const [isLoading, withIsLoading] = useLoading(false);
    const [isContentLoading, withIsContentLoading] = useLoading(false);
    const [nodeData, setNodeData] = useState<Uint8Array<ArrayBuffer>[] | undefined>(undefined);
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

    const [smallThumbnailUrl, setSmallThumbnailUrl] = useState<string | undefined>(undefined);
    const [largeThumbnail, setLargeThumbnail] = useState<{ url: string; data: Uint8Array<ArrayBuffer>[] } | undefined>(
        undefined
    );
    const { getSmallThumbnailUrl, getLargeThumbnail } = useThumbnailLoader();

    const previewMethod = node ? getContentPreviewMethod(node) : undefined;

    const shouldIgnoreError = (nodeUid: string, error: unknown) => {
        return nodeUid !== nodeUidRef.current || error instanceof AbortError;
    };

    const loadMetadata = () => {
        setNode(undefined);
        setNodeData(undefined);
        setErrorMessage(undefined);
        setSmallThumbnailUrl(undefined);
        setLargeThumbnail(undefined);

        void withIsLoading(
            drive
                .getNode(nodeUid)
                .then((node) => {
                    setNode(node);
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
    };

    const loadSmallThumbnail = () => {
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
    };

    const loadLargeThumbnail = () => {
        void getLargeThumbnail(nodeUid)
            .then((thumbnail) => {
                setLargeThumbnail(thumbnail);
            })
            .catch((error: unknown) => {
                if (shouldIgnoreError(nodeUid, error)) {
                    return;
                }

                logger.debug(`Failed to get large thumbnail: ${error}`);
            });
    };

    const loadContents = (abortSignal: AbortSignal) => {
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
    };

    // Metadata load is triggered by the node UID change.
    useEffect(loadMetadata, [nodeUid]);
    // To load the small thumbnail, we need to know the node info and we need to reload it from the zustand store.
    // TODO: We need to remove the dependency on implementation details.
    useEffect(loadSmallThumbnail, [node, getSmallThumbnailUrl]);
    // To load the large thumbnail, we need only the nodeUid as we use SDK directly.
    useEffect(loadLargeThumbnail, [nodeUid]);
    // To load the contents, we need to know ifno about the node and load content based on the mimetype etc.
    useEffect(() => {
        const ac = new AbortController();
        loadContents(ac.signal);
        return () => {
            ac.abort();
        };
    }, [node]);

    const directRole = node?.ok ? node.value.directRole : node?.error.directRole;
    const canShare = directRole === MemberRole.Admin;

    const videoStreaming = useVideoStreaming({ nodeUid, mimeType: node ? getNodeMimeType(node) : undefined });

    const navigation = getNavigation(nodeUid, previewableNodeUids, (nodeUid) => {
        setNodeUid(nodeUid);
        onNodeChange?.(nodeUid);
    });

    const actions = usePreviewActions({ nodeUid, node, nodeData });

    return {
        node: {
            name: node ? getNodeName(node) : undefined,
            mediaType: node ? getNodeMimeType(node) : undefined,
            sharedStatus: getSharedStatus(node),
            displaySize: getNodeDisplaySize(node),
            contentSignatureIssue: getContentSignatureIssue(node),
        },
        content: {
            thumbnailUrl: largeThumbnail?.url || smallThumbnailUrl,
            data: previewMethod === ContentPreviewMethod.Buffer ? nodeData : largeThumbnail?.data,
            videoStreaming: previewMethod === ContentPreviewMethod.Streaming ? videoStreaming : undefined,
        },
        canShare,
        isLoading,
        isContentLoading,
        errorMessage,
        navigation,
        actions,
    };
}
