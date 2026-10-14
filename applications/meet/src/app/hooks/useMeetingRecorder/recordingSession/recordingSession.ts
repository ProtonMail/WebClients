import type { TrackReference } from '@livekit/components-react';

import { logger } from '@proton/logger';
import type { ReportMeetError } from '@proton/meet/hooks/useMeetErrorReporting';
import type { OpfsRecording } from '@proton/meet/store/slices/recordingsSlice';

import { type AudioMixer, type AudioMixerDiagnostics, createAudioMixer } from '../audioMixer/audioMixer';
import { createChunkWatchdog } from '../chunkWatchdog/chunkWatchdog';
import type { ChunkWatchdog } from '../chunkWatchdog/types';
import type { RecordingCodec } from '../codec/types';
import { WebCodecsRecorder } from '../mediaEncoder/webCodecsRecorder';
import { type ChunkStats, createChunkStats } from '../mediaRecorder/chunkStats';
import { MeetMediaRecorder } from '../mediaRecorder/meetMediaRecorder';
import { type RecordingStorageClient, createRecordingStorageClient } from '../recordingStorage/client';
import type { RecorderAPI } from '../types';
import { VideoMixerClient } from '../videoMixer/client';
import type { RecordingTrackInfo, SceneState } from '../videoMixer/types';
import type {
    RecordingDiagnostics,
    RecordingOutcome,
    RecordingSessionOptions,
    RecordingSessionStartOptions,
    RecordingStopReport,
} from './types';

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
    private userId: string;
    private reportMeetError: ReportMeetError;
    private onRuntimeError: () => void;
    private onStorageFull: (hasWrittenData: boolean) => void;
    private onWriteError: (hasWrittenData: boolean) => void;
    private storageFull = false;
    private writeError: string | null = null;
    private startedAt: number | null = null;
    private stopStartedAt: number | null = null;
    private stopFinishedAt: number | null = null;
    private cleanedUpAt: number | null = null;
    private bytesBeforeStop = 0;
    private file: OpfsRecording | null = null;
    private outcome: RecordingOutcome | null = null;
    private outcomeError: string | null = null;
    private finalAudioDiagnostics: AudioMixerDiagnostics | null = null;

    constructor({
        codec,
        isWebCodecs,
        userId,
        reportMeetError,
        onRuntimeError,
        onStorageFull,
        onWriteError,
    }: RecordingSessionOptions) {
        this.codec = codec;
        this.isWebCodecs = isWebCodecs;
        this.userId = userId;
        this.reportMeetError = reportMeetError;
        this.onRuntimeError = onRuntimeError;
        this.onStorageFull = onStorageFull;
        this.onWriteError = onWriteError;
    }

    private handleStorageFull = (hasWrittenData: boolean): void => {
        if (this.storageFull) {
            return;
        }
        this.storageFull = true;

        if (!this.active) {
            return;
        }

        this.onStorageFull(hasWrittenData);
    };

    private handleWriteError = (error: string, hasWrittenData: boolean): void => {
        this.reportMeetError('MeetingRecording Error: Failed to write the recording', {
            context: { error, recordingCodec: this.codec },
        });
        this.writeError = error;

        if (!this.active) {
            return;
        }

        this.onWriteError(hasWrittenData);
    };

    public async start({
        initialScene,
        initialAudioTracks,
        initialRecordedTracks,
        encryptionKey,
    }: RecordingSessionStartOptions): Promise<void> {
        logger.info('[MeetingRecorder] starting recording', {
            codec: this.codec,
            backend: this.isWebCodecs ? 'webcodecs' : 'mediarecorder',
        });

        this.storage = await createRecordingStorageClient({
            fileExtension: this.codec.extension,
            userId: this.userId,
            encryptionKey,
            onStorageFull: this.handleStorageFull,
            onWriteError: this.handleWriteError,
        });

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
                onChunk: (data) => {
                    stats.recordChunk(data.byteLength);
                    void storage.addChunk(data).catch((error) => {
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
                        logger.info(
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
                    });
                },
                onEmptyChunk: () => {
                    const emptyCount = stats.recordEmpty();
                    const snapshot = stats.snapshot();
                    const recorderState = this.mediaRecorder?.getRecorderState() ?? 'inactive';

                    if (emptyCount === 1 || emptyCount % 5 === 0) {
                        logger.warn(
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

                    reportMeetError('MeetingRecording Error: MediaRecorder runtime error', {
                        context: {
                            message: error?.message ?? 'Unknown MediaRecorder error',
                            name: error?.name,
                            state: recorderState,
                            recordingCodec: this.codec,
                            chunksWithData: snapshot.chunkCount,
                            emptyChunks: snapshot.emptyChunkCount,
                        },
                    });

                    this.onRuntimeError();
                },
            });
        }

        await this.mediaRecorder.start();

        if (this.storageFull || this.writeError) {
            await this.mediaRecorder.stop().catch(() => {});
            await storage.clear().catch(() => {});

            throw new Error(
                this.storageFull
                    ? 'Storage is full, the recording could not be started'
                    : `The recording could not be written: ${this.writeError}`
            );
        }

        this.watchdog = createChunkWatchdog({
            stats,
            reportMeetError,
            getRecorderState: () => this.mediaRecorder?.getRecorderState() ?? 'inactive',
            getCodec: () => this.mediaRecorder?.getActiveCodec() ?? this.codec,
            isWebCodecs: this.isWebCodecs,
        });
        this.watchdog.start();

        this.active = true;
        this.startedAt = performance.now();

        logger.info('[MeetingRecorder] recorder started', {
            state: this.mediaRecorder.getRecorderState(),
            recordingCodec: this.mediaRecorder.getActiveCodec(),
        });
    }

    public async stop(): Promise<OpfsRecording | null> {
        if (!this.active || !this.mediaRecorder || !this.storage) {
            return null;
        }

        this.stopStartedAt = performance.now();
        this.bytesBeforeStop = this.stats?.snapshot().totalBytes ?? 0;

        try {
            await this.mediaRecorder.stop();
            this.watchdog?.stop();
            this.watchdog = null;

            this.file = await this.storage.finalize();
            return this.file;
        } finally {
            this.stopFinishedAt = performance.now();
            const snapshot = this.stats?.snapshot();
            logger.info('[MeetingRecorder] recording stopped', {
                chunksWithData: snapshot?.chunkCount,
                emptyChunks: snapshot?.emptyChunkCount,
                firstChunkAt: snapshot?.firstChunkAt,
                lastChunkAt: snapshot?.lastChunkAt,
            });
        }
    }

    public async cleanup(): Promise<void> {
        this.active = false;
        this.cleanedUpAt = performance.now();

        this.watchdog?.stop();
        this.watchdog = null;

        this.videoMixer?.cleanup();
        this.videoMixer = null;

        this.finalAudioDiagnostics = this.audioMixer?.getDiagnostics() ?? null;
        this.audioMixer?.cleanup();
        this.audioMixer = null;

        if (this.storage) {
            this.storage.terminate();
            this.storage = null;
        }

        this.mediaRecorder = null;
    }

    public setOutcome(outcome: RecordingOutcome, error?: unknown): void {
        this.outcome = outcome;
        if (error !== undefined) {
            this.outcomeError = error instanceof Error ? error.message : String(error);
        }
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

    private getStopReport(): RecordingStopReport | null {
        if (this.stopStartedAt === null && this.outcome === null) {
            return null;
        }

        return {
            outcome: this.outcome,
            error: this.outcomeError,
            durationMs:
                this.startedAt !== null && this.stopStartedAt !== null ? this.stopStartedAt - this.startedAt : null,
            stopDurationMs:
                this.stopStartedAt !== null && this.stopFinishedAt !== null
                    ? this.stopFinishedAt - this.stopStartedAt
                    : null,
            bytesBeforeStop: this.bytesBeforeStop,
            file: this.file,
        };
    }

    public getDiagnostics(): RecordingDiagnostics {
        const snapshot = this.stats?.snapshot();

        return {
            isActive: this.active,
            endedAt: this.stopStartedAt ?? this.cleanedUpAt,
            stopReport: this.getStopReport(),
            backend: this.isWebCodecs ? 'webcodecs' : 'mediarecorder',
            mimeType: this.getActiveCodec()?.mimeType ?? this.codec.mimeType,
            recorderState: this.mediaRecorder?.getRecorderState() ?? 'inactive',
            audio: this.audioMixer?.getDiagnostics() ?? this.finalAudioDiagnostics,
            chunkCount: snapshot?.chunkCount ?? 0,
            totalBytes: snapshot?.totalBytes ?? 0,
            emptyChunkCount: snapshot?.emptyChunkCount ?? 0,
            lastChunkAt: snapshot && snapshot.firstChunkAt !== null ? snapshot.lastChunkAt : null,
            pendingWriteCount: this.storage?.getPendingWriteCount() ?? 0,
        };
    }
}
