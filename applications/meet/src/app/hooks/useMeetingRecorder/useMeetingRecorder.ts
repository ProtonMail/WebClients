import { useEffect, useRef, useState } from 'react';

import { useTracks } from '@livekit/components-react';
import type { LocalParticipant, RemoteParticipant } from 'livekit-client';
import { Track } from 'livekit-client';

import { wait } from '@proton/shared/lib/helpers/promise';

import { RecordingStatus } from '../../types';
import { calculateGridLayout } from '../../utils/calculateGridLayout';
import { useIsLargerThanMd } from '../useIsLargerThanMd';
import { useIsNarrowHeight } from '../useIsNarrowHeight';
import { MessageType } from './recordingWorkerTypes';
import type { FrameReaderInfo, MeetingRecordingState, RecordingTrackInfo } from './types';
import { useRecordingStatusPublish } from './useRecordingStatusPublish';
import {
    createMediaStreamTrackProcessor,
    getRecordingDetails,
    getTracksForRecording,
    supportsTrackProcessor,
} from './utils';
import { WorkerRecordingStorage } from './workerStorage';

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const FPS = 30;

const { mimeType, extension } = getRecordingDetails();

export function useMeetingRecorder(
    participantNameMap: Record<string, string>,
    pagedParticipants: (RemoteParticipant | LocalParticipant)[]
) {
    const isLargerThanMd = useIsLargerThanMd();

    const isNarrowHeight = useIsNarrowHeight();

    const [recordingState, setRecordingState] = useState<MeetingRecordingState>({
        isRecording: false,
        recordedChunks: [],
    });

    const publishRecordingStatus = useRecordingStatusPublish(
        recordingState.isRecording ? RecordingStatus.Started : RecordingStatus.Stopped
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
    const startTimeRef = useRef<number>(0);
    const workerStorageRef = useRef<WorkerRecordingStorage | null>(null);
    const visibilityListenerRef = useRef<(() => void) | null>(null);
    const pendingChunkWrites = useRef<Set<Promise<void>>>(new Set());

    const cameraTracks = useTracks([Track.Source.Camera]);
    const screenShareTracks = useTracks([Track.Source.ScreenShare]);
    const audioTracks = useTracks([Track.Source.Microphone, Track.Source.ScreenShareAudio]);

    const renderInfoRef = useRef({
        cameraTracks,
        screenShareTracks,
        audioTracks,
        pagedParticipants,
        participantNameMap,
    });

    renderInfoRef.current = {
        cameraTracks,
        screenShareTracks,
        audioTracks,
        pagedParticipants,
        participantNameMap,
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
                name: renderInfoRef.current.participantNameMap[track.participant?.identity || ''] || 'Unknown',
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

                        if (renderWorkerRef.current && frame) {
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

    const startRecording = async () => {
        try {
            if (workerStorageRef.current) {
                await workerStorageRef.current.clear().catch(() => {
                    // Ignore cleanup errors
                });
                workerStorageRef.current.terminate();
                workerStorageRef.current = null;
            }

            const storage = new WorkerRecordingStorage(extension);
            await storage.init();
            workerStorageRef.current = storage;

            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = CANVAS_WIDTH;
            canvas.height = CANVAS_HEIGHT;

            const canvasStream = canvas.captureStream(FPS);

            const worker = new Worker(new URL('./renderWorker.ts', import.meta.url), {
                type: 'module',
            });
            renderWorkerRef.current = worker;

            // Transfer canvas to worker as OffscreenCanvas
            const offscreen = canvas.transferControlToOffscreen();
            worker.postMessage(
                {
                    type: MessageType.INIT,
                    canvas: offscreen,
                    state: prepareRenderState(),
                },
                [offscreen]
            );

            // Start rendering in worker
            worker.postMessage({ type: 'render' });

            const { stream: audioStream } = await setupAudioMixing();

            const videoTracks = canvasStream.getVideoTracks();
            const audioTracks = audioStream.getAudioTracks();
            const tracks = [...videoTracks, ...audioTracks];

            const combinedStream = new MediaStream(tracks);

            const options = { mimeType };
            const mediaRecorder = new MediaRecorder(combinedStream, options);

            let chunkCount = 0;
            mediaRecorder.ondataavailable = async (event) => {
                if (event.data.size > 0 && workerStorageRef.current) {
                    chunkCount++;
                    const writePromise = workerStorageRef.current.addChunk(event.data).catch((error) => {
                        // eslint-disable-next-line no-console
                        console.error(`✗ Failed to store chunk ${chunkCount} in OPFS:`, error);
                    });

                    pendingChunkWrites.current.add(writePromise);
                    await writePromise;
                    pendingChunkWrites.current.delete(writePromise);
                } else {
                    // eslint-disable-next-line no-console
                    console.warn('ondataavailable called with empty data or no storage');
                }
            };

            mediaRecorder.onerror = (event) => {
                // eslint-disable-next-line no-console
                console.error('MediaRecorder error:', event);
            };

            mediaRecorder.start(100);
            mediaRecorderRef.current = mediaRecorder;

            updateAudioSources();

            const recordingTracks = getRecordedTracks();
            recordingTracks.forEach((trackInfo) => {
                if (trackInfo.track && !trackInfo.track.isMuted) {
                    startFrameCapture(trackInfo);
                }
            });

            startTimeRef.current = Date.now();

            setRecordingState({
                isRecording: true,
                recordedChunks: [],
            });

            void publishRecordingStatus(RecordingStatus.Started);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to start recording:', error);
            throw error;
        }
    };

    const stopRecording = () => {
        return new Promise<Blob | null>(async (resolve) => {
            const mediaRecorder = mediaRecorderRef.current;

            if (mediaRecorder && recordingState.isRecording) {
                mediaRecorder.onstop = async () => {
                    let blob: Blob | null = null;

                    await Promise.allSettled(Array.from(pendingChunkWrites.current));
                    pendingChunkWrites.current.clear();

                    if (!workerStorageRef.current) {
                        resolve(null);

                        return;
                    }

                    try {
                        const file = await workerStorageRef.current.getFile();

                        if (file.type && file.type !== '') {
                            blob = file;
                        } else {
                            blob = file.slice(0, file.size, mimeType);
                        }
                    } catch (error) {
                        // eslint-disable-next-line no-console
                        console.error('Failed to retrieve file from OPFS:', error);
                    }

                    stopAllFrameCaptures();
                    stopRendererWorker();
                    cleanUpAudioResources();
                    cleanUpVisibilityListener();

                    setRecordingState({
                        isRecording: false,
                        recordedChunks: [],
                    });

                    resolve(blob);
                };

                mediaRecorder.stop();

                void publishRecordingStatus(RecordingStatus.Stopped);
            } else {
                if (workerStorageRef.current) {
                    workerStorageRef.current.terminate();
                    workerStorageRef.current = null;
                }
                resolve(null);
            }
        });
    };

    const downloadRecording = async () => {
        if (!recordingState.isRecording) {
            return;
        }

        const blob = await stopRecording();

        if (!blob || blob.size === 0) {
            return;
        }

        try {
            // Download file from OPFS
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `meeting-recording-${new Date().toISOString()}.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            await wait(1000);
            URL.revokeObjectURL(url);

            // Clear OPFS storage after retrieving the file
            if (workerStorageRef.current) {
                await workerStorageRef.current.clear();
                workerStorageRef.current.terminate();
                workerStorageRef.current = null;
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to download recording:', error);
        }
    };

    useEffect(() => {
        if (!recordingState.isRecording || !renderWorkerRef.current) {
            return;
        }

        renderWorkerRef.current.postMessage({
            type: 'updateState',
            state: prepareRenderState(),
        });
    }, [recordingState.isRecording, isLargerThanMd, isNarrowHeight, pagedParticipants]);

    // Handle track changes during recording (start/stop frame capture as needed)
    useEffect(() => {
        if (!recordingState.isRecording) {
            return;
        }

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
    }, [recordingState.isRecording, cameraTracks, screenShareTracks, pagedParticipants]);

    const audioTracksSignature = audioTracks
        .map((trackRef) => {
            const track = trackRef.publication.track;
            const mediaStreamTrack = track?.mediaStreamTrack;
            return `${track?.sid}-${trackRef.publication.isMuted}-${mediaStreamTrack?.id}-${mediaStreamTrack?.readyState}`;
        })
        .join(',');

    useEffect(() => {
        if (!recordingState.isRecording) {
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
    }, [recordingState.isRecording, audioTracksSignature]);

    const handleCleanup = async () => {
        stopAllFrameCaptures();
        stopRendererWorker();
        cleanUpAudioResources();
        cleanUpVisibilityListener();

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
    }, []);

    return {
        recordingState,
        startRecording,
        stopRecording,
        downloadRecording,
    };
}
