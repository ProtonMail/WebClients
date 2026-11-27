import { useCallback, useEffect, useRef } from 'react';

import { ConnectionState, type Room } from 'livekit-client';

import type { ReportMeetError } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { setAudioPlaybackStatus } from '@proton/meet/store/slices/deviceManagementSlice';
import { selectActiveAudioOutputId } from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { TelemetryMeetActionsEvents, sendMeetActionsEvent } from '@proton/meet/telemetry/meetTelemetry';
import { meetingLogger } from '@proton/meet/utils/meetingLogger';
import { withTimeout } from '@proton/meet/utils/withTimeout';
import { isFirefox } from '@proton/shared/lib/helpers/browser';
import { wait } from '@proton/shared/lib/helpers/promise';
import { useFlag } from '@proton/unleash/useFlag';

import { supportsSetSinkId } from '../../../utils/browser';
import type { MeetAudioContext } from '../../../utils/meet-audio-context';
import { retry } from '../../../utils/retry';

// statechange fires before the OS finishes removing the device, so an immediate attempt has no output
// to acquire. Later attempts are spaced out because Bluetooth renegotiation could takes over a second.
const RECOVERY_DELAYS_MS = [250, 500, 1_000, 2_000];

const FALLBACK_TIMEOUT_MS = 5_000;

const CLOCK_CHECK_MS = 1_000;

const STALLED_CLOCK_SECONDS = 0.05;

const CLOCK_SAMPLE_MS = 1_000;

// Firefox can stop its audio graph for good after quick default device changes, and only a reload
// recovers it (https://bugzilla.mozilla.org/show_bug.cgi?id=1879353). Shorter freezes on a device
// change recover on their own, so only a long one counts as frozen.
const FROZEN_CLOCK_MS = 10_000;

const MAX_SAMPLE_GAP_MS = 2 * CLOCK_SAMPLE_MS;

interface ClockSample {
    state: AudioContextState;
    currentTime: number;
    atMs: number;
}

interface ClockWatch {
    currentTime: number;
    sampledAtMs: number;
    stillSinceMs: number;
    isFrozen: boolean;
}

type ClockTransition = { type: 'froze' } | { type: 'unfroze'; frozenForMs: number } | { type: 'none' };

const startClockWatch = ({ currentTime, atMs }: ClockSample): ClockWatch => ({
    currentTime,
    sampledAtMs: atMs,
    stillSinceMs: atMs,
    isFrozen: false,
});

const sampleClock = (
    watch: ClockWatch | undefined,
    sample: ClockSample
): { watch: ClockWatch | undefined; transition: ClockTransition } => {
    if (sample.state !== 'running') {
        return { watch: undefined, transition: { type: 'none' } };
    }

    if (!watch) {
        return { watch: startClockWatch(sample), transition: { type: 'none' } };
    }

    if (sample.currentTime > watch.currentTime) {
        return {
            watch: startClockWatch(sample),
            transition: watch.isFrozen
                ? { type: 'unfroze', frozenForMs: sample.atMs - watch.stillSinceMs }
                : { type: 'none' },
        };
    }

    if (sample.atMs - watch.sampledAtMs > MAX_SAMPLE_GAP_MS && !watch.isFrozen) {
        return { watch: startClockWatch(sample), transition: { type: 'none' } };
    }

    const carriedWatch = { ...watch, currentTime: sample.currentTime, sampledAtMs: sample.atMs };

    if (!watch.isFrozen && sample.atMs - watch.stillSinceMs >= FROZEN_CLOCK_MS) {
        return { watch: { ...carriedWatch, isFrozen: true }, transition: { type: 'froze' } };
    }

    return { watch: carriedWatch, transition: { type: 'none' } };
};

const isSilent = (state: AudioContextState) => state === 'suspended' || state === 'interrupted';

const needsUnblock = (state: AudioContextState) => state === 'suspended';

const measureClockAdvanceSeconds = async (audioContext: AudioContext) => {
    const startTime = audioContext.currentTime;
    await wait(CLOCK_CHECK_MS);
    return audioContext.currentTime - startTime;
};

