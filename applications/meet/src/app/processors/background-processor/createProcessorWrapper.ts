import { ProcessorWrapper, type ProcessorWrapperOptions, type TrackTransformer } from '@livekit/track-processors';
import type { ProcessorOptions, Track } from 'livekit-client';

const usesFallbackRenderLoop = () => !ProcessorWrapper.hasModernApiSupport;

let processorInstanceCount = 0;

const primeFallbackInputElement = ({ element, track }: ProcessorOptions<Track.Kind>) => {
    if (!usesFallbackRenderLoop() || !(element instanceof HTMLVideoElement) || !track) {
        return;
    }

    const attachedStream = element.srcObject instanceof MediaStream ? element.srcObject : null;

    if (!attachedStream?.getVideoTracks().some((attachedTrack) => attachedTrack === track)) {
        element.srcObject = new MediaStream([track]);
    }

    element.autoplay = true;
    element.playsInline = true;
    element.muted = true;

    void element.play().catch(() => {
        // LiveKit plays the element again right after init() and reports the failure there.
    });
};

class BackgroundProcessorWrapper<
    TransformerOptions extends Record<string, unknown>,
> extends ProcessorWrapper<TransformerOptions> {
    async init(opts: ProcessorOptions<Track.Kind>) {
        primeFallbackInputElement(opts);

        await super.init(opts);
    }
}

export const createProcessorWrapper = <TransformerOptions extends Record<string, unknown>>(
    transformer: TrackTransformer<TransformerOptions>,
    name: string,
    options?: ProcessorWrapperOptions
) => new BackgroundProcessorWrapper<TransformerOptions>(transformer, `${name}-${++processorInstanceCount}`, options);
