// Whether this browser can run the WebCodecs recording backend (mediabunny);
// otherwise we fall back to MediaRecorder.
export const isWebCodecsRecordingSupported = (): boolean => {
    return 'VideoEncoder' in globalThis && 'AudioEncoder' in globalThis;
};
