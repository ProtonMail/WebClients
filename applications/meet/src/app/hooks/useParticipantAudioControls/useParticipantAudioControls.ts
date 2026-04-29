import { useEffect, useState } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { WebAudioSettings } from 'livekit-client';

import { useMeetErrorReporting } from '@proton/meet';
import { isChromiumBased } from '@proton/shared/lib/helpers/browser';
import { useFlag } from '@proton/unleash/useFlag';

import { SpatialAudioManager } from '../../utils/spatialAudio/SpatialAudioManager';
import { AudioTrackSubscriptionManager } from '../../utils/subscriptionManagers/AudioTrackSubscriptionManager';

const MAX_SUBSCRIBED_MICROPHONE_TRACKS = 80;

export const useParticipantAudioControls = () => {
    const room = useRoomContext();
    const { reportMeetError: reportError } = useMeetErrorReporting();
    const disableAudioAutoHealing = useFlag('MeetDisableAudioAutoHealing');

    const isMeetEnableAudioMixing = useFlag('MeetEnableAudioMixing') && !isChromiumBased();
    const isMeetEnableSpatialAudio = useFlag('MeetEnableSpatialAudio') && !isChromiumBased();
    const isSpatialAudioEnabled = isMeetEnableAudioMixing && isMeetEnableSpatialAudio;

    const [audioTrackSubscriptionManager] = useState(
        () =>
            new AudioTrackSubscriptionManager(
                MAX_SUBSCRIBED_MICROPHONE_TRACKS,
                room,
                reportError,
                disableAudioAutoHealing
            )
    );

    const [spatialAudioManager] = useState(() => {
        const webAudioMix = room.options.webAudioMix;
        const sharedAudioContext =
            typeof webAudioMix === 'object' ? (webAudioMix as WebAudioSettings).audioContext : undefined;
        return new SpatialAudioManager(room, {
            audioContext: sharedAudioContext,
            isSpatialAudioEnabled,
            reportError,
        });
    });

    useEffect(() => {
        audioTrackSubscriptionManager.setup();
        spatialAudioManager.setup();

        return () => {
            audioTrackSubscriptionManager.cleanup();
            spatialAudioManager.cleanup();
        };
    }, []);
};
