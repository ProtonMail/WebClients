import { useEffect, useRef } from 'react';

import { ConnectionState, type Room } from 'livekit-client';

import type { ReportMeetError } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectActiveAudioOutputId } from '@proton/meet/store/slices/deviceManagementSlice/selectors';

import type { MeetAudioContext } from '../../../utils/meet-audio-context';
import { retry } from '../../../utils/retry';

// statechange fires before the OS finishes removing the device, so an immediate attempt has no output
// to acquire. Later attempts are spaced out because Bluetooth renegotiation could takes over a second.
const RECOVERY_DELAYS_MS = [250, 500, 1_000, 2_000];

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

    // Without webAudioMix this context renders nothing and LiveKit routes playback through audio
    // elements instead. Chrome makes the last setSinkId() context the echo cancellation reference, so
    // pinning it here would point the reference at a device that is not the one playing.
    const { webAudioMix } = room.options;
    const isPlaybackContext =
        typeof webAudioMix === 'object' && webAudioMix.audioContext === meetAudioContext.audioContext;

    useEffect(() => {
        // '' is the system default, which still has to be pinned: leaving the sink untouched keeps
        // whatever device the context resolved at construction, before the room had an output.
        if (isPlaybackContext && activeAudioOutputDeviceId !== null) {
            meetAudioContext.setSinkId(activeAudioOutputDeviceId);
        }
    }, [activeAudioOutputDeviceId, isPlaybackContext, meetAudioContext]);

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
