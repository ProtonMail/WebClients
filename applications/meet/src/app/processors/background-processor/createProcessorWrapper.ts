import { ProcessorWrapper, type ProcessorWrapperOptions, type TrackTransformer } from '@livekit/track-processors';
import type { ProcessorOptions, Track } from 'livekit-client';

import { isIos } from '@proton/shared/lib/helpers/browser';

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

// Implemented by BaseBackgroundProcessor; structural so the wrapper stays usable
// with any transformer.
type OutputSizeAwareTransformer = {
    setOutputSizeListener?: (listener: ((width: number, height: number) => void) | null) => void;
};

class BackgroundProcessorWrapper<
    TransformerOptions extends Record<string, unknown>,
> extends ProcessorWrapper<TransformerOptions> {
    async init(opts: ProcessorOptions<Track.Kind>) {
        primeFallbackInputElement(opts);

        // The fallback path publishes displayCanvas via captureStream(), drawing every
        // composited frame at the canvas' own dimensions. LiveKit sizes it once from
        // track.getSettings(), which iOS reports transposed, so a 1280x720 composite
        // ends up squeezed into a 720x1280 track.
        if (isIos()) {
            (this.transformer as OutputSizeAwareTransformer).setOutputSizeListener?.((width, height) => {
                const canvas = this.displayCanvas;

                if (!canvas || (canvas.width === width && canvas.height === height)) {
                    return;
                }

                canvas.width = width;
                canvas.height = height;
            });
        }

        await super.init(opts);
    }

    async destroy(...args: Parameters<ProcessorWrapper<TransformerOptions>['destroy']>) {
        (this.transformer as OutputSizeAwareTransformer).setOutputSizeListener?.(null);

        await super.destroy(...args);
    }
}

export const createProcessorWrapper = <TransformerOptions extends Record<string, unknown>>(
    transformer: TrackTransformer<TransformerOptions>,
    name: string,
    options?: ProcessorWrapperOptions
) => new BackgroundProcessorWrapper<TransformerOptions>(transformer, `${name}-${++processorInstanceCount}`, options);
