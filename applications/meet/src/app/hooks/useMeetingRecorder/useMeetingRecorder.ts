import { useEffect, useRef } from 'react';

import { useRoomContext, useTracks } from '@livekit/components-react';
import { RemoteTrackPublication, RoomEvent, Track } from 'livekit-client';
import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectParticipantDecryptedNameMap } from '@proton/meet/store/slices/meetingInfo';
import {
    addParticipantRecording,
    removeParticipantRecording,
    selectIsLocalParticipantRecording,
    setIsLocalRecording,
    startLocalRecordingTimer,
    stopLocalRecordingTimer,
} from '@proton/meet/store/slices/recordingStatusSlice';
import { useFlag } from '@proton/unleash/useFlag';

import { useSortedPagedParticipants } from '../../contexts/ParticipantsProvider/SortedParticipantsProvider';
import { RecordingStatus } from '../../types';
import { calculateGridLayout } from '../../utils/calculateGridLayout';
import { useIsLargerThanMd } from '../useIsLargerThanMd';
import { useIsNarrowHeight } from '../useIsNarrowHeight';
import { useStableCallback } from '../useStableCallback';
import { RECORDING_FPS } from './constants';
import { getFallbackCodec, getSupportedRecordingCodec } from './getSupportedCodec';
import { MessageType } from './recordingWorkerTypes';
import type { FrameReaderInfo, RecordingCodec, RecordingTrackInfo } from './types';
import { useRecordingStatusPublish } from './useRecordingStatusPublish';
import { createMediaStreamTrackProcessor, getTracksForRecording, supportsTrackProcessor } from './utils';
import { forwardWorkerLog } from './workerLogger';
import { WorkerRecordingStorage } from './workerStorage';

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

let recordingCodec: RecordingCodec;

// Preload supported recording codec
void getSupportedRecordingCodec().then((codec) => {
    recordingCodec = codec;
});

