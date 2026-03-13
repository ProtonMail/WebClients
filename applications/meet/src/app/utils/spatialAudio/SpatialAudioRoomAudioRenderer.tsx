import { getTrackReferenceId } from '@livekit/components-core';
import type { RoomAudioRendererProps } from '@livekit/components-react';
import { AudioTrack, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';

/**
 * Render non-microphone remote audio via LiveKit elements.
 * Microphone audio is owned by SpatialAudioManager.
 */
export function SpatialAudioRoomAudioRenderer({ room, volume, muted }: RoomAudioRendererProps) {
    const tracks = useTracks([Track.Source.ScreenShareAudio, Track.Source.Unknown], {
        updateOnlyOn: [],
        onlySubscribed: true,
        room,
    }).filter((ref) => !ref.participant.isLocal && ref.publication.kind === Track.Kind.Audio);

    return (
        <div style={{ display: 'none' }}>
            {tracks.map((trackRef) => (
                <AudioTrack key={getTrackReferenceId(trackRef)} trackRef={trackRef} volume={volume} muted={muted} />
            ))}
        </div>
    );
}
