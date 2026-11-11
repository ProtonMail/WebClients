import { LOADING_FRAMES_PER_SECOND, drawLoadingFrame } from './loadingFrame';

export interface LoadingTrack {
    track: MediaStreamTrack;
    stop: () => void;
}

export const createLoadingTrack = (width: number, height: number, color: string): LoadingTrack | null => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
        return null;
    }

    const startedAtMs = Date.now();
    const draw = () => drawLoadingFrame(context, width, height, Date.now() - startedAtMs, color);
    draw();
    const [track] = canvas.captureStream(LOADING_FRAMES_PER_SECOND).getVideoTracks();
    const timer = setInterval(draw, 1000 / LOADING_FRAMES_PER_SECOND);

    return {
        track,
        stop: () => {
            clearInterval(timer);
            track.stop();
        },
    };
};
