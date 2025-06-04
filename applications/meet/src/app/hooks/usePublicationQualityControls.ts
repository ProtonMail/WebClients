import { useEffect, useRef } from 'react';

import { useLocalParticipant } from '@livekit/components-react';
import type { RemoteParticipant, RemoteTrackPublication } from 'livekit-client';
import { Track, VideoQuality } from 'livekit-client';

import { useMeetContext } from '../contexts/MeetContext';
import { useSortedParticipants } from './useSortedParticipants';
import { useVideoToggle } from './useVideoToggle';

const increasedVideoQuality = process.env.LIVEKIT_INCREASED_VIDEO_QUALITY === 'true';

export const usePublicationQualityControls = () => {
    const { sortedParticipants, pagedParticipants } = useSortedParticipants();
    const { quality, videoDeviceId, isVideoEnabled } = useMeetContext();
    const { localParticipant } = useLocalParticipant();

    const prevSortedParticipants = useRef(sortedParticipants);
    const prevPagedParticipants = useRef(pagedParticipants);

    const toggleVideo = useVideoToggle();

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
            if (participant.identity === localParticipant.identity) {
                return;
            }

            Array.from((participant as RemoteParticipant).trackPublications.values()).forEach(
                (publication: RemoteTrackPublication) => {
                    if (
                        publication.kind === Track.Kind.Video &&
                        publication.source !== Track.Source.ScreenShare &&
                        typeof publication.setVideoQuality === 'function'
                    ) {
                        const isPaged = pagedParticipants.includes(participant);

                        if (isPaged) {
                            if (increasedVideoQuality) {
                                publication.setVideoQuality(quality);
                            }

                            if (!publication.isSubscribed) {
                                publication.setSubscribed(true);
                            }
                        } else {
                            if (increasedVideoQuality) {
                                publication.setVideoQuality(VideoQuality.LOW);
                            }

                            if (publication.isSubscribed) {
                                publication.setSubscribed(false);
                            }
                        }
                    }
                }
            );
        });
    }, [hasParticipantsChanged, quality]);

    useEffect(() => {
        if (isVideoEnabled) {
            void toggleVideo({ isEnabled: true, videoDeviceId, forceUpdate: true });
        }
    }, [videoDeviceId, toggleVideo]);
};
