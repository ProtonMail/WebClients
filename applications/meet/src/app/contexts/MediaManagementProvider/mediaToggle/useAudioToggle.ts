import { useEffect, useRef, useState } from 'react';

import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { KrispNoiseFilter, isKrispNoiseFilterSupported } from '@livekit/krisp-noise-filter';
import type { KrispNoiseFilterProcessor } from '@livekit/krisp-noise-filter';
import type { AudioProcessorOptions, LocalTrack, Room, TrackProcessor } from 'livekit-client';
import { Track } from 'livekit-client';

import { DEFAULT_DEVICE_ID } from '@proton/meet/constants';
import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetSelector, useMeetStore } from '@proton/meet/store/hooks';
import { selectKrispDebug } from '@proton/meet/store/slices/devToolsSlice';
import {
    selectActiveMicrophoneId,
    selectInitialAudioState,
    selectMicrophoneState,
    selectMicrophones,
    selectRealtimeDevices,
} from '@proton/meet/store/slices/deviceManagementSlice';
import { isAudioSessionAvailable, setAudioSessionType } from '@proton/meet/utils/iosAudioSession';
import { withTimeout } from '@proton/meet/utils/withTimeout';
import { isSafari } from '@proton/shared/lib/helpers/browser';
import { wait } from '@proton/shared/lib/helpers/promise';

import { useStableCallback } from '../../../hooks/useStableCallback';
import { audioQuality } from '../../../qualityConstants';
import type { SwitchActiveDevice } from '../../../types';
import { getPersistedNoiseFilter, persistNoiseFilter } from '../../../utils/noiseFilterPersistence';
import {
    RNNoiseFilter,
    isRNNoiseFilterSupported,
    preloadRNNoiseWorklet,
    waitForRNNoiseWorklet,
} from '../../../utils/rnnoiseProcessor';

const isKrispNoiseFilterBrowserSupported = isKrispNoiseFilterSupported();
const isRNNoiseFilterBrowserSupported = isRNNoiseFilterSupported();
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

/**
 * Whether the connected LiveKit server is LiveKit Cloud.
 */
const isRoomInLivekitCloud = (room: Room) => {
    const CLOUD_EDITION = 1;
    return room.serverInfo?.edition === CLOUD_EDITION;
};

/**
 * Manages microphone toggle (mute/unmute), device switching, and noise filter lifecycle.
 *
 * Noise filter hierarchy:
 * - Krisp: used when the room is LiveKit Cloud and the browser supports it.
 * - RNNoise (WASM): fallback when Krisp is unavailable but AudioWorklet is supported.
 * - Native noiseSuppression constraint: last resort for very old browsers.
 *
 * Shared architecture:
 * - The AudioContext is created once and reused across device switches (needed for AudioWorkletNode).
 * - A new processor is created per track (processors can't be reused across tracks because LiveKit
 *   calls processor.destroy() when a track is stopped).
 * - On device change, LiveKit internally calls processor.restart() on the existing track — we do NOT
 *   destroy the processor/AudioContext during device switches to avoid breaking that restart.
 * - On track ended (device unplug), we abandon the processor refs and auto-recover to the system
 */
