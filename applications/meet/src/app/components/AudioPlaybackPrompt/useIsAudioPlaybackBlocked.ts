import { useCallback, useSyncExternalStore } from 'react';

import { useRoomContext, useStartAudio, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';

export const useIsAudioPlaybackBlocked = () => {
    const room = useRoomContext();

    // LiveKit's flag goes false when a resume misses its 200ms window, and true when the muted
    // elements play while the mixing context stays suspended, so only the context state is reliable
    const { canPlayAudio } = useStartAudio({ room, props: {} });

    const { webAudioMix } = room.options;
    const audioContext = typeof webAudioMix === 'object' ? webAudioMix.audioContext : undefined;

    const subscribe = useCallback(
        (onStateChange: () => void) => {
            audioContext?.addEventListener('statechange', onStateChange);
            return () => audioContext?.removeEventListener('statechange', onStateChange);
        },
        [audioContext]
    );
    const audioContextState = useSyncExternalStore(subscribe, () => audioContext?.state);

    const hasRemoteAudio = useTracks([Track.Source.Microphone, Track.Source.ScreenShareAudio], {
        updateOnlyOn: [],
        onlySubscribed: true,
    }).some((trackRef) => !trackRef.participant.isLocal && trackRef.publication.kind === Track.Kind.Audio);

    const isPlaybackRunning = audioContext ? audioContextState !== 'suspended' : canPlayAudio;

    return hasRemoteAudio && !isPlaybackRunning;
};
