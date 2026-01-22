import { useEffect, useRef } from 'react';

import { useRoomContext } from '@livekit/components-react';

import { AudioTrackSubscriptionManager } from '../../utils/subscriptionManagers/AudioTrackSubscriptionManager';

const MAX_SUBSCRIBED_MICROPHONE_TRACKS = 80;

export const useParticipantAudioControls = () => {
    const room = useRoomContext();

    const audioTrackSubscriptionManager = useRef(
        new AudioTrackSubscriptionManager(MAX_SUBSCRIBED_MICROPHONE_TRACKS, room)
    );

    useEffect(() => {
        audioTrackSubscriptionManager.current.setup();

        return () => {
            audioTrackSubscriptionManager.current.cleanup();
        };
    }, [room]);
};
