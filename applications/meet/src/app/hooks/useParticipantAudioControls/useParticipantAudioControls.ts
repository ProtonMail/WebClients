import { useEffect, useState } from 'react';

import { useRoomContext } from '@livekit/components-react';

import { useMeetErrorReporting } from '@proton/meet';

import { AudioTrackSubscriptionManager } from '../../utils/subscriptionManagers/AudioTrackSubscriptionManager';

const MAX_SUBSCRIBED_MICROPHONE_TRACKS = 80;

export const useParticipantAudioControls = () => {
    const room = useRoomContext();
    const reportError = useMeetErrorReporting();

    const [audioTrackSubscriptionManager] = useState(
        () => new AudioTrackSubscriptionManager(MAX_SUBSCRIBED_MICROPHONE_TRACKS, room, reportError)
    );

    useEffect(() => {
        audioTrackSubscriptionManager.setup();

        return () => {
            audioTrackSubscriptionManager.cleanup();
        };
    }, []);
};
