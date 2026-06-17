export type RecordingCodec = {
    mimeType: string;
    extension: string;
};

export type CodecProbeOutcome = 'unsupported' | 'data' | 'flush' | 'timeout' | 'error' | 'throw';
