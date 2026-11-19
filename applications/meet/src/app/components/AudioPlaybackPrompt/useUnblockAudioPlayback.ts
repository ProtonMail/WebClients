import { useRoomContext } from '@livekit/components-react';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { TelemetryMeetActionsEvents, sendMeetActionsEvent } from '@proton/meet/telemetry/meetTelemetry';
import { withTimeout } from '@proton/meet/utils/withTimeout';

const START_AUDIO_TIMEOUT_MS = 3_000;

export const useUnblockAudioPlayback = () => {
    const room = useRoomContext();
    const { reportMeetError } = useMeetErrorReporting();

    return async () => {
        const { webAudioMix } = room.options;
        const audioContext = typeof webAudioMix === 'object' ? webAudioMix.audioContext : undefined;

        if (!audioContext) {
            await room.startAudio().catch((error: unknown) => {
                reportMeetError('Audio playback still blocked after the unblock tap without audio mixing', {
                    context: { error },
                });
            });
            return;
        }

        const fromState = audioContext.state;
        let error: unknown;

        try {
            await withTimeout(room.startAudio(), 'Start audio after the unblock tap', START_AUDIO_TIMEOUT_MS);
        } catch (caught) {
            error = caught;
        }

        if (audioContext.state === 'running') {
            sendMeetActionsEvent(TelemetryMeetActionsEvents.audio_playback_recovered, {
                trigger: 'user_tap',
                fromState,
            });
            return;
        }

        reportMeetError('Audio playback still blocked after the unblock tap', {
            context: { error },
            tags: { audioContextState: audioContext.state, fromState },
        });
    };
};
