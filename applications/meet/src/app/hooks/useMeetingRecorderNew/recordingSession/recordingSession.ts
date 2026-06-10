import type { TrackReference } from '@livekit/components-react';

import type { ReportMeetError } from '@proton/meet/hooks/useMeetErrorReporting';

import { type AudioMixer, createAudioMixer } from '../audioMixer/audioMixer';
import { createChunkWatchdog } from '../chunkWatchdog/chunkWatchdog';
import type { ChunkWatchdog } from '../chunkWatchdog/types';
import type { RecordingCodec } from '../codec/types';
import { WebCodecsRecorder } from '../mediaEncoder/webCodecsRecorder';
import { type ChunkStats, createChunkStats } from '../mediaRecorder/chunkStats';
import { MeetMediaRecorder } from '../mediaRecorder/meetMediaRecorder';
import { type RecordingStorageClient, createRecordingStorageClient } from '../recordingStorage/client';
import type { RecordingArtifact } from '../recordingStorage/types';
import type { RecorderAPI } from '../types';
import { VideoMixerClient } from '../videoMixer/client';
import type { RecordingTrackInfo, SceneState } from '../videoMixer/types';
import type { RecordingSessionOptions, RecordingSessionStartOptions } from './types';

// Orchestrates one recording session: storage + video mixer + audio mixer +
// recorder backend (WebCodecs or MediaRecorder) + watchdog. The hook talks to
// this class imperatively (`updateScene`, `updateAudioTracks`, ...) and never
// touches the underlying modules directly.
export class RecordingSession {
    private storage: RecordingStorageClient | null = null;
    private videoMixer: VideoMixerClient | null = null;
    private audioMixer: AudioMixer | null = null;
    private mediaRecorder: RecorderAPI | null = null;
    private watchdog: ChunkWatchdog | null = null;
    private stats: ChunkStats | null = null;
    private active = false;
    private codec: RecordingCodec;
    private isWebCodecs: boolean;
    private reportMeetError: ReportMeetError;
    private onRuntimeError: () => void;

    constructor({ codec, isWebCodecs, reportMeetError, onRuntimeError }: RecordingSessionOptions) {
        this.codec = codec;
        this.isWebCodecs = isWebCodecs;
        this.reportMeetError = reportMeetError;
        this.onRuntimeError = onRuntimeError;
    }

