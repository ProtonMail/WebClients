import React, { useEffect, useMemo, useState } from 'react';

import { RoomAudioRenderer, useLocalParticipant, useParticipants } from '@livekit/components-react';
import type { RemoteTrackPublication, TrackPublication } from 'livekit-client';
import { RemoteParticipant, Track, VideoQuality } from 'livekit-client';
import { c } from 'ttag';

import { useDebouncedActiveSpeakers } from '../hooks/useDebouncedActiveSpeakers';
import { useSetLocalVideoQuality } from '../hooks/useLocalVideoQuality';
import { CustomParticipantTile } from './CustomParticipantTile';

interface ParticipantGridProps {
    maxGridSize: number;
    quality: VideoQuality;
}

const shouldAllowExperimentalDynamicSubscription = process.env.EXPERIMENTAL_DYNAMIC_SUBSCRIPTION === 'true';
const shouldAllowExperimentalActiveSpeakerOrdering = process.env.EXPERIMENTAL_ACTIVE_SPEAKER_ORDERING === 'true';

export const ParticipantGrid = ({ maxGridSize, quality }: ParticipantGridProps) => {
    const participants = useParticipants();
    const activeSpeakers = useDebouncedActiveSpeakers();
    const { localParticipant } = useLocalParticipant();
    const changeQuality = useSetLocalVideoQuality();
    const localIdentity = localParticipant?.identity;
    const activeIdentities = new Set(activeSpeakers.map((p) => p.identity));

    // Flatten all video publications from all participants
    const publications = useMemo(() => {
        return participants.flatMap((participant) =>
            Array.from(participant.trackPublications.values() as Iterable<TrackPublication>)
                .filter((pub) => pub.kind === Track.Kind.Video)
                .map((publication) => ({ participant, publication }))
        );
    }, [participants]);

    const sortedPublications = useMemo(() => {
        if (!shouldAllowExperimentalActiveSpeakerOrdering) {
            return publications;
        }

        return [...publications].sort((a, b) => {
            const aActive = activeIdentities.has(a.participant.identity);
            const bActive = activeIdentities.has(b.participant.identity);
            if (aActive && !bActive) {
                return -1;
            }
            if (!aActive && bActive) {
                return 1;
            }
            if (a.participant.identity === localIdentity) {
                return -1;
            }
            if (b.participant.identity === localIdentity) {
                return 1;
            }
            return 0;
        });
    }, [publications, activeSpeakers, localIdentity]);

    const pageSize = maxGridSize * maxGridSize;
    const [page, setPage] = useState(0);
    const pageCount = Math.ceil(publications.length / pageSize);

    const pagedPublications = useMemo(() => {
        const start = page * pageSize;
        return sortedPublications.slice(start, start + pageSize);
    }, [sortedPublications, page, pageSize]);

    useEffect(() => {
        sortedPublications.forEach(({ participant, publication }) => {
            if (
                publication.kind === Track.Kind.Video &&
                typeof (publication as any).setVideoQuality === 'function' &&
                participant instanceof RemoteParticipant
            ) {
                const isPaged = pagedPublications.some((pub) => pub.publication === publication);

                if (isPaged) {
                    (publication as RemoteTrackPublication).setVideoQuality(quality);

                    if (shouldAllowExperimentalDynamicSubscription && !publication.isSubscribed) {
                        (publication as RemoteTrackPublication).setSubscribed(true);
                    }
                } else {
                    (publication as RemoteTrackPublication).setVideoQuality(VideoQuality.LOW);

                    if (shouldAllowExperimentalDynamicSubscription && publication.isSubscribed) {
                        (publication as RemoteTrackPublication).setSubscribed(false);
                    }
                }
            }
        });
    }, [sortedPublications, pagedPublications, quality]);

    useEffect(() => {
        changeQuality(quality);
    }, [quality, changeQuality]);

    const gridTemplateColumns = () => {
        if (maxGridSize === 1) {
            return '1fr';
        }
        return `repeat(${maxGridSize}, 1fr)`;
    };

    return (
        <>
            {participants.length > pageSize && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, gap: 8 }}>
                    <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                        {c('Meet').t`Previous Page`}
                    </button>
                    <span>
                        {c('Meet').t`Page`} {page + 1} / {pageCount || 1}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                        disabled={page === pageCount - 1 || pageCount <= 1}
                    >
                        {c('Meet').t`Next Page`}
                    </button>
                </div>
            )}

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: gridTemplateColumns(),
                    gap: '10px',
                    width: '100%',
                    height: '100%',
                    padding: '10px',
                }}
            >
                {pagedPublications.map(({ participant, publication }) => {
                    const trackLike = {
                        participant,
                        publication,
                        source: publication.source,
                    };
                    return <CustomParticipantTile key={participant.identity + publication.source} track={trackLike} />;
                })}
            </div>
            <RoomAudioRenderer />
        </>
    );
};
