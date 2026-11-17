import type { RecordingCodec } from './types';

const FALLBACK_MP4_CODEC: RecordingCodec = { mimeType: 'video/mp4', extension: 'mp4' };

export const getFallbackCodec = (): RecordingCodec => {
    return FALLBACK_MP4_CODEC;
};
