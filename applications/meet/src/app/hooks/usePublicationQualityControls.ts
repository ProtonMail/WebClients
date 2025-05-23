import { useEffect, useRef } from 'react';

import { useLocalParticipant } from '@livekit/components-react';
import type { LocalVideoTrack, RemoteTrackPublication } from 'livekit-client';
import { RemoteParticipant, Track, VideoQuality } from 'livekit-client';

import { useMeetContext } from '../contexts/MeetContext';
import { useSortedParticipants } from './useSortedParticipants';

export const usePublicationQualityControls = () => {
    const { sortedParticipants, pagedParticipants } = useSortedParticipants();
    const { quality, videoDeviceId, resolution } = useMeetContext();
    const { localParticipant } = useLocalParticipant();

    const prevSortedParticipants = useRef(sortedParticipants);
    const prevPagedParticipants = useRef(pagedParticipants);

    const compareParticipants = () => {
        let hasChanged = false;

        if (prevSortedParticipants.current.length !== sortedParticipants.length) {
            hasChanged = true;
        }

        if (prevPagedParticipants.current.length !== pagedParticipants.length) {
            hasChanged = true;
        }

        if (
            prevSortedParticipants.current.some((participant, index) => {
                return participant.identity !== sortedParticipants[index]?.identity;
            })
        ) {
            hasChanged = true;
        }

        if (
            prevPagedParticipants.current.some((participant, index) => {
                return participant.identity !== pagedParticipants[index]?.identity;
            })
        ) {
            hasChanged = true;
        }

        prevSortedParticipants.current = sortedParticipants;
        prevPagedParticipants.current = pagedParticipants;

        return hasChanged;
    };

    const hasParticipantsChanged = compareParticipants();

    useEffect(() => {
        sortedParticipants.forEach((participant) => {
            if (!(participant instanceof RemoteParticipant)) {
                return;
            }

            Array.from(participant.trackPublications.values()).forEach((publication) => {
                if (
                    publication.kind === Track.Kind.Video &&
                    typeof (publication as any).setVideoQuality === 'function'
                ) {
                    const isPaged = pagedParticipants.includes(participant);

                    if (isPaged) {
                        (publication as RemoteTrackPublication).setVideoQuality(quality);

                        if (!publication.isSubscribed) {
                            (publication as RemoteTrackPublication).setSubscribed(true);
                        }
                    } else {
                        (publication as RemoteTrackPublication).setVideoQuality(VideoQuality.LOW);

                        if (publication.isSubscribed) {
                            (publication as RemoteTrackPublication).setSubscribed(false);
                        }
                    }
                }
            });
        });
    }, [hasParticipantsChanged, quality]);

    useEffect(() => {
        localParticipant.trackPublications.forEach((publication) => {
            if (publication.kind === Track.Kind.Video) {
                void (publication?.videoTrack as LocalVideoTrack)?.restartTrack({
                    deviceId: videoDeviceId,
                    resolution: {
                        width: Number(resolution?.split('x')[0]),
                        height: Number(resolution?.split('x')[1]),
                    },
                });
            }
        });
    }, [resolution, videoDeviceId]);
};
