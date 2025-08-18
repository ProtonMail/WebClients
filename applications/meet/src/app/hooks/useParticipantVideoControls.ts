import { useEffect } from 'react';

import { useLocalParticipant } from '@livekit/components-react';
import type { RemoteParticipant, RemoteTrackPublication } from '@proton-meet/livekit-client';
import { Track } from '@proton-meet/livekit-client';

import { useMeetContext } from '../contexts/MeetContext';

export const useParticipantVideoControls = () => {
    const { sortedParticipants, pagedParticipants } = useMeetContext();
    const { quality, participantsWithDisabledVideos, disableVideos } = useMeetContext();
    const { localParticipant } = useLocalParticipant();

    const sortedParticipantIdentities = sortedParticipants.map((participant) => participant.identity).join(',');
    const pagedParticipantIdentities = pagedParticipants.map((participant) => participant.identity).join(',');

    const publicationSignature = sortedParticipants
        .map((participant) => Array.from(participant.trackPublications.keys()).join(','))
        .join('|');

    useEffect(() => {
        sortedParticipants.forEach((participant) => {
            if (participant.identity === localParticipant.identity) {
                return;
            }

            Array.from((participant as RemoteParticipant).trackPublications.values()).forEach(
                (publication: RemoteTrackPublication) => {
                    const isValid =
                        publication.kind === Track.Kind.Video && publication.source !== Track.Source.ScreenShare;

                    if (
                        (disableVideos || participantsWithDisabledVideos.includes(participant.identity)) &&
                        isValid &&
                        publication.isEnabled
                    ) {
                        publication.setEnabled(false);
                        return;
                    }

                    if (isValid && typeof publication.setVideoQuality === 'function') {
                        const isPaged = !!pagedParticipants.find((p) => p.identity === participant.identity);

                        if (isPaged !== publication.isEnabled) {
                            publication.setEnabled(isPaged);
                        }
                    }
                }
            );
        });
    }, [
        sortedParticipantIdentities,
        pagedParticipantIdentities,
        publicationSignature,
        quality,
        disableVideos,
        participantsWithDisabledVideos,
    ]);
};
