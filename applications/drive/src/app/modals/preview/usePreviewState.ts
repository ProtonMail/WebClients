import { useCallback, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import type { MaybeNode } from '@proton/drive';
import { AbortError, MemberRole, ProtonDriveError } from '@proton/drive';
import { loadThumbnail, useThumbnail } from '@proton/drive/modules/thumbnails';
import useLoading from '@proton/hooks/useLoading';

import { getNodeEffectiveRole } from '../../utils/sdk/getNodeEffectiveRole';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { ContentPreviewMethod, downloadContent, getContentPreviewMethod } from './content';
import type { Drive } from './interface';
import { getNavigation } from './navigation';
import { getNodeActiveRevisionUid, getNodeMimeType } from './nodeUtils';
import { getEffectivePreviewMethod, resolvePreviewOutput } from './resolvePreviewOutput';
import { useVideoStreaming } from './streaming';
import usePreviewActions from './usePreviewActions';

export function usePreviewState({
    drive,
    nodeUid: passedNodeUid,
    previewableNodeUids,
    onNodeChange,
    verifySignatures = true,
    revisionUid,
}: {
    drive: Drive;
    nodeUid: string;
    previewableNodeUids?: string[];
    onNodeChange?: (nodeUid: string) => void;
    verifySignatures: boolean;
    revisionUid?: string;
}) {
    const [nodeUid, setNodeUid] = useState<string>(passedNodeUid);
    const nodeUidRef = useRef<string>(nodeUid);
    nodeUidRef.current = nodeUid;

    const [node, setNode] = useState<MaybeNode | undefined>(undefined);
    const [isLoading, withIsLoading] = useLoading(true);
    const [isContentLoading, withIsContentLoading] = useLoading(false);
    const [nodeData, setNodeData] = useState<
        { contents: Uint8Array<ArrayBuffer>[]; hasSignatureIssues: boolean } | undefined
    >(undefined);
    const [role, setRole] = useState<MemberRole>();
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

    const activeRevisionUid = node ? getNodeActiveRevisionUid(node) : undefined;

    const thumbnailData = useThumbnail(activeRevisionUid);

    const previewMethod = node ? getContentPreviewMethod(node) : undefined;
    const mimeType = node ? getNodeMimeType(node) : undefined;
    const videoStreaming = useVideoStreaming({ nodeUid, mimeType });
    const effectivePreviewMethod = getEffectivePreviewMethod(previewMethod, node, videoStreaming);

    const shouldIgnoreError = (nodeUid: string, error: unknown) => {
        return nodeUid !== nodeUidRef.current || error instanceof AbortError;
    };

    const loadMetadata = useCallback(() => {
        setNode(undefined);
        setNodeData(undefined);
        setErrorMessage(undefined);
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

    useEffect(() => {
        if (!activeRevisionUid || previewMethod === ContentPreviewMethod.Streaming) {
            return;
        }
        loadThumbnail(drive, {
            nodeUid,
            revisionUid: activeRevisionUid,
            thumbnailTypes: previewMethod === ContentPreviewMethod.Buffer ? ['sd'] : ['sd', 'hd'],
        });
    }, [nodeUid, activeRevisionUid, drive, previewMethod]);

    const loadContents = useCallback(
        (abortSignal: AbortSignal) => {
            if (!node || effectivePreviewMethod !== ContentPreviewMethod.Buffer) {
                return;
            }

            void withIsContentLoading(
                downloadContent(drive, nodeUid, abortSignal, revisionUid)
                    .then(({ contents, hasSignatureIssues }) => {
                        setNodeData({ contents, hasSignatureIssues });
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
        [drive, node, nodeUid, effectivePreviewMethod, revisionUid, withIsContentLoading]
    );

    // Metadata load is triggered by the node UID change.
    useEffect(() => {
        loadMetadata();
    }, [loadMetadata]);
    // To load the contents, we need to know info about the node and load content based on the mimetype etc.
    useEffect(() => {
        const ac = new AbortController();
        loadContents(ac.signal);
        return () => {
            ac.abort();
        };
    }, [loadContents]);

    const directRole = node?.ok ? node.value.directRole : node?.error.directRole;
    const canShare = directRole === MemberRole.Admin;

    const navigation = getNavigation(nodeUid, previewableNodeUids, (newNodeUid) => {
        setNodeUid(newNodeUid);
        setNode(undefined);
        setNodeData(undefined);
        setErrorMessage(undefined);
        onNodeChange?.(newNodeUid);
    });

    const actions = usePreviewActions({ drive, nodeUid, node, nodeData: nodeData?.contents, role });

    const isLargeThumbnailLoading = !thumbnailData?.hdUrl && thumbnailData?.hdStatus !== 'loaded';
    const largeThumbnail = thumbnailData?.hdUrl ? { url: thumbnailData.hdUrl } : undefined;
    const smallThumbnailUrl = thumbnailData?.sdUrl;

    const resolved = resolvePreviewOutput({
        previewMethod,
        node,
        videoStreaming,
        nodeData,
        largeThumbnail,
        smallThumbnailUrl,
        isContentLoading,
        isLargeThumbnailLoading,
        errorMessage,
        verifySignatures,
    });

    return {
        node: {
            nodeUid,
            name: resolved.name,
            mediaType: resolved.mediaType,
            sharedStatus: resolved.sharedStatus,
            displaySize: resolved.displaySize,
            contentSignatureIssueLabel: resolved.contentSignatureIssueLabel,
        },
        content: {
            thumbnailUrl: resolved.thumbnailUrl,
            data: resolved.data,
            videoStreaming: resolved.videoStreaming,
            previewMethod: resolved.effectivePreviewMethod,
        },
        canShare,
        isLoading,
        isContentLoading: resolved.isContentLoading,
        errorMessage,
        navigation,
        actions,
    };
}
