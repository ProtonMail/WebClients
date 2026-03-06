import { ContentPreviewMethod } from './content';
import type { PreviewRawState, VideoStreamingResult } from './resolvePreviewOutput';
import { getEffectivePreviewMethod, resolvePreviewOutput } from './resolvePreviewOutput';

const node = {
    ok: true,
    value: {
        name: 'test-file',
        mediaType: undefined,
        isShared: false,
        trashTime: undefined,
        activeRevision: undefined,
        totalStorageSize: undefined,
    },
} as any;
const nodeData = { contents: [], hasSignatureIssues: false };
const largeThumbnail = { url: 'large-thumb-url', data: [] };
const smallThumbnailUrl = 'small-thumb-url';
const videoStreaming: VideoStreamingResult = {
    url: '/sw/stream/abc',
    onVideoPlaybackError: () => {},
    isLoading: false,
};

const defaults: PreviewRawState = {
    previewMethod: undefined,
    node: undefined,
    videoStreaming: undefined,
    nodeData: undefined,
    largeThumbnail: undefined,
    smallThumbnailUrl: undefined,
    isContentLoading: false,
    isLargeThumbnailLoading: false,
    errorMessage: undefined,
    verifySignatures: true,
};

describe('getEffectivePreviewMethod', () => {
    it('returns Buffer when Streaming method but videoStreaming is undefined (SW unavailable)', () => {
        expect(getEffectivePreviewMethod(ContentPreviewMethod.Streaming, node, undefined)).toBe(
            ContentPreviewMethod.Buffer
        );
    });

    it('returns Streaming when Streaming method and videoStreaming is defined', () => {
        expect(getEffectivePreviewMethod(ContentPreviewMethod.Streaming, node, videoStreaming)).toBe(
            ContentPreviewMethod.Streaming
        );
    });

    it('returns Streaming when Streaming method, videoStreaming undefined, but node is undefined', () => {
        expect(getEffectivePreviewMethod(ContentPreviewMethod.Streaming, undefined, undefined)).toBe(
            ContentPreviewMethod.Streaming
        );
    });

    it('returns Buffer unchanged', () => {
        expect(getEffectivePreviewMethod(ContentPreviewMethod.Buffer, node, undefined)).toBe(
            ContentPreviewMethod.Buffer
        );
    });
});

describe('resolvePreviewOutput — isContentLoading (Buffer)', () => {
    it('returns true when isContentLoading is true', () => {
        const result = resolvePreviewOutput({
            ...defaults,
            previewMethod: ContentPreviewMethod.Buffer,
            isContentLoading: true,
            node,
            nodeData,
        });
        expect(result.isContentLoading).toBe(true);
    });

    it('returns true when node is loaded but nodeData not yet available (render gap)', () => {
        const result = resolvePreviewOutput({
            ...defaults,
            previewMethod: ContentPreviewMethod.Buffer,
            node,
        });
        expect(result.isContentLoading).toBe(true);
    });

    it('returns false when node is not yet loaded', () => {
        const result = resolvePreviewOutput({
            ...defaults,
            previewMethod: ContentPreviewMethod.Buffer,
        });
        expect(result.isContentLoading).toBe(false);
    });

    it('returns false when nodeData is loaded', () => {
        const result = resolvePreviewOutput({
            ...defaults,
            previewMethod: ContentPreviewMethod.Buffer,
            node,
            nodeData,
        });
        expect(result.isContentLoading).toBe(false);
    });

    it('returns false when node is loaded but errored', () => {
        const result = resolvePreviewOutput({
            ...defaults,
            previewMethod: ContentPreviewMethod.Buffer,
            node,
            errorMessage: 'error',
        });
        expect(result.isContentLoading).toBe(false);
    });
});

describe('resolvePreviewOutput — isContentLoading (Thumbnail)', () => {
    it('returns true when isContentLoading', () => {
        const result = resolvePreviewOutput({
            ...defaults,
            previewMethod: ContentPreviewMethod.Thumbnail,
            isContentLoading: true,
        });
        expect(result.isContentLoading).toBe(true);
    });

    it('returns true when isLargeThumbnailLoading', () => {
        const result = resolvePreviewOutput({
            ...defaults,
            previewMethod: ContentPreviewMethod.Thumbnail,
            isLargeThumbnailLoading: true,
        });
        expect(result.isContentLoading).toBe(true);
    });

    it('returns false when neither is loading', () => {
        const result = resolvePreviewOutput({
            ...defaults,
            previewMethod: ContentPreviewMethod.Thumbnail,
        });
        expect(result.isContentLoading).toBe(false);
    });
});

describe('resolvePreviewOutput — isContentLoading (Streaming and unresolved method)', () => {
    it('returns isContentLoading as-is for Streaming', () => {
        expect(
            resolvePreviewOutput({ ...defaults, previewMethod: ContentPreviewMethod.Streaming, isContentLoading: true })
                .isContentLoading
        ).toBe(true);
        expect(
            resolvePreviewOutput({ ...defaults, previewMethod: ContentPreviewMethod.Streaming }).isContentLoading
        ).toBe(false);
    });

    it('returns isContentLoading as-is when previewMethod is undefined', () => {
        expect(
            resolvePreviewOutput({ ...defaults, previewMethod: undefined, isContentLoading: true }).isContentLoading
        ).toBe(true);
        expect(resolvePreviewOutput({ ...defaults, previewMethod: undefined }).isContentLoading).toBe(false);
    });
});

