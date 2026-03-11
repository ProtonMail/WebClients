import type { MaybeNode } from '@proton/drive';

import { getNodeDisplaySize } from '../../utils/sdk/getNodeDisplaySize';
import { ContentPreviewMethod } from './content';
import { getNodeMimeType, getNodeName, getSharedStatus } from './nodeUtils';
import { getContentSignatureIssueLabel } from './signatures';

export type VideoStreamingResult = {
    url: string | undefined;
    onVideoPlaybackError: (error?: unknown) => void;
    isLoading: boolean;
};

export interface PreviewRawState {
    previewMethod: ContentPreviewMethod | undefined;
    node: MaybeNode | undefined;
    videoStreaming: VideoStreamingResult | undefined;
    nodeData: { contents: Uint8Array<ArrayBuffer>[]; hasSignatureIssues: boolean } | undefined;
    largeThumbnail: { url: string } | undefined;
    smallThumbnailUrl: string | undefined;
    isContentLoading: boolean;
    isLargeThumbnailLoading: boolean;
    errorMessage: string | undefined;
    verifySignatures: boolean;
}

export interface PreviewResolvedOutput {
    effectivePreviewMethod: ContentPreviewMethod | undefined;
    thumbnailUrl: string | undefined;
    data: Uint8Array<ArrayBuffer>[] | undefined;
    videoStreaming: VideoStreamingResult | undefined;
    isContentLoading: boolean;
    name: string | undefined;
    mediaType: string | undefined;
    sharedStatus: '' | 'shared' | 'inactive' | undefined;
    displaySize: number | undefined;
    contentSignatureIssueLabel: string | undefined;
}

/**
 * Streaming is the preferred method for video files, but falls back to Buffer
 * when streaming is permanently unavailable (unsupported mime type, broken video,
 * or no Service Worker). During Service Worker initialisation, `videoStreaming`
 * is defined with `isLoading: true`, so this fallback only triggers when
 * streaming is definitively unavailable.
 */
export function getEffectivePreviewMethod(
    previewMethod: ContentPreviewMethod | undefined,
    node: MaybeNode | undefined,
    videoStreaming: VideoStreamingResult | undefined
): ContentPreviewMethod | undefined {
    if (previewMethod === ContentPreviewMethod.Streaming && node !== undefined && videoStreaming === undefined) {
        return ContentPreviewMethod.Buffer;
    }
    return previewMethod;
}

/**
 * Resolves the final preview output from raw state.
 *
 * **thumbnailUrl**: Not returned in Buffer mode until `nodeData` is available. Once
 * content is ready, returns the large thumbnail URL with small as fallback.
 * In all other modes the best available thumbnail is always returned immediately.
 *
 * **data**: In Buffer mode, the full file chunks. In other modes, the large
 * thumbnail data (no full download needed).
 *
 * **isContentLoading**: Each mode has a different definition of "ready":
 * - Thumbnail: waits for both the file content and the large thumbnail.
 * - Buffer: still loading if `nodeData` hasn't arrived yet, unless an error occurred.
 * - Streaming / other: relies solely on `isContentLoading`.
 */
export function resolvePreviewOutput(state: PreviewRawState): PreviewResolvedOutput {
    const effectivePreviewMethod = getEffectivePreviewMethod(state.previewMethod, state.node, state.videoStreaming);

    const thumbnailUrl =
        effectivePreviewMethod === ContentPreviewMethod.Buffer && !state.nodeData
            ? undefined
            : state.largeThumbnail?.url || state.smallThumbnailUrl;

    const data = effectivePreviewMethod === ContentPreviewMethod.Buffer ? state.nodeData?.contents : undefined;

    const videoStreaming = effectivePreviewMethod === ContentPreviewMethod.Streaming ? state.videoStreaming : undefined;

    let isContentLoading: boolean;
    if (effectivePreviewMethod === ContentPreviewMethod.Thumbnail) {
        isContentLoading = state.isContentLoading || state.isLargeThumbnailLoading;
    } else if (effectivePreviewMethod === ContentPreviewMethod.Buffer) {
        const isWaitingForContent = state.node !== undefined && state.nodeData === undefined && !state.errorMessage;
        isContentLoading = state.isContentLoading || isWaitingForContent;
    } else {
        isContentLoading = state.isContentLoading;
    }

    return {
        effectivePreviewMethod,
        thumbnailUrl,
        data,
        videoStreaming,
        isContentLoading,
        name: state.node ? getNodeName(state.node) : undefined,
        mediaType: getNodeMimeType(state.node),
        sharedStatus: getSharedStatus(state.node),
        displaySize: state.node ? getNodeDisplaySize(state.node) : undefined,
        contentSignatureIssueLabel: getContentSignatureIssueLabel(
            state.verifySignatures,
            state.node,
            state.nodeData?.hasSignatureIssues
        ),
    };
}
