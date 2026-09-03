import { useEffect, useRef, useState } from 'react';

import { LocalVideoTrack } from 'livekit-client';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { createBackgroundProcessor } from '../../../processors/background-processor/createBackgroundProcessor';
import type { TunableConstantsOverrides } from '../../../processors/background-processor/tunableConstants';
import type { BackgroundBlurProcessor } from '../../../processors/background-processor/types';

import './BlurPreview.scss';

type PreviewStatus = 'loading' | 'ready' | 'error';

interface BlurPreviewProps {
    label: string;
    /** Uploaded video URL. Mutually exclusive with `stream`. */
    fileUrl?: string;
    /** Live source stream. Mutually exclusive with `fileUrl`. */
    stream?: MediaStream;
    /** Pauses playback (upload mode only). */
    paused?: boolean;
    /** Forces the simple segmentation model instead of multiclass. */
    useSimpleSegmentation?: boolean;
    /**
     * Debug-tuner constant overrides. Applied when the processor is created;
     * changing this object rebuilds the whole preview pipeline (new processor +
     * worker), so pass a new reference only when the user applies changes.
     */
    constantOverrides?: TunableConstantsOverrides;
    /** Hides the per-preview header/label (advanced single-preview layout). */
    hideHeader?: boolean;
}

export const BlurPreview = ({
    label,
    fileUrl,
    stream,
    paused = false,
    useSimpleSegmentation = false,
    constantOverrides,
    hideHeader = false,
}: BlurPreviewProps) => {
    const sourceRef = useRef<HTMLVideoElement>(null);
    const outputRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState<PreviewStatus>('loading');

    useEffect(() => {
        const output = outputRef.current;
        if (!output || (!fileUrl && !stream)) {
            return;
        }

        let cancelled = false;
        let track: LocalVideoTrack | null = null;
        let processor: BackgroundBlurProcessor | null = null;

        const getSourceTrack = async (): Promise<MediaStreamTrack> => {
            if (stream) {
                const [videoTrack] = stream.getVideoTracks();
                if (!videoTrack) {
                    throw new Error('No video track in source stream');
                }
                // Clone so each version drives an independent track.
                return videoTrack.clone();
            }

            const source = sourceRef.current;
            if (!source) {
                throw new Error('Missing source element');
            }
            source.src = fileUrl as string;
            source.loop = true;
            source.muted = true;
            source.playsInline = true;
            await source.play();

            // captureStream needs at least one decoded frame to expose a video track.
            if (!source.videoWidth) {
                await new Promise<void>((resolve) => {
                    source.addEventListener('loadeddata', () => resolve(), { once: true });
                });
            }

            const captured = (source as HTMLVideoElement & { captureStream: () => MediaStream }).captureStream();
            const [videoTrack] = captured.getVideoTracks();
            if (!videoTrack) {
                throw new Error('No video track in captured stream');
            }
            return videoTrack;
        };

        const setup = async () => {
            setStatus('loading');

            const mediaStreamTrack = await getSourceTrack();
            if (cancelled) {
                mediaStreamTrack.stop();
                return;
            }

            // userProvidedTrack = true: the track is ours, LiveKit must not reacquire it.
            track = new LocalVideoTrack(mediaStreamTrack, undefined, true);

            processor = await createBackgroundProcessor(useSimpleSegmentation, constantOverrides);
            if (cancelled) {
                await processor?.destroy?.();
                return;
            }
            if (!processor) {
                throw new Error('Background blur is not supported on this device');
            }

            await track.setProcessor(processor, true);
            processor.enable?.();
            track.attach(output);

            if (!cancelled) {
                setStatus('ready');
            }
        };

        void setup().catch(() => {
            if (!cancelled) {
                setStatus('error');
            }
        });

        return () => {
            cancelled = true;
            output.srcObject = null;
            // eslint-disable-next-line react-hooks/exhaustive-deps
            const source = sourceRef.current;
            if (source) {
                source.removeAttribute('src');
                source.load();
            }
            void (async () => {
                try {
                    if (track) {
                        track.detach();
                        track.stop();
                    }
                    await processor?.destroy?.();
                } catch {
                    // Ignore teardown failures
                }
            })();
        };
    }, [fileUrl, stream, useSimpleSegmentation, constantOverrides]);

    // Pausing the source freezes captureStream output (upload mode only).
    useEffect(() => {
        const source = sourceRef.current;
        if (!source || !fileUrl) {
            return;
        }
        if (paused) {
            source.pause();
        } else {
            void source.play().catch(() => {});
        }
    }, [paused, fileUrl, status]);

    const handleOpenFullSize = () => {
        void outputRef.current?.requestFullscreen?.().catch(() => {});
    };

    return (
        <div className="debug-blur-preview bg-weak p-3 flex flex-column gap-2">
            {!hideHeader && (
                <div className="flex justify-space-between items-center gap-2">
                    <span className="debug-blur-preview-label text-semibold color-norm">{label}</span>
                    <Button size="small" shape="outline" onClick={handleOpenFullSize} disabled={status !== 'ready'}>
                        {c('Action').t`Full size`}
                    </Button>
                </div>
            )}
            <div className="debug-blur-preview-video relative overflow-hidden ratio-16/9">
                <video ref={outputRef} autoPlay playsInline muted />
                {status === 'loading' && (
                    <span className="debug-blur-preview-status absolute inset-center">{c('Info').t`Loading…`}</span>
                )}
                {status === 'error' && (
                    <span className="debug-blur-preview-status absolute inset-center">
                        {c('Info').t`Failed to apply background blur`}
                    </span>
                )}
            </div>
            {/* Hidden source element that feeds the capture pipeline (upload mode only). */}
            <video ref={sourceRef} className="hidden" playsInline muted />
        </div>
    );
};
