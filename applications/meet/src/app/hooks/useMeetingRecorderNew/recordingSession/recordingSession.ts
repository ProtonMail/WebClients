import type { TrackReference } from '@livekit/components-react';

import { type AudioMixer, createAudioMixer } from '../audioMixer/audioMixer';
import { createChunkWatchdog } from '../chunkWatchdog/chunkWatchdog';
import type { ChunkWatchdog } from '../chunkWatchdog/types';
import type { RecordingCodec } from '../codec/types';
import { type ChunkStats, createChunkStats } from '../mediaRecorder/chunkStats';
import { MeetMediaRecorder } from '../mediaRecorder/meetMediaRecorder';
import { type RecordingStorageClient, createRecordingStorageClient } from '../recordingStorage/client';
import type { RecordingArtifact } from '../recordingStorage/types';
import { VideoMixerClient } from '../videoMixer/client';
import { RECORDING_FPS } from '../videoMixer/constants';
import type { RecordingTrackInfo, SceneState } from '../videoMixer/types';
import type { RecordingSessionDeps, RecordingSessionStartOptions } from './types';

// Orchestrates one recording session: storage + video mixer + audio mixer +
// MediaRecorder + watchdog. The hook talks to this class imperatively
// (`updateScene`, `updateAudioTracks`, ...) and never touches the underlying
// modules directly.
export class RecordingSession {
    private deps: RecordingSessionDeps;
    private storage: RecordingStorageClient | null = null;
    private videoMixer: VideoMixerClient | null = null;
    private audioMixer: AudioMixer | null = null;
    private mediaRecorder: MeetMediaRecorder | null = null;
    private watchdog: ChunkWatchdog | null = null;
    private stats: ChunkStats | null = null;
    private active = false;
    private startTimeMs: number | null = null;
    private audioStartTimeMs: number | null = null;

    constructor(deps: RecordingSessionDeps) {
        this.deps = deps;
    }

    public async start({
        initialScene,
        initialAudioTracks,
        initialRecordedTracks,
    }: RecordingSessionStartOptions): Promise<void> {
        // eslint-disable-next-line no-console
        console.log('[MeetingRecorder] starting recording with', this.deps.codec);

        this.storage = await createRecordingStorageClient(this.deps.codec.extension, this.deps.codec.mimeType);

        this.videoMixer = new VideoMixerClient({
            initialScene,
            reportMeetError: this.deps.reportMeetError,
        });
        this.videoMixer.updateRecordedTracks(initialRecordedTracks);

        this.audioMixer = await createAudioMixer();
        this.audioMixer.updateAudioSources(initialAudioTracks);

        this.stats = createChunkStats();

        const stats = this.stats;
        const reportMeetError = this.deps.reportMeetError;
        const codec = this.deps.codec;
        const storage = this.storage;

        this.mediaRecorder = new MeetMediaRecorder({
            audioTracks: this.audioMixer.getAudioTracks(),
            videoTracks: this.videoMixer.getVideoTracks(),
            primaryCodec: this.deps.codec,
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
                        `[MeetingRecorder] empty chunk #${emptyCount} (chunks with data so far: ${snapshot.chunkCount}, mimeType: ${codec.mimeType}, mediaRecorder.state: ${recorderState})`
                    );
                }

                if (emptyCount === 10 && snapshot.chunkCount === 0) {
                    reportMeetError('MeetingRecording Error: 10 consecutive empty chunks with no data', {
                        context: {
                            emptyChunkCount: emptyCount,
                            mediaRecorderState: recorderState,
                            recordingCodec: codec,
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
                    recordingCodec: codec,
                    chunksWithData: snapshot.chunkCount,
                    emptyChunks: snapshot.emptyChunkCount,
                });
                reportMeetError('MeetingRecording Error: MediaRecorder runtime error', {
                    context: {
                        message: error?.message ?? 'Unknown MediaRecorder error',
                        name: error?.name,
                        state: recorderState,
                        recordingCodec: codec,
                    },
                });

                this.deps.onRuntimeError();
            },
        });

        await this.mediaRecorder.start();

        this.startTimeMs = performance.now();
        this.audioStartTimeMs = this.audioMixer.getAudioContextCurrentTimeMs();

        this.watchdog = createChunkWatchdog({
            stats,
            reportMeetError,
            getRecorderState: () => this.mediaRecorder?.getRecorderState() ?? 'inactive',
            getCodec: () => this.mediaRecorder?.getActiveCodec() ?? this.deps.codec,
        });
        this.watchdog.start();

        this.active = true;

        // eslint-disable-next-line no-console
        console.log('[MeetingRecorder] MediaRecorder started', {
            state: this.mediaRecorder.getRecorderState(),
            recordingCodec: this.mediaRecorder.getActiveCodec(),
        });
    }

    public async stop(): Promise<RecordingArtifact | null> {
        if (!this.active || !this.mediaRecorder || !this.storage) {
            return null;
        }

        const durationMs = this.startTimeMs !== null ? performance.now() - this.startTimeMs : 0;
        const audioDurationMs =
            this.audioMixer !== null && this.audioStartTimeMs !== null
                ? this.audioMixer.getAudioContextCurrentTimeMs() - this.audioStartTimeMs
                : 0;
        const videoFramesEmitted = (await this.videoMixer?.requestFinalFrameCount()) ?? 0;
        const videoDurationMs = (videoFramesEmitted / RECORDING_FPS) * 1000;
        const driftMs = audioDurationMs - videoDurationMs;
        const effectiveFps = durationMs > 0 ? (videoFramesEmitted / durationMs) * 1000 : 0;

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
                duration: (durationMs / 1000).toFixed(3),
                videoDurationSec: (videoDurationMs / 1000).toFixed(3),
                audioDurationSec: (audioDurationMs / 1000).toFixed(3),
                driftSec: (driftMs / 1000).toFixed(3),
                videoFramesEmitted,
                expectedFps: RECORDING_FPS,
                effectiveFps: effectiveFps.toFixed(2),
                codec: this.mediaRecorder?.getActiveCodec(),
            });

            if (driftMs > 300 || driftMs < -300) {
                this.deps.reportMeetError('MeetingRecording Error: drift detected', {
                    context: {
                        duration: (durationMs / 1000).toFixed(3),
                        videoDurationSec: (videoDurationMs / 1000).toFixed(3),
                        audioDurationSec: (audioDurationMs / 1000).toFixed(3),
                        driftSec: (driftMs / 1000).toFixed(3),
                        videoFramesEmitted,
                        expectedFps: RECORDING_FPS,
                        effectiveFps: effectiveFps.toFixed(2),
                        codec: this.mediaRecorder?.getActiveCodec(),
                    },
                });
            }
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
