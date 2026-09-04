import { useEffect, useRef, useState } from 'react';

import { LocalVideoTrack } from 'livekit-client';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { createBackgroundProcessor } from '../../../processors/background-processor/createBackgroundProcessor';
import type { BackgroundProcessor } from '../../../processors/background-processor/types';

import '../BackgroundBlurComparison/BlurPreview.scss';

type PreviewStatus = 'loading' | 'ready' | 'error';

interface CustomBackgroundPreviewProps {
    /** Live source stream (camera). */
    stream?: MediaStream;
    /** Image URL background (object URL / data URL). */
    imageUrl: string;
    label: string;
}

export const CustomBackgroundPreview = ({ stream, imageUrl, label }: CustomBackgroundPreviewProps) => {
    const outputRef = useRef<HTMLVideoElement>(null);
    const processorRef = useRef<BackgroundProcessor | null>(null);
    const [status, setStatus] = useState<PreviewStatus>('loading');

    useEffect(() => {
        const output = outputRef.current;
        if (!output || !stream) {
            return;
        }

        let cancelled = false;
        let track: LocalVideoTrack | null = null;
        let processor: BackgroundProcessor | null = null;

        const setup = async () => {
            setStatus('loading');

            const [sourceTrack] = stream.getVideoTracks();
            if (!sourceTrack) {
                throw new Error('No video track in source stream');
            }
            // Clone so the preview drives an independent track.
            const mediaStreamTrack = sourceTrack.clone();
            if (cancelled) {
                mediaStreamTrack.stop();
                return;
            }

            // userProvidedTrack = true: the track is ours, LiveKit must not reacquire it.
            track = new LocalVideoTrack(mediaStreamTrack, undefined, true);

            processor = await createBackgroundProcessor({ type: 'image', imageUrl });
            if (cancelled) {
                await processor?.destroy?.();
                mediaStreamTrack.stop();
                return;
            }
            if (!processor) {
                throw new Error('Custom background is not supported on this device');
            }

            processorRef.current = processor;

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
            processorRef.current = null;
            output.srcObject = null;
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
        // Background changes are handled by the effect below without a rebuild.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stream]);

    // Swap the background live, without rebuilding the segmentation pipeline.
    useEffect(() => {
        void processorRef.current?.setMode?.({ type: 'image', imageUrl });
    }, [imageUrl]);

    const handleOpenFullSize = () => {
        void outputRef.current?.requestFullscreen?.().catch(() => {});
    };

    return (
        <div className="debug-blur-preview bg-weak p-3 flex flex-column gap-2">
            <div className="flex justify-space-between items-center gap-2">
                <span className="debug-blur-preview-label text-semibold color-norm">{label}</span>
                <Button size="small" shape="outline" onClick={handleOpenFullSize} disabled={status !== 'ready'}>
                    {c('Action').t`Full size`}
                </Button>
            </div>
            <div className="debug-blur-preview-video relative overflow-hidden ratio-16/9">
                <video ref={outputRef} autoPlay playsInline muted />
                {status === 'loading' && (
                    <span className="debug-blur-preview-status absolute inset-center">{c('Info').t`Loading…`}</span>
                )}
                {status === 'error' && (
                    <span className="debug-blur-preview-status absolute inset-center">
                        {c('Info').t`Failed to apply custom background`}
                    </span>
                )}
            </div>
        </div>
    );
};
