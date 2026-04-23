import { useEffect, useRef, useState } from 'react';

import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import type { KrispNoiseFilterProcessor } from '@livekit/krisp-noise-filter';
import { KrispNoiseFilter, isKrispNoiseFilterSupported } from '@livekit/krisp-noise-filter';
import type { LocalTrack } from 'livekit-client';
import { Track } from 'livekit-client';

import { DEFAULT_DEVICE_ID } from '@proton/meet/constants';
import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectActiveMicrophoneId,
    selectInitialAudioState,
    selectMicrophoneState,
    selectMicrophones,
} from '@proton/meet/store/slices/deviceManagementSlice';
import { isAudioSessionAvailable, setAudioSessionType } from '@proton/meet/utils/iosAudioSession';
import { isSafari } from '@proton/shared/lib/helpers/browser';
import { wait } from '@proton/shared/lib/helpers/promise';

import { useStableCallback } from '../../../hooks/useStableCallback';
import { audioQuality } from '../../../qualityConstants';
import type { SwitchActiveDevice } from '../../../types';

const isAdvancedNoiseFilterSupported = isKrispNoiseFilterSupported();
const TOGGLE_TIMEOUT_MS = 8000;
const NOISE_FILTER_ATTACH_TIMEOUT_MS = 3000;
/** Delay before attaching noise filter after a mute/unmute toggle */
const NOISE_FILTER_SETTLE_DELAY_MS = 600;
/** Longer delay after device change to let the track and devicechange events settle */
const NOISE_FILTER_DEVICE_CHANGE_DELAY_MS = 1500;
const SAFARI_DEVICE_RELEASE_DELAY_MS = 300;
interface AudioToggleParams {
    isEnabled: boolean;
    audioDeviceId: string;
    preserveCache: boolean;
    /** Skip noise filter setup — used by track-ended recovery to get audio working immediately */
    skipNoiseFilter: boolean;
}

const DEBUG_PREFIX = '[AudioToggle]';

const debugLog = (message: string, data?: Record<string, unknown>) => {
    // eslint-disable-next-line no-console
    console.log(`${DEBUG_PREFIX} ${message}`, data ?? {});
};

const getErrorReason = (error: unknown) => {
    if (error instanceof Error) {
        return `${error.name}: ${error.message}`;
    }
    return String(error);
};

const withTimeout = async <T>(promise: Promise<T>, label: string, timeoutMs = TOGGLE_TIMEOUT_MS): Promise<T> => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            promise,
            new Promise<never>((_, reject) => {
                timeout = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
            }),
        ]);
    } finally {
        if (timeout) {
            clearTimeout(timeout);
        }
    }
};

/**
 * Manages microphone toggle (mute/unmute), device switching, and Krisp noise filter lifecycle.
 *
 * Noise filter architecture:
 * - The AudioContext is owned by WrappedProtonMeetContainer and passed in — it is isolated from the
 *   shared remote-audio context to prevent loopback under reconnection.
 * - A new KrispNoiseFilter processor is created per track (processors can't be reused across tracks
 *   because LiveKit calls processor.destroy() when a track is stopped).
 * - On device change, LiveKit internally calls processor.restart() on the existing track — we do NOT
 *   destroy the processor/AudioContext during device switches to avoid breaking that restart.
 * - On track ended (device unplug), we abandon the processor refs and auto-recover to the system
 */
