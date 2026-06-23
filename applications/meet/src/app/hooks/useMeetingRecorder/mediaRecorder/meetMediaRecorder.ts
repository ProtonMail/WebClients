import type { ReportMeetError } from '@proton/meet/hooks/useMeetErrorReporting';

import { getFallbackCodec } from '../codec/getSupportedCodec';
import type { RecordingCodec } from '../codec/types';
import type { RecorderAPI } from '../types';
import type { MeetMediaRecorderOptions } from './types';

const VIDEO_BITS_PER_SECOND = 2_000_000;
const AUDIO_BITS_PER_SECOND = 128_000;
const TIMESLICE_MS = 500;

// Wraps the browser's MediaRecorder with our app concerns:
//   - tries the primary codec, falls back to a known-good codec on EncodingError
//   - splits incoming chunks into "data" vs "empty" callbacks
//   - exposes runtime errors so the hook can clean up
//
// The instance owns one recording session: call `start()` once, then `stop()`.
// Get the active codec via `getActiveCodec()` (it may differ from the primary
// after a fallback).
export class MeetMediaRecorder implements RecorderAPI {
    private mediaRecorder: MediaRecorder | null = null;
    private combinedStream: MediaStream;
    private activeCodec: RecordingCodec;
    private reportMeetError: ReportMeetError;
    private onChunk: (chunk: Blob) => void;
    private onEmptyChunk: () => void;
    private onRuntimeError: (error: Error | null) => void;

    constructor({
        audioTracks,
        videoTracks,
        codec,
        onChunk,
        onEmptyChunk,
        onRuntimeError,
        reportMeetError,
    }: MeetMediaRecorderOptions) {
        this.reportMeetError = reportMeetError;
        this.activeCodec = codec;
        this.onChunk = onChunk;
        this.onEmptyChunk = onEmptyChunk;
        this.onRuntimeError = onRuntimeError;
        this.combinedStream = new MediaStream([...videoTracks, ...audioTracks]);
    }

    public async start(): Promise<void> {
        try {
            this.mediaRecorder = this.createConfiguredRecorder(this.activeCodec.mimeType);
            await this.startRecorder(this.mediaRecorder);
        } catch (error) {
            if (error instanceof DOMException && error.name === 'EncodingError') {
                const fallbackCodec = getFallbackCodec();
                // eslint-disable-next-line no-console
                console.error('[MeetingRecorder] EncodingError with codec, retrying with fallback', {
                    failed: this.activeCodec,
                    fallback: fallbackCodec,
                    error,
                });
                this.reportMeetError('MeetingRecording Error: EncodingError, retrying with fallback codec', {
                    context: { failed: this.activeCodec, fallback: fallbackCodec },
                });

                this.activeCodec = fallbackCodec;
                this.mediaRecorder = this.createConfiguredRecorder(fallbackCodec.mimeType);
                await this.startRecorder(this.mediaRecorder);
            } else {
                throw error;
            }
        }

        // Once the recorder is running, swap onerror to the long-lived runtime
        // handler. The startup handler used by `startRecorder` is no longer
        // needed (it would have rejected the start promise).
        this.mediaRecorder.onerror = (event) => {
            const error = (event as ErrorEvent).error;
            this.onRuntimeError(error ?? null);
        };
    }

    public async stop(): Promise<void> {
        const recorder = this.mediaRecorder;
        if (!recorder) {
            return;
        }

        return new Promise((resolve, reject) => {
            recorder.onstop = () => {
                resolve();
            };

            recorder.onerror = (event) => {
                reject((event as ErrorEvent).error);
            };

            try {
                recorder.stop();
            } catch (error) {
                reject(error);
            }
        });
    }

    public getActiveCodec(): RecordingCodec {
        return this.activeCodec;
    }

    public getRecorderState(): RecordingState {
        return this.mediaRecorder?.state ?? 'inactive';
    }

    private createConfiguredRecorder(codecMimeType: string): MediaRecorder {
        const recorder = new MediaRecorder(this.combinedStream, {
            mimeType: codecMimeType,
            videoBitsPerSecond: VIDEO_BITS_PER_SECOND,
            audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
        });

        recorder.ondataavailable = (event) => {
            if (event.data.size === 0) {
                // The final ondataavailable after stop() is normally empty;
                // ignore it.
                if (recorder.state !== 'recording') {
                    return;
                }
                this.onEmptyChunk();
                return;
            }

            this.onChunk(event.data);
        };

        return recorder;
    }

    private startRecorder(recorder: MediaRecorder): Promise<void> {
        return new Promise((resolve, reject) => {
            recorder.onerror = (event) => {
                reject((event as ErrorEvent).error);
            };

            recorder.onstart = () => {
                // If the encoder failed immediately after start, the state is
                // already 'inactive' — let onerror reject so the fallback
                // logic in `start()` can take over.
                if (recorder.state !== 'recording') {
                    return;
                }
                resolve();
            };

            recorder.start(TIMESLICE_MS);
        });
    }
}
