import { useEffect } from 'react';

import { useLocalParticipant } from '@livekit/components-react';
import type { RemoteParticipant, RemoteTrackPublication } from 'livekit-client';
import { Track, VideoQuality } from 'livekit-client';

import { useMeetContext } from '../contexts/MeetContext';
import { useSortedParticipants } from './useSortedParticipants';

const increasedVideoQuality = process.env.LIVEKIT_INCREASED_VIDEO_QUALITY === 'true';

export const usePublicationQualityControls = () => {
    const { sortedParticipants, pagedParticipants } = useSortedParticipants();
    const { quality, participantsWithDisabledVideos, disableVideos } = useMeetContext();
    const { localParticipant } = useLocalParticipant();

    const sortedParticipantIdentities = sortedParticipants.map((participant) => participant.identity).join(',');
    const pagedParticipantIdentities = pagedParticipants.map((participant) => participant.identity).join(',');

    useEffect(() => {
        sortedParticipants.forEach((participant) => {
            if (participant.identity === localParticipant.identity) {
                return;
            }

            Array.from((participant as RemoteParticipant).trackPublications.values()).forEach(
                (publication: RemoteTrackPublication) => {
                    const isVideo = publication.kind === Track.Kind.Video;

                    if (disableVideos || (participantsWithDisabledVideos.includes(participant.identity) && isVideo)) {
                        publication.setEnabled(false);
                        return;
                    }

                    if (
                        isVideo &&
                        publication.source !== Track.Source.ScreenShare &&
                        typeof publication.setVideoQuality === 'function'
                    ) {
                        const isPaged = pagedParticipants.includes(participant);

                        if (isPaged) {
                            if (increasedVideoQuality) {
                                publication.setVideoQuality(quality);
                            }

                            publication.setEnabled(true);
                        } else {
                            if (increasedVideoQuality) {
                                publication.setVideoQuality(VideoQuality.LOW);
                            }

                            publication.setEnabled(false);
                        }
                    }
                }
            );
        });
    }, [
        sortedParticipantIdentities,
        pagedParticipantIdentities,
        quality,
        disableVideos,
        participantsWithDisabledVideos,
    ]);
};
