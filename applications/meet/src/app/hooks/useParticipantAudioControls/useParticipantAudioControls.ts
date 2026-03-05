import { useEffect, useState } from 'react';

import { useRoomContext } from '@livekit/components-react';

import { useMeetErrorReporting } from '@proton/meet';
import { useFlag } from '@proton/unleash/useFlag';

import { AudioTrackSubscriptionManager } from '../../utils/subscriptionManagers/AudioTrackSubscriptionManager';

const MAX_SUBSCRIBED_MICROPHONE_TRACKS = 80;

export const useParticipantAudioControls = () => {
    const room = useRoomContext();
    const reportError = useMeetErrorReporting();
    const disableAudioAutoHealing = useFlag('MeetDisableAudioAutoHealing');

    const [audioTrackSubscriptionManager] = useState(
        () =>
            new AudioTrackSubscriptionManager(
                MAX_SUBSCRIBED_MICROPHONE_TRACKS,
                room,
                reportError,
                disableAudioAutoHealing
            )
    );

    useEffect(() => {
        audioTrackSubscriptionManager.setup();

        return () => {
            audioTrackSubscriptionManager.cleanup();
        };
    }, []);
};
