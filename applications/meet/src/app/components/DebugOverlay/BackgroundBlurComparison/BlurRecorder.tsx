import { useEffect, useRef, useState } from 'react';

import { LocalVideoTrack } from 'livekit-client';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import clsx from '@proton/utils/clsx';

import { createBackgroundProcessor } from '../../../processors/background-processor/createBackgroundProcessor';
import type { BackgroundBlurProcessor } from '../../../processors/background-processor/types';

import './BackgroundBlurComparison.scss';
import './BlurPreview.scss';

type RecordingState = 'idle' | 'preparing' | 'recording';

const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Prefer mp4; fall back to the browser default if mp4 recording isn't supported.
const getRecorderMimeType = (): string | undefined => {
    const candidates = ['video/mp4;codecs=h264', 'video/mp4;codecs=avc1', 'video/mp4'];
    return candidates.find((type) => MediaRecorder.isTypeSupported(type));
};

interface BlurRecorderProps {
    selectedCameraId: string | undefined;
}

export const BlurRecorder = ({ selectedCameraId }: BlurRecorderProps) => {
    const rawVideoRef = useRef<HTMLVideoElement>(null);
    const blurVideoRef = useRef<HTMLVideoElement>(null);

    const [recordingState, setRecordingState] = useState<RecordingState>('idle');
    const [error, setError] = useState(false);

    const rawRecorderRef = useRef<MediaRecorder | null>(null);
    const blurRecorderRef = useRef<MediaRecorder | null>(null);
    const cleanupRef = useRef<(() => Promise<void>) | null>(null);

    const teardown = async () => {
        const cleanup = cleanupRef.current;
        cleanupRef.current = null;
        await cleanup?.();
    };

    const startRecording = async () => {
        setError(false);
        setRecordingState('preparing');

        let rawStream: MediaStream | null = null;
        let clonedTrack: MediaStreamTrack | null = null;
        let blurTrack: LocalVideoTrack | null = null;
        let processor: BackgroundBlurProcessor | null = null;

        try {
            rawStream = await navigator.mediaDevices.getUserMedia({
                video: selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true,
                audio: false,
            });

            if (rawVideoRef.current) {
                rawVideoRef.current.srcObject = rawStream;
                await rawVideoRef.current.play().catch(() => {});
            }

            const [rawVideoTrack] = rawStream.getVideoTracks();
            if (!rawVideoTrack) {
                throw new Error('No video track from camera');
            }

            // Clone so the blur pipeline doesn't disturb the raw recording.
            clonedTrack = rawVideoTrack.clone();
            blurTrack = new LocalVideoTrack(clonedTrack, undefined, true);

            // Same model selection as production.
            processor = await createBackgroundProcessor();
            if (!processor) {
                throw new Error('Background blur is not supported on this device');
            }
            await blurTrack.setProcessor(processor, true);
            processor.enable?.();

            if (blurVideoRef.current) {
                blurTrack.attach(blurVideoRef.current);
            }

            // After setProcessor, mediaStreamTrack is the blurred output.
            const blurStream = new MediaStream([blurTrack.mediaStreamTrack]);

            const mimeType = getRecorderMimeType();
            const extension = mimeType?.startsWith('video/mp4') ? 'mp4' : 'webm';
            const recorderOptions = mimeType ? { mimeType } : undefined;

            const rawChunks: Blob[] = [];
            const blurChunks: Blob[] = [];

            const rawRecorder = new MediaRecorder(rawStream, recorderOptions);
            const blurRecorder = new MediaRecorder(blurStream, recorderOptions);

            rawRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    rawChunks.push(event.data);
                }
            };
            blurRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    blurChunks.push(event.data);
                }
            };

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            rawRecorder.onstop = () => {
                downloadBlob(
                    new Blob(rawChunks, { type: mimeType ?? 'video/webm' }),
                    `camera-raw-${timestamp}.${extension}`
                );
            };
            blurRecorder.onstop = () => {
                downloadBlob(
                    new Blob(blurChunks, { type: mimeType ?? 'video/webm' }),
                    `camera-blur-next-${timestamp}.${extension}`
                );
            };

            rawRecorderRef.current = rawRecorder;
            blurRecorderRef.current = blurRecorder;

            const localRawStream = rawStream;
            const localClonedTrack = clonedTrack;
            const localBlurTrack = blurTrack;
            const localProcessor = processor;
            cleanupRef.current = async () => {
                try {
                    localBlurTrack.detach();
                    localBlurTrack.stop();
                    await localProcessor.destroy?.();
                } catch {
                    // Ignore teardown failures
                }
                localClonedTrack.stop();
                localRawStream.getTracks().forEach((mediaTrack) => mediaTrack.stop());
                if (rawVideoRef.current) {
                    rawVideoRef.current.srcObject = null;
                }
                if (blurVideoRef.current) {
                    blurVideoRef.current.srcObject = null;
                }
            };

            rawRecorder.start();
            blurRecorder.start();
            setRecordingState('recording');
        } catch {
            setError(true);
            setRecordingState('idle');
            try {
                blurTrack?.detach();
                blurTrack?.stop();
                await processor?.destroy?.();
            } catch {
                // Ignore teardown failures
            }
            clonedTrack?.stop();
            rawStream?.getTracks().forEach((mediaTrack) => mediaTrack.stop());
            if (rawVideoRef.current) {
                rawVideoRef.current.srcObject = null;
            }
            if (blurVideoRef.current) {
                blurVideoRef.current.srcObject = null;
            }
        }
    };

    const stopRecording = async () => {
        // Stop recorders first (fires onstop -> download), then tear down tracks.
        rawRecorderRef.current?.stop();
        blurRecorderRef.current?.stop();
        rawRecorderRef.current = null;
        blurRecorderRef.current = null;
        await teardown();
        setRecordingState('idle');
    };

    useEffect(() => {
        return () => {
            rawRecorderRef.current?.stop();
            blurRecorderRef.current?.stop();
            void teardown();
        };
    }, []);

    const isRecording = recordingState === 'recording';
    const isPreparing = recordingState === 'preparing';

    return (
        <div className="debug-section">
            <h3>{c('Title').t`Record raw vs blurred camera`}</h3>
            <p className="debug-empty">
                {c('Info')
                    .t`Record your raw camera feed and the production background blur side by side. Stopping downloads both clips.`}
            </p>

            <div className="mt-2 flex gap-2 flex-wrap mb-4">
                {!isRecording ? (
                    <Button
                        size="small"
                        shape="solid"
                        color="danger"
                        onClick={() => {
                            void startRecording();
                        }}
                        disabled={isPreparing}
                    >
                        {isPreparing ? c('Action').t`Starting…` : c('Action').t`Record`}
                    </Button>
                ) : (
                    <Button
                        size="small"
                        shape="outline"
                        onClick={() => {
                            void stopRecording();
                        }}
                    >
                        {c('Action').t`Stop recording`}
                    </Button>
                )}
            </div>

            {error && <p className="debug-empty">{c('Info').t`Could not start recording.`}</p>}

            <div className={clsx('debug-blur-comparison', !isRecording && 'hidden')}>
                <div className="debug-blur-preview">
                    <div className="debug-blur-preview-header">
                        <span className="debug-blur-preview-label">{c('Label').t`Raw`}</span>
                    </div>
                    <div className="debug-blur-preview-video">
                        <video ref={rawVideoRef} autoPlay playsInline muted />
                    </div>
                </div>
                <div className="debug-blur-preview">
                    <div className="debug-blur-preview-header">
                        <span className="debug-blur-preview-label">{c('Label').t`Blurred (next)`}</span>
                    </div>
                    <div className="debug-blur-preview-video">
                        <video ref={blurVideoRef} autoPlay playsInline muted />
                    </div>
                </div>
            </div>
        </div>
    );
};
