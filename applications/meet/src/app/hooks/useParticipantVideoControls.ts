import { useEffect } from 'react';

import { useLocalParticipant, useTracks } from '@livekit/components-react';
import type { RemoteTrackPublication } from '@proton-meet/livekit-client';
import { Track } from '@proton-meet/livekit-client';

import { useMeetContext } from '../contexts/MeetContext';

export const useParticipantVideoControls = () => {
    const { pagedParticipants } = useMeetContext();
    const { participantsWithDisabledVideos, disableVideos } = useMeetContext();
    const { localParticipant } = useLocalParticipant();

    const tracks = useTracks([Track.Source.Camera]);

    const tracksToTurnOn = tracks.filter(
        (track) =>
            track.participant.identity !== localParticipant.identity &&
            pagedParticipants.some((participant) => participant.identity === track.participant.identity) &&
            !disableVideos &&
            !participantsWithDisabledVideos.includes(track.participant.identity) &&
            !track.publication.isEnabled
    );

    const tracksToTurnOff = tracks.filter(
        (track) =>
            track.participant.identity !== localParticipant.identity &&
            (!pagedParticipants.some((participant) => participant.identity === track.participant.identity) ||
                disableVideos ||
                participantsWithDisabledVideos.includes(track.participant.identity)) &&
            track.publication.isEnabled
    );

    const tracksToTurnOnSignature = tracksToTurnOn
        .map((track) => track.publication.trackSid)
        .sort()
        .join(',');
    const tracksToTurnOffSignature = tracksToTurnOff
        .map((track) => track.publication.trackSid)
        .sort()
        .join(',');

    useEffect(() => {
        tracksToTurnOn.forEach((track) => (track.publication as RemoteTrackPublication).setEnabled(true));
    }, [tracksToTurnOnSignature]);

    useEffect(() => {
        tracksToTurnOff.forEach((track) => (track.publication as RemoteTrackPublication).setEnabled(false));
    }, [tracksToTurnOffSignature]);
};
