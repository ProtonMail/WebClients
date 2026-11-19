import { useRoomContext, useStartAudio, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectAudioPlaybackStatus } from '@proton/meet/store/slices/deviceManagementSlice/selectors';

export const useIsAudioPlaybackBlocked = () => {
    const room = useRoomContext();

    // LiveKit's flag goes false when a resume misses its 200ms window, and true when the muted
    // elements play while the mixing context stays suspended, so only the playback status is reliable
    const { canPlayAudio } = useStartAudio({ room, props: {} });
    const audioPlaybackStatus = useMeetSelector(selectAudioPlaybackStatus);

    const hasRemoteAudio = useTracks([Track.Source.Microphone, Track.Source.ScreenShareAudio], {
        updateOnlyOn: [],
        onlySubscribed: true,
    }).some((trackRef) => !trackRef.participant.isLocal && trackRef.publication.kind === Track.Kind.Audio);

    const isAudioMixed = typeof room.options.webAudioMix === 'object';
    const isPlaybackBlocked = isAudioMixed ? audioPlaybackStatus === 'blocked' : !canPlayAudio;

    return hasRemoteAudio && isPlaybackBlocked;
};