    public async start({
        initialScene,
        initialAudioTracks,
        initialRecordedTracks,
    }: RecordingSessionStartOptions): Promise<void> {
        // eslint-disable-next-line no-console
        console.log('[MeetingRecorder] starting recording', {
            codec: this.codec,
            backend: this.isWebCodecs ? 'webcodecs' : 'mediarecorder',
        });

        this.storage = await createRecordingStorageClient(this.codec.extension, this.codec.mimeType);

        this.videoMixer = new VideoMixerClient({
            initialScene,
            reportMeetError: this.reportMeetError,
        });
        this.videoMixer.updateRecordedTracks(initialRecordedTracks);

        this.audioMixer = await createAudioMixer();
        this.audioMixer.updateAudioSources(initialAudioTracks);

        this.stats = createChunkStats();

        const stats = this.stats;
        const reportMeetError = this.reportMeetError;
        const storage = this.storage;

        if (this.isWebCodecs) {
            this.mediaRecorder = new WebCodecsRecorder({
                videoMixer: this.videoMixer,
                audioMixer: this.audioMixer,
                codec: this.codec,
                onChunk: (data, position) => {
                    stats.recordChunk(data.byteLength);
                    void storage.addChunk(data, position).catch((error) => {
                        reportMeetError('MeetingRecording Error WebCodecs: Failed to store chunk in OPFS', {
                            context: {
                                error: error instanceof Error ? error.message : String(error),
                                name: error?.name,
                            },
                        });
                    });
                },
            });
        } else {
            this.mediaRecorder = new MeetMediaRecorder({
                audioTracks: this.audioMixer.getAudioTracks(),
                videoTracks: this.videoMixer.getVideoTracks(),
                codec: this.codec,
                reportMeetError,
                onChunk: (chunk) => {
                    const { isFirst, chunkNumber } = stats.recordChunk(chunk.size);
                    if (isFirst) {
                        // eslint-disable-next-line no-console
                        console.log(
                            `[MeetingRecorder] first non-empty chunk: ${chunk.size} bytes (empty chunks before this: ${stats.snapshot().emptyChunkCount})`
                        );
                    }

                    void storage.addChunk(chunk).catch((error) => {
                        reportMeetError('MeetingRecording Error: Failed to store chunk in OPFS', {
                            context: {
                                chunkNumber,
                                error: error instanceof Error ? error.message : String(error),
                                name: error?.name,
                            },
                        });
                        // eslint-disable-next-line no-console
                        console.error(`[MeetingRecorder] failed to store chunk ${chunkNumber} in OPFS:`, error);
                    });
                },
                onEmptyChunk: () => {
                    const emptyCount = stats.recordEmpty();
                    const snapshot = stats.snapshot();
                    const recorderState = this.mediaRecorder?.getRecorderState() ?? 'inactive';

                    if (emptyCount === 1 || emptyCount % 5 === 0) {
                        // eslint-disable-next-line no-console
                        console.warn(
                            `[MeetingRecorder] empty chunk #${emptyCount} (chunks with data so far: ${snapshot.chunkCount}, mimeType: ${this.codec.mimeType}, mediaRecorder.state: ${recorderState})`
                        );
                    }

                    if (emptyCount === 10 && snapshot.chunkCount === 0) {
                        reportMeetError('MeetingRecording Error: 10 consecutive empty chunks with no data', {
                            context: {
                                emptyChunkCount: emptyCount,
                                mediaRecorderState: recorderState,
                                recordingCodec: this.codec,
                            },
                        });
                    }
                },
                onRuntimeError: (error) => {
                    const recorderState = this.mediaRecorder?.getRecorderState() ?? 'inactive';
                    const snapshot = stats.snapshot();

                    // eslint-disable-next-line no-console
                    console.error('[MeetingRecorder] MediaRecorder runtime error:', {
                        message: error?.message ?? 'Unknown MediaRecorder error',
                        name: error?.name,
                        state: recorderState,
                        recordingCodec: this.codec,
                        chunksWithData: snapshot.chunkCount,
                        emptyChunks: snapshot.emptyChunkCount,
                    });
                    reportMeetError('MeetingRecording Error: MediaRecorder runtime error', {
                        context: {
                            message: error?.message ?? 'Unknown MediaRecorder error',
                            name: error?.name,
                            state: recorderState,
                            recordingCodec: this.codec,
                        },
                    });

                    this.onRuntimeError();
                },
            });
        }

        await this.mediaRecorder.start();

        this.watchdog = createChunkWatchdog({
            stats,
            reportMeetError,
            getRecorderState: () => this.mediaRecorder?.getRecorderState() ?? 'inactive',
            getCodec: () => this.mediaRecorder?.getActiveCodec() ?? this.codec,
            isWebCodecs: this.isWebCodecs,
        });
        this.watchdog.start();

        this.active = true;

        // eslint-disable-next-line no-console
        console.log('[MeetingRecorder] recorder started', {
            state: this.mediaRecorder.getRecorderState(),
            recordingCodec: this.mediaRecorder.getActiveCodec(),
        });
    }

    public async stop(): Promise<RecordingArtifact | null> {
        if (!this.active || !this.mediaRecorder || !this.storage) {
            return null;
        }

        try {
            await this.mediaRecorder.stop();
            this.watchdog?.stop();
            this.watchdog = null;

            const artifact = await this.storage.finalize();
            return artifact;
        } finally {
            const snapshot = this.stats?.snapshot();
            // eslint-disable-next-line no-console
            console.log('[MeetingRecorder] recording stopped', {
                chunksWithData: snapshot?.chunkCount,
                emptyChunks: snapshot?.emptyChunkCount,
                firstChunkAt: snapshot?.firstChunkAt,
                lastChunkAt: snapshot?.lastChunkAt,
            });
        }
    }

    public async cleanup(): Promise<void> {
        this.active = false;

        this.watchdog?.stop();
        this.watchdog = null;

        this.videoMixer?.cleanup();
        this.videoMixer = null;

        this.audioMixer?.cleanup();
        this.audioMixer = null;

        if (this.storage) {
            this.storage.terminate();
            this.storage = null;
        }

        this.mediaRecorder = null;
        this.stats = null;
    }

    public updateScene(scene: SceneState): void {
        this.videoMixer?.updateScene(scene);
    }

    public updateAudioTracks(tracks: TrackReference[]): void {
        this.audioMixer?.updateAudioSources(tracks);
    }

    public updateRecordedTracks(tracks: RecordingTrackInfo[]): void {
        this.videoMixer?.updateRecordedTracks(tracks);
    }

    public isActive(): boolean {
        return this.active;
    }

    public getActiveCodec(): RecordingCodec | null {
        return this.mediaRecorder?.getActiveCodec() ?? null;
    }
}
