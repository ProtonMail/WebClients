import { useMemo } from 'react';

import { useLocalParticipant, useParticipants } from '@livekit/components-react';
import { type Track as LiveKitTrack, LocalVideoTrack, Track } from 'livekit-client';

export function useCurrentScreenShare() {
    const participants = useParticipants();
    const { localParticipant } = useLocalParticipant();

    const result = useMemo(() => {
        for (const participant of participants) {
            for (const publication of participant.trackPublications.values()) {
                if (publication.source === Track.Source.ScreenShare && publication.track && !publication.isMuted) {
                    return {
                        videoTrack: publication.track as LiveKitTrack,
                        participant,
                        isLocal: participant.identity === localParticipant.identity,
                    };
                }
            }
        }
        return {
            videoTrack: null,
            participant: null,
            isLocal: false,
        };
    }, [participants, localParticipant]);

    const stopScreenShare = () => {
        const localScreenSharePub = Array.from(localParticipant.trackPublications.values()).find(
            (pub) =>
                pub.kind === Track.Kind.Video && pub.source === Track.Source.ScreenShare && pub.track && !pub.isMuted
        );
        if (localScreenSharePub) {
            void localParticipant.unpublishTrack(localScreenSharePub.track!);
        }
    };

    const startScreenShare = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { max: 1280 },
                    height: { max: 720 },
                    frameRate: 15,
                },
            });
            const [mediaStreamTrack] = stream.getVideoTracks();

            const localTrack = new LocalVideoTrack(mediaStreamTrack);

            await localParticipant.publishTrack(localTrack, {
                source: Track.Source.ScreenShare,
            });

            mediaStreamTrack.onended = () => {
                stopScreenShare();
            };
        } catch (err) {
            console.error(err);
        }
    };

    return { ...result, stopScreenShare, startScreenShare };
}
