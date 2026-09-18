import { getTrackReferenceId } from '@livekit/components-core';
import { RoomAudioRenderer, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';

import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';

import { SpatialAudioRoomAudioRenderer } from '../../utils/spatialAudio/SpatialAudioRoomAudioRenderer';

/**
 * Track attachment can throw, so the boundary keeps a failure from taking down the meeting and is
 * reset on track changes to avoid silencing the call for good. LiveKit also attaches from its own
 * room event handlers, where throws never reach React.
 */
export const AudioRenderer = ({ isSpatialAudioEnabled }: { isSpatialAudioEnabled: boolean }) => {
    const { reportMeetError } = useMeetErrorReporting();

    const remoteAudioTrackIds = useTracks([Track.Source.Microphone, Track.Source.ScreenShareAudio], {
        updateOnlyOn: [],
        onlySubscribed: true,
    })
        .filter((trackRef) => !trackRef.participant.isLocal && trackRef.publication.kind === Track.Kind.Audio)
        .map(getTrackReferenceId)
        .join();

    return (
        <ErrorBoundary
            component={null}
            resetKey={remoteAudioTrackIds}
            onError={(error) => reportMeetError('Error rendering remote audio', { context: { error } })}
        >
            {isSpatialAudioEnabled ? <SpatialAudioRoomAudioRenderer /> : <RoomAudioRenderer />}
        </ErrorBoundary>
    );
};