/**
 * Applies the active output device to the shared playback AudioContext, and resumes that context when
 * it turns suspended, which happens when the OS removes the device it was rendering to. It is the one
 * place that tells whether playback is running, recovering, blocked or frozen.
 */
export const useAudioContextOutput = ({
    meetAudioContext,
    room,
    reportMeetError,
}: {
    meetAudioContext: MeetAudioContext;
    room: Room;
    reportMeetError: ReportMeetError;
}) => {
    const dispatch = useMeetDispatch();
    const activeAudioOutputDeviceId = useMeetSelector(selectActiveAudioOutputId);
    const isFrozenAudioPlaybackBannerEnabled = useFlag('MeetFrozenAudioPlaybackBanner');

    // Before the first remote track the context is suspended by the autoplay policy, not by a failure
    const hasBeenRunningRef = useRef(false);

    // Without webAudioMix this context renders nothing: LiveKit plays through audio elements
    // instead, so pinning this sink would point at a device that is not the one playing.
    const { webAudioMix } = room.options;
    const isPlaybackContext =
        typeof webAudioMix === 'object' && webAudioMix.audioContext === meetAudioContext.audioContext;

    // Going through LiveKit moves the remote audio elements too, not just this context's sink
    const fallBackToDefault = useCallback(async () => {
        if (!supportsSetSinkId()) {
            return;
        }

        try {
            await withTimeout(
                room.switchActiveDevice('audiooutput', ''),
                'Fall back to the default audio output',
                FALLBACK_TIMEOUT_MS
            );
        } catch (error) {
            reportMeetError('Error falling back to the default audio output', { context: { error } });
        }
    }, [room, reportMeetError]);

    useEffect(() => {
        // '' is the system default, which still has to be pinned: leaving the sink untouched keeps
        // whatever device the context resolved at construction, before the room had an output.
        if (!isPlaybackContext || activeAudioOutputDeviceId === null) {
            return;
        }

        // A pending setSinkId can resolve after the effect re-ran for a newer device
        let isStale = false;

        const restartIfClockStalled = async () => {
            const { audioContext } = meetAudioContext;
            const clockAdvancedSeconds = await measureClockAdvanceSeconds(audioContext);

            if (isStale || audioContext.state !== 'running' || clockAdvancedSeconds >= STALLED_CLOCK_SECONDS) {
                return;
            }

            meetingLogger.info('Restarting a stalled audio context', { clockAdvancedSeconds });

            try {
                await audioContext.suspend();
                await audioContext.resume();
            } catch (error) {
                reportMeetError('Error restarting a stalled audio context', { context: { error } });
            }

            const clockAdvancedAfterRestartSeconds = await measureClockAdvanceSeconds(audioContext);

            reportMeetError('Audio context clock stalled after an output change', {
                level: 'warning',
                tags: { restartRecoveredClock: String(clockAdvancedAfterRestartSeconds >= STALLED_CLOCK_SECONDS) },
                context: { clockAdvancedSeconds, clockAdvancedAfterRestartSeconds },
            });
        };

        const applyOutput = async () => {
            const isApplied = await meetAudioContext.setSinkId(activeAudioOutputDeviceId);

            if (isStale) {
                return;
            }

            if (isApplied) {
                void restartIfClockStalled();
                return;
            }

            await fallBackToDefault();
        };

        void applyOutput();

        return () => {
            isStale = true;
        };
    }, [activeAudioOutputDeviceId, isPlaybackContext, meetAudioContext, fallBackToDefault, reportMeetError]);

    // Chrome fires 'error' when the device this context renders to goes away. Attached whether or
    // not an output was applied, because recovery cannot wait for the store to be populated.
    useEffect(() => {
        if (!isPlaybackContext) {
            return;
        }

        const { audioContext } = meetAudioContext;
        let isRecovering = false;

        const handleOutputDeviceLost = () => {
            if (isRecovering) {
                return;
            }

            isRecovering = true;
            void fallBackToDefault().finally(() => {
                isRecovering = false;
            });
        };

        audioContext.addEventListener('error', handleOutputDeviceLost);

        return () => {
            audioContext.removeEventListener('error', handleOutputDeviceLost);
        };
    }, [isPlaybackContext, meetAudioContext, fallBackToDefault]);

    useEffect(() => {
        const { audioContext } = meetAudioContext;

        let isMounted = true;
        let gaveUpRecoveryAtMs: number | null = null;
        let isRecovering = false;
        let clockWatch: ClockWatch | undefined;

        const recover = async () => {
            isRecovering = true;

            const fromState = audioContext.state;
            let attempts = 0;
            let lastError: unknown;

            // startAudio() replays the attached audio elements on top of resuming, but it resolves
            // whether or not the context came back, so the state is what decides on another attempt
            await retry(
                () => {
                    attempts++;
                    return room.startAudio();
                },
                {
                    delayMs: RECOVERY_DELAYS_MS,
                    shouldAttempt: () => isMounted && isSilent(audioContext.state),
                    onFailure: (error) => {
                        lastError = error;
                    },
                }
            );

            isRecovering = false;

            if (!isMounted) {
                return;
            }

            if (isSilent(audioContext.state)) {
                dispatch(setAudioPlaybackStatus(needsUnblock(audioContext.state) ? 'blocked' : 'recovering'));
                reportMeetError('Audio context stayed suspended after recovery attempts', {
                    context: { error: lastError },
                    tags: { audioContextState: audioContext.state },
                });
                gaveUpRecoveryAtMs ??= Date.now();
                return;
            }

            if (audioContext.state === 'running' && attempts > 0) {
                sendMeetActionsEvent(TelemetryMeetActionsEvents.audio_playback_recovered, {
                    trigger: 'retry',
                    fromState,
                });
            }
        };

        const handleStateChange = () => {
            clockWatch = undefined;
            const { state } = audioContext;

            if (state === 'running') {
                hasBeenRunningRef.current = true;
                dispatch(setAudioPlaybackStatus('running'));

                if (gaveUpRecoveryAtMs !== null) {
                    reportMeetError('Audio context recovered after recovery attempts failed', {
                        level: 'warning',
                        context: { recoveredAfterMs: Date.now() - gaveUpRecoveryAtMs },
                    });
                    gaveUpRecoveryAtMs = null;
                }
                return;
            }

            if (!isSilent(state)) {
                return;
            }

            // Avoid recovery before anything has played and on disconnected rooms
            if (!hasBeenRunningRef.current || room.state === ConnectionState.Disconnected) {
                dispatch(setAudioPlaybackStatus(needsUnblock(state) ? 'blocked' : 'recovering'));
                return;
            }

            dispatch(setAudioPlaybackStatus('recovering'));

            if (!isRecovering) {
                void recover();
            }
        };

        const watchPlaybackClock = () => {
            const sample = { state: audioContext.state, currentTime: audioContext.currentTime, atMs: Date.now() };
            const { watch, transition } = sampleClock(clockWatch, sample);
            clockWatch = watch;

            if (transition.type === 'froze') {
                dispatch(setAudioPlaybackStatus('frozen'));
                reportMeetError('Audio context clock froze while running', { level: 'warning' });
                return;
            }

            if (transition.type === 'unfroze') {
                dispatch(setAudioPlaybackStatus('running'));
                reportMeetError('Audio context clock recovered after being frozen', {
                    level: 'warning',
                    context: { frozenForMs: transition.frozenForMs },
                });
            }
        };

        handleStateChange();

        audioContext.addEventListener('statechange', handleStateChange);

        const clockInterval =
            isPlaybackContext && isFirefox() && isFrozenAudioPlaybackBannerEnabled
                ? setInterval(watchPlaybackClock, CLOCK_SAMPLE_MS)
                : undefined;

        return () => {
            isMounted = false;
            clearInterval(clockInterval);
            audioContext.removeEventListener('statechange', handleStateChange);
        };
    }, [meetAudioContext, isPlaybackContext, isFrozenAudioPlaybackBannerEnabled, room, reportMeetError, dispatch]);
};
