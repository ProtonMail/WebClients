export const supportsTrackProcessor = () => {
    return (
        typeof (window as any).MediaStreamTrackProcessor !== 'undefined' &&
        typeof (window as any).VideoFrame !== 'undefined'
    );
};

export const createMediaStreamTrackProcessor = (track: MediaStreamTrack) => {
    try {
        return new MediaStreamTrackProcessor({ track });
    } catch {
        return null;
    }
};