export const useAudioToggle = (switchActiveDevice: SwitchActiveDevice) => {
    const { reportMeetError: reportError } = useMeetErrorReporting();

    const activeMicrophoneDeviceId = useMeetSelector(selectActiveMicrophoneId);
    const initialAudioState = useMeetSelector(selectInitialAudioState);
    const microphones = useMeetSelector(selectMicrophones);
    const microphoneState = useMeetSelector(selectMicrophoneState);
    const isKrispDebugEnabled = useMeetSelector(selectKrispDebug);
    const store = useMeetStore();

    const [noiseFilter, setNoiseFilter] = useState(() => {
        const persisted = getPersistedNoiseFilter();
        return persisted ?? true;
    });
    const { isMicrophoneEnabled, localParticipant } = useLocalParticipant();

    const noiseFilterProcessor = useRef<TrackProcessor<Track.Kind.Audio, AudioProcessorOptions> | null>(null);
    /** Persistent AudioContext reused across device switches — only closed on unmount */
    const audioContext = useRef<AudioContext | null>(null);
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

    const isAdvancedNoiseFilterSupported = isKrispNoiseFilterBrowserSupported && isRoomInLivekitCloud(room);

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

    /** Returns the persistent AudioContext, creating one if needed (e.g. first attach or after unmount cleanup). */
    const getOrCreateAudioContext = () => {
        if (audioContext.current && audioContext.current.state !== 'closed') {
            return audioContext.current;
        }
        // RNNoise's model is trained on 48 kHz audio — request it explicitly. Some browsers
        // (older iOS Safari, some Android configs) silently ignore the option, hence the readback below.
        // @ts-ignore - webkitAudioContext is not available in all browsers
        const Ctor = (window.AudioContext || window.webkitAudioContext) as typeof AudioContext;
        const ctx = new Ctor({ sampleRate: 48000 });
        audioContext.current = ctx;
        debugLog('noiseFilter:audio-context-created', { sampleRate: ctx.sampleRate });
        if (isRNNoiseFilterBrowserSupported && ctx.sampleRate === 48000) {
            preloadRNNoiseWorklet(ctx);
        }
        return ctx;
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

    /**
     * Recreates the mic track with a new native `noiseSuppression` value.
     * `restartTrack` is the only path that re-runs `getUserMedia` and forces the
     * browser to reinitialize its Audio Processing Module — `applyConstraints`
     * and `setMicrophoneEnabled` are both no-ops on a published track.
     *
     * Used as the noise-cancellation fallback when Krisp isn't available.
     */
    const recreateMicrophoneWithNoiseSuppression = async (enabled: boolean) => {
        const audioTrack = getCurrentPublication()?.audioTrack;

        if (!audioTrack) {
            debugLog('noiseFilter:native-recreate-skip', { reason: 'no-current-track' });
            return;
        }

        if (toggleInProgress.current) {
            debugLog('noiseFilter:native-recreate-skip', { reason: 'toggle-in-progress' });
            return;
        }

        const previousTrack = audioTrack.mediaStreamTrack;

        const useIOSWorkaround = isAudioSessionAvailable();
        const deviceId = activeMicrophoneDeviceId;
        const restartOptions = {
            ...(useIOSWorkaround || !deviceId ? {} : { deviceId: { exact: deviceId } }),
            echoCancellation: true,
            autoGainControl: true,
            noiseSuppression: enabled,
            channelCount: 1,
        };

        toggleInProgress.current = true;
        try {
            // Old MediaStreamTrack is about to be stopped — drop any Krisp refs pointing to it.
            abandonNoiseFilter();

            await withTimeout(
                audioTrack.restartTrack(restartOptions),
                'Restart audio track for noise suppression',
                TOGGLE_TIMEOUT_MS
            );

            const newTrack = audioTrack.mediaStreamTrack;
            if (newTrack) {
                const applied = newTrack.getSettings().noiseSuppression;
                debugLog('noiseFilter:native-recreated', {
                    requested: enabled,
                    applied,
                    honored: applied === enabled,
                    trackChanged: newTrack !== previousTrack,
                });
            } else {
                debugLog('noiseFilter:native-recreate-no-new-track');
            }
        } catch (error) {
            debugLog('noiseFilter:native-recreate-failed', { reason: getErrorReason(error) });
        } finally {
            toggleInProgress.current = false;
        }
    };

    /** Full cleanup: abandons processor refs AND closes the AudioContext. Only used on unmount. */
    const destroyNoiseFilter = () => {
        abandonNoiseFilter();

        const ctx = audioContext.current;
        audioContext.current = null;

        if (ctx && ctx.state !== 'closed') {
            ctx.close().catch(() => {});
            debugLog('noiseFilter:audio-context-closed');
        }
    };

    /**
     * Creates a new noise filter processor (Krisp or RNNoise) and attaches it to the current audio track.
     * Reuses the persistent AudioContext. Guards against stale attach via generation counter —
     * if abandonNoiseFilter() is called while setProcessor is in flight, the result is discarded.
     * On failure, detaches the AudioContext from the track so audio still flows directly.
     */
    const attachNoiseFilter = async () => {
        const publication = getCurrentPublication();
        const currentAudioTrack = publication?.audioTrack;

        const isAnyProcessorSupported = isAdvancedNoiseFilterSupported || isRNNoiseFilterBrowserSupported;
        if (!currentAudioTrack || !isAnyProcessorSupported) {
            debugLog('noiseFilter:attach-skip', {
                hasTrack: !!currentAudioTrack,
                krisp: isAdvancedNoiseFilterSupported,
                rnnoise: isRNNoiseFilterBrowserSupported,
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
            const proc = noiseFilterProcessor.current as KrispNoiseFilterProcessor;
            if (typeof proc.isEnabled === 'function' && !proc.isEnabled()) {
                debugLog('noiseFilter:re-enable-existing');
                await withTimeout(proc.setEnabled(true), 'Re-enable noise filter', NOISE_FILTER_ATTACH_TIMEOUT_MS);
            }
            return;
        }

        noiseFilterProcessor.current = null;
        attachedTrackId.current = null;

        const gen = ++noiseFilterGeneration.current;
        const ctx = getOrCreateAudioContext();

        debugLog('noiseFilter:attach-start', { trackId: currentAudioTrack.id, generation: gen });

        // RNNoise requires 48 kHz; if the browser ignored our sampleRate request, skip it
        // (the model would produce garbage at any other rate).
        const wouldUseRNNoise = !isAdvancedNoiseFilterSupported && isRNNoiseFilterBrowserSupported;
        if (wouldUseRNNoise && ctx.sampleRate !== 48000) {
            debugLog('noiseFilter:attach-skip-non-48k', { sampleRate: ctx.sampleRate });
            return;
        }

        if (wouldUseRNNoise) {
            await withTimeout(waitForRNNoiseWorklet(ctx), 'rnnoise-worklet-load', TOGGLE_TIMEOUT_MS);
        }

        if (noiseFilterGeneration.current !== gen) {
            debugLog('noiseFilter:attach-aborted-stale-pre-processor', { generation: gen });
            return;
        }

        const processor = isAdvancedNoiseFilterSupported
            ? KrispNoiseFilter({ debugLogs: isKrispDebugEnabled })
            : RNNoiseFilter();

        try {
            currentAudioTrack.setAudioContext(ctx);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

        const realtimeMicrophones = await selectRealtimeDevices(store, 'audioinput');

        const requestedDeviceId =
            audioDeviceId === DEFAULT_DEVICE_ID ? microphoneState.systemDefault?.deviceId : audioDeviceId;
        const availableDeviceIds = new Set(realtimeMicrophones.map((mic) => mic.deviceId).filter(Boolean));
        const fallbackDeviceId = realtimeMicrophones[0]?.deviceId || microphoneState.systemDefault?.deviceId || null;
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
            noiseSuppression: isAdvancedNoiseFilterSupported || isRNNoiseFilterBrowserSupported ? false : noiseFilter,
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
            if (
                isEnabled &&
                (isAdvancedNoiseFilterSupported || isRNNoiseFilterBrowserSupported) &&
                noiseFilter &&
                !skipNoiseFilter
            ) {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeMicrophoneDeviceId, microphones, room, localParticipant]);

    const toggleNoiseFilter = async () => {
        debugLog('toggleNoiseFilter:start', { isMicrophoneEnabled, currentValue: noiseFilter });
        const newValue = !noiseFilter;
        setNoiseFilter(newValue);
        persistNoiseFilter(newValue);

        if (isMicrophoneEnabled) {
            try {
                if (isAdvancedNoiseFilterSupported || isRNNoiseFilterBrowserSupported) {
                    if (newValue) {
                        await attachNoiseFilter();
                    } else {
                        await detachNoiseFilter();
                    }
                } else {
                    // Neither Krisp nor RNNoise available — recreate the mic track with the native
                    // `noiseSuppression` constraint as a last resort. `applyConstraints` is a no-op
                    // for this constraint once the track is published in an RTCPeerConnection.
                    await recreateMicrophoneWithNoiseSuppression(newValue);
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
