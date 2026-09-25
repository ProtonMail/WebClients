import { useCallback, useEffect, useRef } from 'react';

import { ConnectionState, type Room } from 'livekit-client';

import type { ReportMeetError } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectActiveAudioOutputId } from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { withTimeout } from '@proton/meet/utils/withTimeout';

import { supportsSetSinkId } from '../../../utils/browser';
import type { MeetAudioContext } from '../../../utils/meet-audio-context';
import { retry } from '../../../utils/retry';

// statechange fires before the OS finishes removing the device, so an immediate attempt has no output
// to acquire. Later attempts are spaced out because Bluetooth renegotiation could takes over a second.
const RECOVERY_DELAYS_MS = [250, 500, 1_000, 2_000];

const FALLBACK_TIMEOUT_MS = 5_000;

const isSilent = (state: AudioContextState) => state === 'suspended' || state === 'interrupted';

/**
 * Applies the active output device to the shared playback AudioContext, and resumes that context when
 * it turns suspended, which happens when the OS removes the device it was rendering to.
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
    const activeAudioOutputDeviceId = useMeetSelector(selectActiveAudioOutputId);

    // Before the first remote track the context is suspended by the autoplay policy, not by a failure
    const hasBeenRunningRef = useRef(false);
    const isRecoveringRef = useRef(false);

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

        const applyOutput = async () => {
            if (!(await meetAudioContext.setSinkId(activeAudioOutputDeviceId)) && !isStale) {
                await fallBackToDefault();
            }
        };

        void applyOutput();

        return () => {
            isStale = true;
        };
    }, [activeAudioOutputDeviceId, isPlaybackContext, meetAudioContext, fallBackToDefault]);

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

        const recover = async () => {
            isRecoveringRef.current = true;

            let lastError: unknown;

            // startAudio() replays the attached audio elements on top of resuming, but it resolves
            // whether or not the context came back, so the state is what decides on another attempt
            await retry(() => room.startAudio(), {
                delayMs: RECOVERY_DELAYS_MS,
                shouldAttempt: () => isMounted && isSilent(audioContext.state),
                onFailure: (error) => {
                    lastError = error;
                },
            });

            isRecoveringRef.current = false;

            if (isMounted && isSilent(audioContext.state)) {
                reportMeetError('Audio context stayed suspended after recovery attempts', {
                    context: { error: lastError },
                    tags: { audioContextState: audioContext.state },
                });
            }
        };

        const handleStateChange = () => {
            const { state } = audioContext;

            if (state === 'running') {
                hasBeenRunningRef.current = true;
                return;
            }

            if (!hasBeenRunningRef.current || !isSilent(state) || isRecoveringRef.current) {
                return;
            }

            // Avoid recovery on disconnected rooms
            if (room.state === ConnectionState.Disconnected) {
                return;
            }

            void recover();
        };

        if (audioContext.state === 'running') {
            hasBeenRunningRef.current = true;
        }

        audioContext.addEventListener('statechange', handleStateChange);

        return () => {
            isMounted = false;
            audioContext.removeEventListener('statechange', handleStateChange);
        };
    }, [meetAudioContext, room, reportMeetError]);
};
