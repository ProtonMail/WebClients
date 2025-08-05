import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useLocalParticipant, useParticipants } from '@livekit/components-react';
import { type Track as LiveKitTrack, LocalVideoTrack, Track } from 'livekit-client';
import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { isMobile } from '@proton/shared/lib/helpers/browser';

import { useScreenshareResolution } from './useScreenshareResolution';

const increasedVideoQuality = process.env.LIVEKIT_INCREASED_VIDEO_QUALITY === 'true';

export function useCurrentScreenShare() {
    const participants = useParticipants();
    const { localParticipant } = useLocalParticipant();
    const screenshareResolution = useScreenshareResolution();

    const notifications = useNotifications();

    const screenShareVideoRef = useRef<HTMLVideoElement>(null);

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

    const stopScreenShare = useCallback(() => {
        const localScreenSharePub = Array.from(localParticipant.trackPublications.values()).find(
            (pub) =>
                pub.kind === Track.Kind.Video && pub.source === Track.Source.ScreenShare && pub.track && !pub.isMuted
        );
        if (localScreenSharePub) {
            void localParticipant.unpublishTrack(localScreenSharePub.track!);
        }
    }, [localParticipant]);

    const startScreenShare = async () => {
        try {
            const isOnMobile = isMobile();

            if (isOnMobile) {
                notifications.createNotification({
                    type: 'info',
                    text: c('meet_2025 Error').t`Screen share is not supported on mobile browsers`,
                });

                return;
            }

            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { max: screenshareResolution.resolution.width },
                    height: { max: screenshareResolution.resolution.height },
                    frameRate: screenshareResolution.encoding.maxFramerate,
                },
            });

            const [mediaStreamTrack] = stream.getVideoTracks();

            const localTrack = new LocalVideoTrack(mediaStreamTrack);

            await localParticipant.publishTrack(localTrack, {
                source: Track.Source.ScreenShare,
                videoEncoding: {
                    maxBitrate: screenshareResolution.encoding.maxBitrate,
                    maxFramerate: screenshareResolution.encoding.maxFramerate,
                },
                simulcast: increasedVideoQuality,
            });

            mediaStreamTrack.onended = () => {
                stopScreenShare();
            };
        } catch (err) {
            console.error(err);

            notifications.createNotification({
                type: 'error',
                text: c('meet_2025 Error').t`Failed to start screen share`,
            });
        }
    };

    useEffect(() => {
        if (result.videoTrack && screenShareVideoRef.current) {
            result.videoTrack.attach(screenShareVideoRef.current);
            return () => {
                result.videoTrack.detach(screenShareVideoRef.current!);
            };
        }
    }, [result.videoTrack]);

    return { ...result, stopScreenShare, startScreenShare, screenShareVideoRef };
}