export const useAudioToggle = (switchActiveDevice: SwitchActiveDevice, krispAudioContext: AudioContext | undefined) => {
    const { reportMeetError: reportError } = useMeetErrorReporting();
    const activeMicrophoneDeviceId = useMeetSelector(selectActiveMicrophoneId);
    const initialAudioState = useMeetSelector(selectInitialAudioState);
    const microphones = useMeetSelector(selectMicrophones);
    const microphoneState = useMeetSelector(selectMicrophoneState);
    const [noiseFilter, setNoiseFilter] = useState(isAdvancedNoiseFilterSupported);
    const { isMicrophoneEnabled, localParticipant } = useLocalParticipant();

    const noiseFilterProcessor = useRef<KrispNoiseFilterProcessor | null>(null);
    /** Track ID the processor is currently attached to, used to detect track replacement */
    const attachedTrackId = useRef<string | null>(null);
    /** Incremented on abandon to invalidate in-flight setProcessor calls */
    const noiseFilterGeneration = useRef(0);
    const pendingNoiseFilterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    /** Prevents concurrent toggleAudio calls from interleaving */
    const toggleInProgress = useRef(false);
    const currentDeviceId = useRef<string | null>(null);
    const toggleOperationId = useRef(0);
    /** Queued recovery params when a track-ended recovery arrives while toggle lock is held */
    const pendingRecovery = useRef<AudioToggleParams | null>(null);

    const room = useRoomContext();

    const getCurrentPublication = () => {
        return [...room.localParticipant.audioTrackPublications.values()].find(
            (item) =>
                item.kind === Track.Kind.Audio &&
                item.source !== Track.Source.ScreenShare &&
                item.source !== Track.Source.ScreenShareAudio &&
                item.audioTrack
        );
    };

    const cancelPendingNoiseFilter = () => {
        if (pendingNoiseFilterTimer.current) {
            clearTimeout(pendingNoiseFilterTimer.current);
            pendingNoiseFilterTimer.current = null;
            debugLog('noiseFilter:pending-cancelled');
        }
    };

    /**
     * Clears processor and track refs without closing the AudioContext.
     * Used on device change and track ended — keeps the AudioContext alive so LiveKit
     * can still call processor.restart() during internal track restarts.
     */
    const abandonNoiseFilter = () => {
        noiseFilterGeneration.current++;
        cancelPendingNoiseFilter();

        debugLog('noiseFilter:abandon', {
            hadProcessor: !!noiseFilterProcessor.current,
            attachedTrackId: attachedTrackId.current,
            generation: noiseFilterGeneration.current,
        });

        noiseFilterProcessor.current = null;
        attachedTrackId.current = null;
    };

    /**
     * Stops the processor on the live track and clears refs.
     * Used when the user intentionally disables the noise filter — unlike abandonNoiseFilter(),
     * this actually detaches the Krisp AudioWorkletNode from the Web Audio pipeline
     * so it stops consuming CPU.
     */
    const detachNoiseFilter = async () => {
        const publication = getCurrentPublication();
        const audioTrack = publication?.audioTrack;

        if (audioTrack && noiseFilterProcessor.current) {
            try {
                await withTimeout(
                    audioTrack.stopProcessor(),
                    'Stop noise filter processor',
                    NOISE_FILTER_ATTACH_TIMEOUT_MS
                );
                debugLog('noiseFilter:detach-done');
            } catch (error) {
                debugLog('noiseFilter:detach-failed', { reason: getErrorReason(error) });
            }
        }

        abandonNoiseFilter();
    };

    /** Full cleanup: abandons processor refs. AudioContext lifecycle is owned by the caller. */
    const destroyNoiseFilter = () => {
        abandonNoiseFilter();
    };

    /**
     * Creates a new KrispNoiseFilter processor and attaches it to the current audio track.
     * Uses the shared krispAudioContext passed in from WrappedProtonMeetContainer.
     * Guards against stale attach via generation counter — if abandonNoiseFilter() is called while setProcessor is in flight, the result is discarded.
     * On failure, detaches the AudioContext from the track so audio still flows directly.
     */
    const attachNoiseFilter = async () => {
        const publication = getCurrentPublication();
        const currentAudioTrack = publication?.audioTrack;

        if (!currentAudioTrack || !isAdvancedNoiseFilterSupported || !krispAudioContext) {
            debugLog('noiseFilter:attach-skip', {
                hasTrack: !!currentAudioTrack,
                supported: isAdvancedNoiseFilterSupported,
            });
            return;
        }

        if (currentAudioTrack.mediaStreamTrack?.readyState !== 'live') {
            debugLog('noiseFilter:attach-skip-not-live', {
                readyState: currentAudioTrack.mediaStreamTrack?.readyState,
            });
            return;
        }

        if (attachedTrackId.current === currentAudioTrack.id && noiseFilterProcessor.current) {
            if (!noiseFilterProcessor.current.isEnabled()) {
                debugLog('noiseFilter:re-enable-existing');
                await withTimeout(
                    noiseFilterProcessor.current.setEnabled(true),
                    'Re-enable noise filter',
                    NOISE_FILTER_ATTACH_TIMEOUT_MS
                );
            }
            return;
        }

        noiseFilterProcessor.current = null;
        attachedTrackId.current = null;

        const gen = ++noiseFilterGeneration.current;

        debugLog('noiseFilter:attach-start', { trackId: currentAudioTrack.id, generation: gen });

        const processor = KrispNoiseFilter();

        try {
            currentAudioTrack.setAudioContext(krispAudioContext);
            await withTimeout(
                currentAudioTrack.setProcessor(processor),
                'setProcessor',
                NOISE_FILTER_ATTACH_TIMEOUT_MS
            );

            if (noiseFilterGeneration.current !== gen) {
                debugLog('noiseFilter:attach-aborted-stale', {
                    generation: gen,
                    current: noiseFilterGeneration.current,
                });
                return;
            }

            noiseFilterProcessor.current = processor;
            attachedTrackId.current = currentAudioTrack.id;

            debugLog('noiseFilter:attach-done', { trackId: currentAudioTrack.id });
        } catch (error) {
            debugLog('noiseFilter:attach-failed', { reason: getErrorReason(error) });

            try {
                currentAudioTrack.setAudioContext(undefined as unknown as AudioContext);
                debugLog('noiseFilter:audio-context-detached');
            } catch {
                debugLog('noiseFilter:audio-context-detach-failed');
            }
        }
    };

    const scheduleNoiseFilterAttach = (delayMs = NOISE_FILTER_SETTLE_DELAY_MS) => {
        if (pendingNoiseFilterTimer.current) {
            clearTimeout(pendingNoiseFilterTimer.current);
        }
        debugLog('noiseFilter:schedule', { delayMs });
        pendingNoiseFilterTimer.current = setTimeout(() => {
            pendingNoiseFilterTimer.current = null;
            void attachNoiseFilter();
        }, delayMs);
    };

    useEffect(() => {
        const handleDeviceChange = () => {
            debugLog('devicechange:detected');
        };

        navigator.mediaDevices?.addEventListener('devicechange', handleDeviceChange);

        return () => {
            navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange);
            destroyNoiseFilter();
        };
    }, []);

    /** Cleans up a track whose MediaStreamTrack has ended (e.g. device unplugged). */
    const unpublishEndedTrack = async (operationId: number) => {
        const publication = getCurrentPublication();
        const audioTrack = publication?.audioTrack;
        if (!audioTrack) {
            return;
        }
        debugLog('unpublish-ended-track:start', { operationId });

        abandonNoiseFilter();

        try {
            await withTimeout(localParticipant.unpublishTrack(audioTrack as LocalTrack, true), 'Unpublish ended track');
        } catch (error) {
            debugLog('unpublish-ended-track:failed', { operationId, reason: getErrorReason(error) });
        }

        try {
            await withTimeout(localParticipant.setMicrophoneEnabled(false), 'Disable mic after unpublish');
        } catch {
            debugLog('unpublish-ended-track:disable-mic-failed', { operationId });
        }

        if (isSafari()) {
            await wait(SAFARI_DEVICE_RELEASE_DELAY_MS);
        }

        debugLog('unpublish-ended-track:done', { operationId });
    };

    /**
     * Main toggle function: handles mute/unmute, device switching, and noise filter scheduling.
     *
     * Three strategies:
     * 1. Fast path (isJustTogglingMute): same device, track alive → mute/unmute only.
     * 2. Track ended: unpublish dead track, create new one via setMicrophoneEnabled.
     * 3. Device change: cancel pending noise filter, recreate track with new device constraints.
     *    Falls back to relaxed constraints (no deviceId) on OverconstrainedError.
     *
     * After success, checks if the noise filter processor survived the device change
     * (LiveKit restarts it internally). If the track was replaced (new ID), schedules
     * a fresh noise filter attach with a longer delay to let devicechange events settle.
     */
    const toggleAudio = useStableCallback(async (params: Partial<AudioToggleParams> = {}) => {
        let toggleResult = false;
        const operationId = ++toggleOperationId.current;

        const currentAudioPublication = getCurrentPublication();
        const currentMuteState = currentAudioPublication?.isMuted ?? !initialAudioState;

        const {
            isEnabled = !currentMuteState,
            audioDeviceId = activeMicrophoneDeviceId,
            preserveCache,
            skipNoiseFilter = false,
        } = params;

        const requestedDeviceId =
            audioDeviceId === DEFAULT_DEVICE_ID ? microphoneState.systemDefault?.deviceId : audioDeviceId;
        const availableDeviceIds = new Set(microphones.map((mic) => mic.deviceId).filter(Boolean));
        const fallbackDeviceId = microphones[0]?.deviceId || microphoneState.systemDefault?.deviceId || null;
        const deviceId =
            requestedDeviceId && availableDeviceIds.has(requestedDeviceId) ? requestedDeviceId : fallbackDeviceId;

        debugLog('toggle:start', {
            operationId,
            isEnabled,
            audioDeviceId,
            requestedDeviceId,
            resolvedDeviceId: deviceId,
            currentMuteState,
            activeMicrophoneDeviceId,
            currentDeviceId: currentDeviceId.current,
        });

        if (!deviceId) {
            debugLog('toggle:blocked-no-device', { operationId });
            return false;
        }

        if (toggleInProgress.current) {
            if (skipNoiseFilter) {
                pendingRecovery.current = {
                    isEnabled,
                    audioDeviceId: audioDeviceId ?? DEFAULT_DEVICE_ID,
                    preserveCache: !!preserveCache,
                    skipNoiseFilter: true,
                };
                debugLog('toggle:queued-recovery', { operationId });
            } else {
                debugLog('toggle:blocked-in-progress', { operationId });
            }
            return false;
        }

        toggleInProgress.current = true;

        const runStep = async <T>(step: string, fn: () => Promise<T>): Promise<T> => {
            debugLog('step:start', { operationId, step });
            try {
                const result = await fn();
                debugLog('step:success', { operationId, step });
                return result;
            } catch (error) {
                debugLog('step:failed', { operationId, step, reason: getErrorReason(error) });
                throw error;
            }
        };

        const useIOSWorkaround = isAudioSessionAvailable();
        const audio = {
            ...(useIOSWorkaround ? {} : { deviceId: { exact: deviceId as string } }),
            echoCancellation: { ideal: true },
            autoGainControl: { ideal: true },
            noiseSuppression: isAdvancedNoiseFilterSupported ? false : noiseFilter,
            channelCount: { ideal: 1 },
            dtx: false,
        };

        try {
            const audioPublication = getCurrentPublication();
            const audioTrack = audioPublication?.audioTrack;
            const isTrackEnded = audioTrack?.mediaStreamTrack?.readyState === 'ended';
            const isDeviceChanging = currentDeviceId.current !== deviceId;
            const isJustTogglingMute = !!audioTrack && !isDeviceChanging && !isTrackEnded;

            debugLog('toggle:strategy', {
                operationId,
                hasAudioTrack: !!audioTrack,
                isTrackEnded,
                isDeviceChanging,
                isJustTogglingMute,
                trackReadyState: audioTrack?.mediaStreamTrack?.readyState,
            });

            if (isJustTogglingMute) {
                if (isEnabled) {
                    await runStep('fast-path-unmute', () => withTimeout(audioTrack.unmute(), 'Unmute audio track'));
                } else {
                    await runStep('fast-path-mute', () => withTimeout(audioTrack.mute(), 'Mute audio track'));
                }
            } else {
                if (isTrackEnded && audioTrack) {
                    await runStep('cleanup-ended-track', () => unpublishEndedTrack(operationId));
                } else if (isDeviceChanging) {
                    cancelPendingNoiseFilter();
                }

                if (useIOSWorkaround) {
                    debugLog('toggle:ios-audio-session-auto', { operationId });
                    setAudioSessionType('auto');
                }

                const micPreset = {
                    audioPreset: {
                        maxBitrate: audioQuality,
                        priority: 'high' as const,
                    },
                };

                // On OverconstrainedError (e.g. stale device ID after unplug), retry with
                // relaxed constraints that omit deviceId and use { ideal } values only,
                // letting the browser pick any available mic.
                try {
                    await runStep('recreate-enable-microphone', () =>
                        withTimeout(localParticipant.setMicrophoneEnabled(true, audio, micPreset), 'Enable microphone')
                    );
                    if (useIOSWorkaround) {
                        debugLog('toggle:ios-audio-session-play-and-record', { operationId });
                        setAudioSessionType('play-and-record');
                    }
                } catch (firstError) {
                    if ((firstError as Error)?.name === 'OverconstrainedError') {
                        const relaxed = {
                            echoCancellation: audio.echoCancellation,
                            autoGainControl: audio.autoGainControl,
                            channelCount: audio.channelCount,
                            noiseSuppression: { ideal: false },
                        };
                        debugLog('recreate:retry-relaxed', { operationId });
                        await runStep('recreate-enable-microphone-relaxed', () =>
                            withTimeout(
                                localParticipant.setMicrophoneEnabled(true, relaxed, micPreset),
                                'Enable microphone (relaxed)'
                            )
                        );
                    } else {
                        throw firstError;
                    }
                }
                currentDeviceId.current = deviceId;

                const newAudioPublication = [...localParticipant.audioTrackPublications.values()].find(
                    (item) => item.kind === Track.Kind.Audio && item.source !== Track.Source.ScreenShare
                );
                const newAudioTrack = newAudioPublication?.audioTrack;

                if (newAudioTrack) {
                    if (isEnabled) {
                        await runStep('recreate-unmute-track', () =>
                            withTimeout(newAudioTrack.unmute(), 'Unmute recreated track')
                        );
                    } else {
                        await runStep('recreate-mute-track', () =>
                            withTimeout(newAudioTrack.mute(), 'Mute recreated track')
                        );
                    }
                } else {
                    debugLog('recreate:new-track-missing', { operationId });
                }
            }

            await runStep('switch-active-device', () =>
                withTimeout(
                    switchActiveDevice({
                        deviceType: 'audioinput',
                        deviceId,
                        isSystemDefaultDevice: audioDeviceId === DEFAULT_DEVICE_ID,
                        preserveDefaultDevice: !!preserveCache,
                    }),
                    'Switch active audio input'
                )
            );

            toggleResult = true;
            debugLog('toggle:success', { operationId, toggleResult });
            // After toggle success, determine noise filter state:
            // - If the track ID matches our ref, LiveKit restarted the processor internally → nothing to do.
            // - If the track changed (new ID), the old processor is on a dead track → abandon and re-attach.
            if (isEnabled && isAdvancedNoiseFilterSupported && noiseFilter && !skipNoiseFilter) {
                const currentTrack = getCurrentPublication()?.audioTrack;
                const processorStillAttached =
                    noiseFilterProcessor.current &&
                    attachedTrackId.current &&
                    currentTrack?.id === attachedTrackId.current;

                if (processorStillAttached) {
                    debugLog('noiseFilter:processor-survived', { operationId, trackId: attachedTrackId.current });
                } else {
                    if (attachedTrackId.current && currentTrack?.id !== attachedTrackId.current) {
                        debugLog('noiseFilter:track-changed', {
                            operationId,
                            oldTrackId: attachedTrackId.current,
                            newTrackId: currentTrack?.id,
                        });
                        abandonNoiseFilter();
                    }
                    const delay = isJustTogglingMute
                        ? NOISE_FILTER_SETTLE_DELAY_MS
                        : NOISE_FILTER_DEVICE_CHANGE_DELAY_MS;
                    debugLog('noiseFilter:schedule-attach', { operationId, delayMs: delay, isJustTogglingMute });
                    scheduleNoiseFilterAttach(delay);
                }
            } else if (skipNoiseFilter) {
                debugLog('noiseFilter:skipped-for-recovery', { operationId });
            }
        } catch (error) {
            reportError('Failed to toggle audio', error);
            // eslint-disable-next-line no-console
            console.error(error);
            debugLog('toggle:error', { operationId, reason: getErrorReason(error) });
        } finally {
            toggleInProgress.current = false;
            debugLog('toggle:finally', { operationId, toggleResult, lockReleased: true });

            const recovery = pendingRecovery.current;
            if (recovery) {
                pendingRecovery.current = null;
                debugLog('toggle:drain-pending-recovery', { operationId });
                void toggleAudio(recovery);
            }
        }

        return toggleResult;
    });

    /**
     * Auto-recovery on device unplug: when the underlying MediaStreamTrack ends,
     * abandon the noise filter and trigger a recovery toggle to the system default mic.
     * Noise filter is skipped during recovery to avoid blocking audio output.
     */
    useEffect(() => {
        const publication = getCurrentPublication();
        const mediaTrack = publication?.audioTrack?.mediaStreamTrack;
        if (!mediaTrack) {
            return;
        }

        const handleTrackEnded = () => {
            const wasEnabled = !publication?.isMuted;

            debugLog('track-ended-event', {
                wasEnabled,
                activeMicrophoneDeviceId,
                systemDefault: microphoneState.systemDefault?.deviceId,
            });

            abandonNoiseFilter();

            void toggleAudio({
                isEnabled: wasEnabled,
                audioDeviceId: DEFAULT_DEVICE_ID,
                preserveCache: true,
                skipNoiseFilter: true,
            });
        };

        mediaTrack.addEventListener('ended', handleTrackEnded);
        return () => {
            mediaTrack.removeEventListener('ended', handleTrackEnded);
        };
    }, [activeMicrophoneDeviceId, microphones, room, localParticipant]);

    const toggleNoiseFilter = async () => {
        debugLog('toggleNoiseFilter:start', { isMicrophoneEnabled, currentValue: noiseFilter });
        const newValue = !noiseFilter;
        setNoiseFilter(newValue);

        if (isMicrophoneEnabled) {
            try {
                if (newValue) {
                    await attachNoiseFilter();
                } else {
                    await detachNoiseFilter();
                }
                debugLog('toggleNoiseFilter:applied', { newValue });
            } catch (error) {
                debugLog('toggleNoiseFilter:failed', { reason: getErrorReason(error) });
            }
        } else {
            debugLog('toggleNoiseFilter:queued-while-muted');
        }
    };

    const audioPublication = [...localParticipant.audioTrackPublications.values()].find(
        (item) => item.kind === Track.Kind.Audio && item.source !== Track.Source.ScreenShare
    );

    const isAudioEnabled = isMicrophoneEnabled && !audioPublication?.isMuted;

    return { toggleAudio, noiseFilter, toggleNoiseFilter, isAudioEnabled };
};