export function useMeetingRecorder() {
    const isMeetMultipleRecordingEnabled = useFlag('MeetMultipleRecording');

    const room = useRoomContext();
    const dispatch = useMeetDispatch();
    const isLargerThanMd = useIsLargerThanMd();
    const { reportMeetError } = useMeetErrorReporting();
    const { createNotification } = useNotifications();

    const pagedParticipants = useSortedPagedParticipants();
    const participantDecryptedNameMap = useMeetSelector(selectParticipantDecryptedNameMap);

    const isNarrowHeight = useIsNarrowHeight();

    const isLocalRecording = useMeetSelector(selectIsLocalParticipantRecording);

    const publishRecordingStatus = useRecordingStatusPublish(
        isLocalRecording ? RecordingStatus.Started : RecordingStatus.Stopped
    );

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const renderWorkerRef = useRef<Worker | null>(null);
    const frameReadersRef = useRef<Map<string, FrameReaderInfo>>(new Map());
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
    const audioCompressorRef = useRef<DynamicsCompressorNode | null>(null);
    const audioSourceNodesRef = useRef<Map<string, { source: MediaStreamAudioSourceNode; stream: MediaStream }>>(
        new Map()
    );
    const silentSourceRef = useRef<{ source: ConstantSourceNode; gain: GainNode } | null>(null);
    const startTimeRef = useRef<number>(0);
    const activeRecordingCodecRef = useRef<RecordingCodec>(recordingCodec);
    const workerStorageRef = useRef<WorkerRecordingStorage | null>(null);
    const visibilityListenerRef = useRef<(() => void) | null>(null);
    const pendingChunkWrites = useRef<Set<Promise<void>>>(new Set());
    const chunkStatsRef = useRef({
        chunkCount: 0,
        emptyChunkCount: 0,
        lastChunkAt: 0,
        firstChunkAt: 0 as number | null,
        watchdogWarned: false,
    });
    const chunkWatchdogRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const cameraTracks = useTracks([Track.Source.Camera]);
    const screenShareTracks = useTracks([Track.Source.ScreenShare]);
    const audioTracks = useTracks([Track.Source.Microphone, Track.Source.ScreenShareAudio]);

    const renderInfoRef = useRef({
        cameraTracks,
        screenShareTracks,
        audioTracks,
        pagedParticipants,
        participantDecryptedNameMap,
    });

    renderInfoRef.current = {
        cameraTracks,
        screenShareTracks,
        audioTracks,
        pagedParticipants,
        participantDecryptedNameMap,
    };

    const getRecordedTracks = () => {
        return getTracksForRecording(
            renderInfoRef.current.pagedParticipants,
            renderInfoRef.current.cameraTracks,
            renderInfoRef.current.screenShareTracks
        );
    };

    const prepareRenderState = () => {
        const tracks = getRecordedTracks();
        const participants = tracks.map((track) => {
            const audioPublication = Array.from(track.participant.trackPublications.values()).find(
                (pub) => pub.kind === Track.Kind.Audio && pub.track
            );
            const hasActiveAudio = audioPublication ? !audioPublication.isMuted : false;

            return {
                identity: track.participant?.identity || '',
                name: renderInfoRef.current.participantDecryptedNameMap[track.participant?.identity || ''] || 'Unknown',
                participantIndex: track.participantIndex,
                isScreenShare: track.isScreenShare,
                hasVideo: Boolean(track.track && !track.track.isMuted),
                hasActiveAudio,
            };
        });

        return {
            participants,
            isLargerThanMd,
            isNarrowHeight,
            gridLayout: calculateGridLayout(participants.length, !isLargerThanMd || isNarrowHeight),
        };
    };

    const stopRendererWorker = () => {
        if (renderWorkerRef.current) {
            renderWorkerRef.current.postMessage({ type: 'stop' });
            renderWorkerRef.current.terminate();
            renderWorkerRef.current = null;
        }
    };

    const stopChunkWatchdog = () => {
        if (chunkWatchdogRef.current) {
            clearInterval(chunkWatchdogRef.current);
            chunkWatchdogRef.current = null;
        }
    };

    const cleanUpVisibilityListener = () => {
        if (visibilityListenerRef.current) {
            document.removeEventListener('visibilitychange', visibilityListenerRef.current);
            visibilityListenerRef.current = null;
        }
    };

    const cleanUpAudioResources = () => {
        audioSourceNodesRef.current.forEach(({ source }) => {
            source.disconnect();
        });
        audioSourceNodesRef.current.clear();

        // Clean up the silent keepalive source
        if (silentSourceRef.current) {
            silentSourceRef.current.source.stop();
            silentSourceRef.current.source.disconnect();
            silentSourceRef.current.gain.disconnect();
            silentSourceRef.current = null;
        }

        if (audioCompressorRef.current) {
            audioCompressorRef.current.disconnect();
            audioCompressorRef.current = null;
        }

        if (audioContextRef.current) {
            void audioContextRef.current.close();
            audioContextRef.current = null;
        }

        audioDestinationRef.current = null;
    };

    const startFrameCaptureWithProcessor = (trackInfo: RecordingTrackInfo, participantKey: string) => {
        const mediaTrack = trackInfo.track?.mediaStreamTrack;
        if (!mediaTrack || !renderWorkerRef.current) {
            return false;
        }

        const trackId = trackInfo.track?.sid || `track-${Date.now()}`;

        // In Chrome we use MediaStreamTrackProcessor in main thread
        if (supportsTrackProcessor()) {
            const processor = createMediaStreamTrackProcessor(mediaTrack);

            if (!processor) {
                return false;
            }

            const reader = processor.readable.getReader();

            const minFrameInterval = 1000 / RECORDING_FPS;
            let lastProcessedTime = 0;

            frameReadersRef.current.set(trackId, {
                reader,
                participantKey,
            });

            const pump = async () => {
                try {
                    while (frameReadersRef.current.has(trackId)) {
                        const { value: frame, done } = await reader.read();
                        if (done) {
                            break;
                        }

                        if (frame) {
                            const now = performance.now();
                            const timeSinceLastFrame = now - lastProcessedTime;

                            if (timeSinceLastFrame < minFrameInterval) {
                                frame.close();
                                continue;
                            }

                            if (renderWorkerRef.current) {
                                try {
                                    // Convert to ImageBitmap for broader compatibility
                                    const bitmap = await createImageBitmap(frame);
                                    frame.close();

                                    renderWorkerRef.current.postMessage(
                                        {
                                            type: 'updateFrame',
                                            frameData: { participantIdentity: participantKey, frame: bitmap },
                                        },
                                        [bitmap]
                                    );
                                    lastProcessedTime = now;
                                } catch (err) {
                                    frame.close();
                                }
                            } else {
                                frame.close();
                            }
                        }
                    }
                } catch {
                    // Reader was cancelled or track ended - expected during cleanup
                }
            };

            void pump();
            return true;
        }

        // Safari approach: Send track to worker, let worker create MediaStreamTrackProcessor
        frameReadersRef.current.set(trackId, {
            reader: null,
            participantKey,
        });

        renderWorkerRef.current.postMessage({
            type: 'startTrackCapture',
            trackData: {
                participantIdentity: participantKey,
                track: mediaTrack,
                trackId,
            },
        });

        return true;
    };

    const startFrameCapture = (trackInfo: RecordingTrackInfo) => {
        if (!trackInfo.track || trackInfo.track.isMuted) {
            return;
        }

        const participantKey = trackInfo.isScreenShare
            ? `${trackInfo.participant?.identity || ''}-screenshare`
            : trackInfo.participant?.identity || '';

        startFrameCaptureWithProcessor(trackInfo, participantKey);
    };

    const stopFrameCapture = (trackId: string) => {
        const readerInfo = frameReadersRef.current.get(trackId);
        if (!readerInfo) {
            return;
        }

        // Chrome case
        if (readerInfo.reader) {
            void readerInfo.reader.cancel();
        } else if (renderWorkerRef.current) {
            // Safari case: stop track processor in worker
            renderWorkerRef.current.postMessage({
                type: 'stopTrackCapture',
                trackId,
            });
        }

        frameReadersRef.current.delete(trackId);
    };

    const stopAllFrameCaptures = () => {
        frameReadersRef.current.forEach((_, trackId) => {
            stopFrameCapture(trackId);
        });
        frameReadersRef.current.clear();
    };

    const updateAudioSources = () => {
        const compressor = audioCompressorRef.current;
        const audioContext = audioContextRef.current;

        if (!compressor || !audioContext) {
            return;
        }

        const currentAudioTracks = renderInfoRef.current.audioTracks;

        const activeTrackIds = new Set<string>();

        currentAudioTracks.forEach((trackRef) => {
            const track = trackRef.publication.track;

            if (track && track.mediaStreamTrack && !trackRef.publication.isMuted) {
                const trackId = track.sid || `${trackRef.participant.identity}-${trackRef.source}`;

                if (track.mediaStreamTrack.readyState === 'ended') {
                    return;
                }

                activeTrackIds.add(trackId);

                const stored = audioSourceNodesRef.current.get(trackId);
                const storedTrackId = stored?.stream.getAudioTracks()[0]?.id;
                const currentTrackId = track.mediaStreamTrack.id;

                if (!stored || storedTrackId !== currentTrackId) {
                    stored?.source.disconnect();

                    const stream = new MediaStream([track.mediaStreamTrack]);
                    const source = audioContext.createMediaStreamSource(stream);
                    source.connect(compressor);
                    audioSourceNodesRef.current.set(trackId, { source, stream });
                }
            }
        });

        audioSourceNodesRef.current.forEach(({ source }, trackId) => {
            if (!activeTrackIds.has(trackId)) {
                source.disconnect();
                audioSourceNodesRef.current.delete(trackId);
            }
        });

        if (audioContext.state === 'suspended') {
            void audioContext.resume();
        }
    };

    const waitForDestinationAudioTrack = async (stream: MediaStream): Promise<MediaStreamTrack> => {
        const existingTrack = stream.getAudioTracks()[0];
        if (existingTrack) {
            return existingTrack;
        }

        return new Promise<MediaStreamTrack>((resolve) => {
            const handleAddTrack = (event: MediaStreamTrackEvent) => {
                if (event.track.kind === 'audio') {
                    stream.removeEventListener('addtrack', handleAddTrack);
                    resolve(event.track);
                }
            };

            stream.addEventListener('addtrack', handleAddTrack);
        });
    };

    const setupAudioMixing = async () => {
        const audioContext = new AudioContext();

        const compressor = audioContext.createDynamicsCompressor();
        compressor.threshold.value = -24;
        compressor.knee.value = 30;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;

        const destination = audioContext.createMediaStreamDestination();
        compressor.connect(destination);

        const silentSource = audioContext.createConstantSource();
        silentSource.offset.value = 0;
        const silentGain = audioContext.createGain();
        silentGain.gain.value = 0;
        silentSource.connect(silentGain);
        silentGain.connect(compressor);
        silentSource.start();
        silentSourceRef.current = { source: silentSource, gain: silentGain };

        audioContextRef.current = audioContext;
        audioDestinationRef.current = destination;
        audioCompressorRef.current = compressor;

        if (audioContext.state === 'suspended') {
            void audioContext.resume();
        }

        const handleVisibilityChange = () => {
            if (audioContextRef?.current?.state === 'suspended') {
                void audioContextRef.current.resume();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        visibilityListenerRef.current = handleVisibilityChange;

        await waitForDestinationAudioTrack(destination.stream);

        return { stream: destination.stream };
    };

    const startMediaRecorder = (mediaRecorder: MediaRecorder): Promise<void> => {
        return new Promise((resolve, reject) => {
            mediaRecorder.onerror = (event) => {
                reject(event.error);
            };

            mediaRecorder.onstart = () => {
                // If the encoder failed immediately after start, the state is already
                // 'inactive'. Don't resolve — onerror will fire next and reject with
                // EncodingError so the retry/fallback logic can handle it.
                if (mediaRecorder.state !== 'recording') {
                    return;
                }

                resolve();
            };

            mediaRecorder.start(500);
        });
    };

    const cleanupRecordingResources = () => {
        stopChunkWatchdog();
        stopAllFrameCaptures();
        stopRendererWorker();
        cleanUpAudioResources();
        cleanUpVisibilityListener();
        mediaRecorderRef.current = null;

        dispatch(stopLocalRecordingTimer());
        if (isMeetMultipleRecordingEnabled) {
            dispatch(removeParticipantRecording(room.localParticipant.identity));
        } else {
            dispatch(setIsLocalRecording(false));
        }
    };

    const startRecording = useStableCallback(async () => {
        // eslint-disable-next-line no-console
        console.log('[MeetingRecorder] starting recording with', recordingCodec);

        if (!recordingCodec) {
            // Probe still in flight: MediaRecorder would fall back to the
            // browser default, which is what causes the "empty chunk" floods.
            // eslint-disable-next-line no-console
            console.error('[MeetingRecorder] codec detection has not resolved yet.');
            reportMeetError('MeetingRecording Error: codec detection not ready at startRecording');
            return;
        }

        activeRecordingCodecRef.current = recordingCodec;

        try {
            // Reset chunk stats and stop any leftover watchdog from a prior run.
            chunkStatsRef.current = {
                chunkCount: 0,
                emptyChunkCount: 0,
                lastChunkAt: 0,
                firstChunkAt: null,
                watchdogWarned: false,
            };
            stopChunkWatchdog();

            // Tear down any previous OPFS storage worker before allocating a new one.
            if (workerStorageRef.current) {
                await workerStorageRef.current.clear().catch(() => {
                    // Ignore cleanup errors
                });
                workerStorageRef.current.terminate();
                workerStorageRef.current = null;
            }

            // Spin up OPFS storage for this recording.
            const storage = new WorkerRecordingStorage(recordingCodec.extension);
            await storage.init();
            workerStorageRef.current = storage;

            // Create the composition canvas and a capture stream off it.
            const canvas = document.createElement('canvas');
            canvas.width = CANVAS_WIDTH;
            canvas.height = CANVAS_HEIGHT;

            const canvasStream = canvas.captureStream(RECORDING_FPS);

            // Spawn the render worker that will draw participant frames into the canvas.
            const worker = new Worker(new URL('./renderWorker.ts', import.meta.url), {
                type: 'module',
            });

            worker.onmessage = (event: MessageEvent) => {
                // Logging worker logs into browser console
                forwardWorkerLog(event.data);
            };

            worker.onerror = (event) => {
                // eslint-disable-next-line no-console
                console.error('[MeetingRecorder/renderWorker] uncaught error in worker:', {
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    error: event.error,
                });
                reportMeetError('MeetingRecording Error: renderWorker uncaught error', {
                    context: {
                        message: event.message,
                        filename: event.filename,
                        lineno: event.lineno,
                    },
                });
            };

            renderWorkerRef.current = worker;

            // Hand the canvas off to the worker and kick off rendering.
            const offscreen = canvas.transferControlToOffscreen();
            worker.postMessage(
                {
                    type: MessageType.INIT,
                    canvas: offscreen,
                    state: prepareRenderState(),
                },
                [offscreen]
            );
            worker.postMessage({ type: 'render' });

            // Mix all audio sources (mic + remote participants) into one stream.
            const { stream: audioStream } = await setupAudioMixing();

            // Collect the video and audio tracks that feed MediaRecorder.
            const videoTracks = canvasStream.getVideoTracks();
            const audioTracks = audioStream.getAudioTracks();
            const tracks = [...videoTracks, ...audioTracks];

            const trackInfo = tracks.map((t) => ({
                id: t.id,
                kind: t.kind,
                readyState: t.readyState,
                muted: t.muted,
                enabled: t.enabled,
                label: t.label,
            }));
            // eslint-disable-next-line no-console
            console.log('[MeetingRecorder] tracks attached to MediaRecorder:', trackInfo);
            if (videoTracks.length === 0) {
                // eslint-disable-next-line no-console
                console.error('[MeetingRecorder] canvas stream produced 0 video tracks; recording will be empty');
            }
            if (audioTracks.length === 0) {
                // eslint-disable-next-line no-console
                console.warn(
                    '[MeetingRecorder] audio destination produced 0 audio tracks; recording will have no audio'
                );
            }
            const endedTracks = tracks.filter((t) => t.readyState === 'ended');
            if (endedTracks.length > 0) {
                // eslint-disable-next-line no-console
                console.error(
                    '[MeetingRecorder] some tracks already ended before MediaRecorder started:',
                    endedTracks.map((t) => ({ id: t.id, kind: t.kind }))
                );
            }

            // Build the MediaRecorder over the combined track stream.
            const combinedStream = new MediaStream(tracks);

            const createConfiguredRecorder = (codecMimeType: string) => {
                const recorder = new MediaRecorder(combinedStream, {
                    mimeType: codecMimeType,
                    videoBitsPerSecond: 2_000_000,
                    audioBitsPerSecond: 128_000,
                });

                // Each chunk: classify (data / empty / tail) and persist to OPFS.
                recorder.ondataavailable = async (event) => {
                    const stats = chunkStatsRef.current;

                    if (!workerStorageRef.current) {
                        // eslint-disable-next-line no-console
                        console.error('[MeetingRecorder] ondataavailable but worker storage is gone', {
                            chunkSize: event.data.size,
                            chunksWithDataSoFar: stats.chunkCount,
                            emptyChunksSoFar: stats.emptyChunkCount,
                        });
                        return;
                    }

                    if (event.data.size === 0) {
                        // The final ondataavailable after stop() is normally empty;
                        // ignore it.
                        if (recorder.state !== 'recording') {
                            // eslint-disable-next-line no-console
                            console.log(
                                `[MeetingRecorder] empty tail chunk while state="${recorder.state}" (expected during stop flush)`
                            );
                            return;
                        }

                        stats.emptyChunkCount++;

                        if (stats.emptyChunkCount === 1 || stats.emptyChunkCount % 5 === 0) {
                            // eslint-disable-next-line no-console
                            console.warn(
                                `[MeetingRecorder] empty chunk #${stats.emptyChunkCount} (chunks with data so far: ${stats.chunkCount}, mimeType: ${recordingCodec.mimeType}, mediaRecorder.state: ${recorder.state})`
                            );
                        }

                        if (stats.emptyChunkCount === 10 && stats.chunkCount === 0) {
                            reportMeetError('MeetingRecording Error: 10 consecutive empty chunks with no data', {
                                context: {
                                    emptyChunkCount: stats.emptyChunkCount,
                                    mediaRecorderState: recorder.state,
                                    recordingCodec,
                                },
                            });
                        }
                        return;
                    }

                    stats.chunkCount++;
                    stats.lastChunkAt = performance.now();
                    if (stats.firstChunkAt === null) {
                        stats.firstChunkAt = stats.lastChunkAt;
                        // eslint-disable-next-line no-console
                        console.log(
                            `[MeetingRecorder] first non-empty chunk: ${event.data.size} bytes (empty chunks before this: ${stats.emptyChunkCount})`
                        );
                    }

                    const chunkNumber = stats.chunkCount;
                    const writePromise = workerStorageRef.current.addChunk(event.data).catch((error) => {
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

                    pendingChunkWrites.current.add(writePromise);
                    await writePromise;
                    pendingChunkWrites.current.delete(writePromise);
                };

                return recorder;
            };

            // Start the recorder, falling back to the next codec on EncodingError.
            let mediaRecorder = createConfiguredRecorder(recordingCodec.mimeType);
            try {
                await startMediaRecorder(mediaRecorder);
            } catch (error) {
                if (error instanceof DOMException && error.name === 'EncodingError') {
                    const fallbackCodec = getFallbackCodec();
                    // eslint-disable-next-line no-console
                    console.error('[MeetingRecorder] EncodingError with codec, retrying with fallback', {
                        failed: recordingCodec,
                        fallback: fallbackCodec,
                        error: error,
                    });
                    reportMeetError('MeetingRecording Error: EncodingError, retrying with fallback codec', {
                        context: { failed: recordingCodec, fallback: fallbackCodec },
                    });

                    activeRecordingCodecRef.current = fallbackCodec;
                    mediaRecorder = createConfiguredRecorder(fallbackCodec.mimeType);
                    await startMediaRecorder(mediaRecorder);
                } else {
                    throw error;
                }
            }

            // Permanent error handler — without this, runtime errors are lost
            // until stopMediaRecorder installs its own onerror on the stop path.
            mediaRecorder.onerror = (event) => {
                const error = (event as ErrorEvent).error;
                // eslint-disable-next-line no-console
                console.error('[MeetingRecorder] MediaRecorder runtime error:', {
                    message: error?.message ?? 'Unknown MediaRecorder error',
                    name: error?.name,
                    state: mediaRecorder.state,
                    recordingCodec,
                    chunksWithData: chunkStatsRef.current.chunkCount,
                    emptyChunks: chunkStatsRef.current.emptyChunkCount,
                });
                reportMeetError('MeetingRecording Error: MediaRecorder runtime error', {
                    context: {
                        message: error?.message ?? 'Unknown MediaRecorder error',
                        name: error?.name,
                        state: mediaRecorder.state,
                        recordingCodec,
                    },
                });

                // The encoder failed mid-recording. Clean up so the user isn't stuck in a recording state.
                cleanupRecordingResources();
            };

            // Surface stalled encoders to the console and Sentry. Two phases:
            // priming (no first chunk yet — generous) vs stall (had data, now
            // silent). Both are intentionally lenient: slow CPUs with MP4 can
            // legitimately produce chunks several seconds apart.
            const WATCHDOG_INTERVAL_MS = 2_000;
            const PRIMING_THRESHOLD_MS = 15_000;
            const STALL_THRESHOLD_MS = 10_000;
            const watchdogStartedAt = performance.now();
            chunkWatchdogRef.current = setInterval(() => {
                const stats = chunkStatsRef.current;
                const now = performance.now();
                const hasFirstChunk = stats.firstChunkAt !== null;
                const sinceLastChunk = hasFirstChunk ? now - stats.lastChunkAt : now - watchdogStartedAt;
                const threshold = hasFirstChunk ? STALL_THRESHOLD_MS : PRIMING_THRESHOLD_MS;

                if (sinceLastChunk > threshold && !stats.watchdogWarned) {
                    stats.watchdogWarned = true;
                    const phase = hasFirstChunk ? 'stall' : 'no-first-chunk';
                    // eslint-disable-next-line no-console
                    console.error(
                        `[MeetingRecorder] watchdog: no chunk with data in the last ${Math.round(
                            sinceLastChunk
                        )}ms (${phase})`,
                        {
                            recordingCodec,
                            mediaRecorderState: mediaRecorder.state,
                            chunksWithData: stats.chunkCount,
                            emptyChunks: stats.emptyChunkCount,
                            firstChunkAt: stats.firstChunkAt,
                        }
                    );
                    reportMeetError('MeetingRecording Error: watchdog detected stalled MediaRecorder', {
                        context: {
                            recordingCodec,
                            mediaRecorderState: mediaRecorder.state,
                            chunksWithData: stats.chunkCount,
                            emptyChunks: stats.emptyChunkCount,
                            sinceLastChunkMs: Math.round(sinceLastChunk),
                            phase,
                        },
                    });
                }

                if (sinceLastChunk <= threshold && stats.watchdogWarned) {
                    stats.watchdogWarned = false;
                    // eslint-disable-next-line no-console
                    console.log('[MeetingRecorder] watchdog: chunks resumed');
                }
            }, WATCHDOG_INTERVAL_MS);

            mediaRecorderRef.current = mediaRecorder;

            // eslint-disable-next-line no-console
            console.log('[MeetingRecorder] MediaRecorder started', { state: mediaRecorder.state, recordingCodec });
            if (mediaRecorder.state !== 'recording') {
                // eslint-disable-next-line no-console
                console.error(
                    `[MeetingRecorder] MediaRecorder.state is "${mediaRecorder.state}" right after start (expected "recording")`
                );
            }

            // Wire each unmuted track into the audio mixer and start its frame capture.
            updateAudioSources();

            const recordingTracks = getRecordedTracks();
            recordingTracks.forEach((trackInfo) => {
                if (trackInfo.track && !trackInfo.track.isMuted) {
                    startFrameCapture(trackInfo);
                }
            });

            // Mark recording as active in local state and broadcast to peers.
            startTimeRef.current = Date.now();

            if (isMeetMultipleRecordingEnabled) {
                dispatch(addParticipantRecording(room.localParticipant.identity));
            } else {
                dispatch(setIsLocalRecording(true));
            }
            dispatch(startLocalRecordingTimer());

            void publishRecordingStatus(RecordingStatus.Started);
        } catch (error) {
            stopChunkWatchdog();

            reportMeetError('MeetingRecording Error: Failed to start recording', {
                context: {
                    error: error instanceof Error ? error.message : String(error),
                    name: error instanceof Error ? error.name : 'UnknownError',
                    recordingCodec,
                },
            });

            // eslint-disable-next-line no-console
            console.error('[MeetingRecorder] failed to start recording:', error);
            throw error;
        }
    });

    const stopMediaRecorder = async (mediaRecorder: MediaRecorder): Promise<void> => {
        return new Promise((resolve, reject) => {
            mediaRecorder.onstop = () => {
                resolve();
            };

            mediaRecorder.onerror = (event) => {
                reject(event.error);
            };

            mediaRecorder.stop();
        });
    };

    const stopRecording = useStableCallback(async () => {
        try {
            if (mediaRecorderRef.current && isLocalRecording) {
                let blob: Blob | null = null;

                await stopMediaRecorder(mediaRecorderRef.current);
                void publishRecordingStatus(RecordingStatus.Stopped);

                await Promise.allSettled(Array.from(pendingChunkWrites.current));
                pendingChunkWrites.current.clear();

                if (!workerStorageRef.current) {
                    throw new Error('Worker storage not found');
                }

                const file = await workerStorageRef.current.getFile();

                if (file.type && file.type !== '') {
                    blob = file;
                } else {
                    blob = file.slice(0, file.size, activeRecordingCodecRef.current.mimeType);
                }

                return blob;
            } else {
                if (workerStorageRef.current) {
                    workerStorageRef.current.terminate();
                    workerStorageRef.current = null;
                }

                return null;
            }
        } catch (error) {
            reportMeetError('MeetingRecording Error: Failed to stop recording', {
                context: {
                    error: error instanceof Error ? error.message : String(error),
                    name: error instanceof Error ? error.name : 'UnknownError',
                },
            });

            // eslint-disable-next-line no-console
            console.error('Failed to stop recording:', error);

            throw error;
        } finally {
            // eslint-disable-next-line no-console
            console.log('[MeetingRecorder] recording stopped', {
                chunksWithData: chunkStatsRef.current.chunkCount,
                emptyChunks: chunkStatsRef.current.emptyChunkCount,
                firstChunkAt: chunkStatsRef.current.firstChunkAt,
                lastChunkAt: chunkStatsRef.current.lastChunkAt,
            });

            cleanupRecordingResources();
        }
    });

    const downloadRecording = useStableCallback(async () => {
        try {
            if (!isLocalRecording) {
                return;
            }

            const blob = await stopRecording();

            if (!blob || blob.size === 0) {
                reportMeetError('MeetingRecording Error: Recording download failed: empty or missing blob', {
                    context: {
                        blobExists: !!blob,
                        blobSize: blob?.size ?? 0,
                    },
                });

                throw new Error('Recording download failed: empty or missing blob');
            }

            try {
                // Download file from OPFS
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = `meeting-recording-${new Date().toISOString()}.${activeRecordingCodecRef.current.extension}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } catch (error) {
                reportMeetError('MeetingRecording Error: Failed to download recording', {
                    context: {
                        error: error instanceof Error ? error.message : String(error),
                        name: error instanceof Error ? error.name : 'UnknownError',
                    },
                });

                // eslint-disable-next-line no-console
                console.error('Failed to download recording:', error);

                throw error;
            }

            createNotification({
                text: c('Info').t`Recording saved`,
                type: 'success',
            });
        } catch (error) {
            createNotification({
                text: c('Error').t`Failed to save recording`,
                type: 'error',
            });
        }
    });

    const videoTracksSignature = cameraTracks
        .map((trackRef) => {
            const track = trackRef.publication.track;
            return `${track?.sid}-${trackRef.publication.isMuted}-${track?.mediaStreamTrack?.id}`;
        })
        .join(',');

    const screenShareTracksSignature = screenShareTracks
        .map((trackRef) => {
            const track = trackRef.publication.track;
            return `${track?.sid}-${trackRef.publication.isMuted}-${track?.mediaStreamTrack?.id}`;
        })
        .join(',');

    useEffect(() => {
        if (!isLocalRecording || !renderWorkerRef.current) {
            return;
        }

        renderWorkerRef.current.postMessage({
            type: 'updateState',
            state: prepareRenderState(),
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        isLocalRecording,
        isLargerThanMd,
        isNarrowHeight,
        pagedParticipants,
        participantDecryptedNameMap,
        videoTracksSignature,
        screenShareTracksSignature,
    ]);

    // Subscribe remote tracks and start/stop frame captures as needed during recording.
    // Runs on participants change (to subscribe new joiners) and on track signature changes
    // (to start capture once a track becomes available after subscription completes).
    useEffect(() => {
        if (!isLocalRecording) {
            return;
        }

        // Ensure all remote camera and screenshare tracks are subscribed
        for (const participant of room.remoteParticipants.values()) {
            for (const publication of participant.trackPublications.values()) {
                if (
                    publication instanceof RemoteTrackPublication &&
                    (publication.source === Track.Source.Camera || publication.source === Track.Source.ScreenShare) &&
                    !publication.isSubscribed
                ) {
                    publication.setSubscribed(true);
                    publication.setEnabled(true);
                }
            }
        }

        // Handle track changes: start/stop frame capture as needed
        const tracks = getRecordedTracks();

        // Get current track IDs
        const currentTrackIds = new Set(Array.from(frameReadersRef.current.keys()));

        const newTrackIds = new Set(tracks.filter((t) => t.track && !t.track.isMuted).map((t) => t.track!.sid || ''));

        // Stop captures for tracks that are no longer active
        currentTrackIds.forEach((trackId) => {
            if (!newTrackIds.has(trackId)) {
                stopFrameCapture(trackId);
            }
        });

        // Start captures for new tracks
        tracks.forEach((trackInfo) => {
            const trackId = trackInfo.track?.sid;
            if (trackId && !currentTrackIds.has(trackId) && trackInfo.track && !trackInfo.track.isMuted) {
                startFrameCapture(trackInfo);
            }
        });

        // Subscribe tracks published by late joiners
        const handleTrackPublished = (publication: RemoteTrackPublication) => {
            if (publication.source === Track.Source.Camera || publication.source === Track.Source.ScreenShare) {
                publication.setSubscribed(true);
                publication.setEnabled(true);
            }
        };

        room.on(RoomEvent.TrackPublished, handleTrackPublished);

        return () => {
            room.off(RoomEvent.TrackPublished, handleTrackPublished);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLocalRecording, room, pagedParticipants, videoTracksSignature, screenShareTracksSignature]);

    const audioTracksSignature = audioTracks
        .map((trackRef) => {
            const track = trackRef.publication.track;
            const mediaStreamTrack = track?.mediaStreamTrack;
            return `${track?.sid}-${trackRef.publication.isMuted}-${mediaStreamTrack?.id}-${mediaStreamTrack?.readyState}`;
        })
        .join(',');

    useEffect(() => {
        if (!isLocalRecording) {
            return;
        }

        updateAudioSources();

        // Workaround for audio track timing issues
        const timeout1 = setTimeout(() => updateAudioSources(), 50);
        const timeout2 = setTimeout(() => updateAudioSources(), 150);

        return () => {
            clearTimeout(timeout1);
            clearTimeout(timeout2);
        };
    }, [isLocalRecording, audioTracksSignature]);

    const handleCleanup = async () => {
        cleanupRecordingResources();

        if (workerStorageRef.current) {
            await workerStorageRef.current.clear();
            workerStorageRef.current.terminate();
            workerStorageRef.current = null;
        }
    };

    useEffect(() => {
        return () => {
            void handleCleanup();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        startRecording,
        downloadRecording,
    };
}