describe('resolvePreviewOutput — thumbnail suppression', () => {
    it('suppresses thumbnailUrl for Buffer when nodeData is not loaded', () => {
        const result = resolvePreviewOutput({
            ...defaults,
            previewMethod: ContentPreviewMethod.Buffer,
            node,
            largeThumbnail,
            smallThumbnailUrl,
        });
        expect(result.thumbnailUrl).toBeUndefined();
    });

    it('restores thumbnailUrl for Buffer once nodeData is loaded', () => {
        const result = resolvePreviewOutput({
            ...defaults,
            previewMethod: ContentPreviewMethod.Buffer,
            node,
            nodeData,
            largeThumbnail,
            smallThumbnailUrl,
        });
        expect(result.thumbnailUrl).toBe('large-thumb-url');
    });

    it('returns smallThumbnailUrl when largeThumbnail is absent but nodeData is loaded', () => {
        const result = resolvePreviewOutput({
            ...defaults,
            previewMethod: ContentPreviewMethod.Buffer,
            node,
            nodeData,
            smallThumbnailUrl,
        });
        expect(result.thumbnailUrl).toBe('small-thumb-url');
    });

    it('returns thumbnailUrl for Thumbnail method regardless of nodeData', () => {
        const result = resolvePreviewOutput({
            ...defaults,
            previewMethod: ContentPreviewMethod.Thumbnail,
            largeThumbnail,
        });
        expect(result.thumbnailUrl).toBe('large-thumb-url');
    });
});

describe('resolvePreviewOutput — data source per method', () => {
    it('returns nodeData.contents for Buffer method', () => {
        const contents = [new Uint8Array([1, 2, 3])] as unknown as Uint8Array<ArrayBuffer>[];
        const result = resolvePreviewOutput({
            ...defaults,
            previewMethod: ContentPreviewMethod.Buffer,
            node,
            nodeData: { contents, hasSignatureIssues: false },
        });
        expect(result.data).toBe(contents);
    });

    it('returns largeThumbnail.data for Thumbnail method', () => {
        const data = [new Uint8Array([4, 5, 6])] as unknown as Uint8Array<ArrayBuffer>[];
        const result = resolvePreviewOutput({
            ...defaults,
            previewMethod: ContentPreviewMethod.Thumbnail,
            largeThumbnail: { url: 'url', data },
        });
        expect(result.data).toBe(data);
    });

    it('returns undefined data for Buffer method when nodeData is not loaded', () => {
        const result = resolvePreviewOutput({
            ...defaults,
            previewMethod: ContentPreviewMethod.Buffer,
            node,
        });
        expect(result.data).toBeUndefined();
    });

    it('returns undefined data for Streaming method', () => {
        const result = resolvePreviewOutput({
            ...defaults,
            previewMethod: ContentPreviewMethod.Streaming,
            node,
            videoStreaming,
        });
        expect(result.data).toBeUndefined();
    });
});

describe('resolvePreviewOutput — videoStreaming is only set for Streaming method', () => {
    it('returns videoStreaming for Streaming method', () => {
        const result = resolvePreviewOutput({
            ...defaults,
            previewMethod: ContentPreviewMethod.Streaming,
            node,
            videoStreaming,
        });
        expect(result.videoStreaming).toBe(videoStreaming);
    });

    it('returns undefined videoStreaming for Buffer method', () => {
        const result = resolvePreviewOutput({
            ...defaults,
            previewMethod: ContentPreviewMethod.Buffer,
            node,
            videoStreaming,
        });
        expect(result.videoStreaming).toBeUndefined();
    });

    it('returns undefined videoStreaming for Thumbnail method', () => {
        const result = resolvePreviewOutput({
            ...defaults,
            previewMethod: ContentPreviewMethod.Thumbnail,
            videoStreaming,
        });
        expect(result.videoStreaming).toBeUndefined();
    });
});

describe('resolvePreviewOutput — streaming fallback when SW is unavailable', () => {
    it('uses Buffer data when Streaming falls back', () => {
        const contents = [new Uint8Array([7, 8, 9])] as unknown as Uint8Array<ArrayBuffer>[];
        const result = resolvePreviewOutput({
            ...defaults,
            previewMethod: ContentPreviewMethod.Streaming,
            node,
            videoStreaming: undefined,
            nodeData: { contents, hasSignatureIssues: false },
        });
        expect(result.effectivePreviewMethod).toBe(ContentPreviewMethod.Buffer);
        expect(result.data).toBe(contents);
        expect(result.videoStreaming).toBeUndefined();
    });

    it('shows loading during render gap when Streaming falls back to Buffer', () => {
        const result = resolvePreviewOutput({
            ...defaults,
            previewMethod: ContentPreviewMethod.Streaming,
            node,
            videoStreaming: undefined,
        });
        expect(result.effectivePreviewMethod).toBe(ContentPreviewMethod.Buffer);
        expect(result.isContentLoading).toBe(true);
    });
});
