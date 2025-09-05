import { useLocalParticipant, useRoomContext, useTracks } from '@livekit/components-react';
import { LocalVideoTrack, Track } from '@proton-meet/livekit-client';
import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { isMobile } from '@proton/shared/lib/helpers/browser';

import { screenShareQuality } from '../qualityConstants';

export function useCurrentScreenShare() {
    const { localParticipant } = useLocalParticipant();

    const notifications = useNotifications();

    const screenShareTrack = useTracks([Track.Source.ScreenShare])[0];

    const screenShareParticipant = screenShareTrack?.participant;

    const isLocalScreenShare = screenShareParticipant?.identity === localParticipant.identity;

    const room = useRoomContext();

    const stopScreenShare = () => {
        const screenShareTrack = room.localParticipant.getTrackPublication(Track.Source.ScreenShare);
        if (screenShareTrack?.track) {
            void room.localParticipant.unpublishTrack(screenShareTrack.track);
        }
    };

    const startScreenShare = async () => {
        try {
            const isOnMobile = isMobile();

            if (isOnMobile) {
                notifications.createNotification({
                    type: 'info',
                    text: c('Error').t`Screen share is not supported on mobile browsers`,
                });

                return;
            }

            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { max: screenShareQuality.resolution.width },
                    height: { max: screenShareQuality.resolution.height },
                    frameRate: screenShareQuality.encoding.maxFramerate,
                },
            });

            const [mediaStreamTrack] = stream.getVideoTracks();

            const localTrack = new LocalVideoTrack(mediaStreamTrack);

            await localParticipant.publishTrack(localTrack, {
                source: Track.Source.ScreenShare,
                videoEncoding: {
                    maxBitrate: screenShareQuality.encoding.maxBitrate,
                    maxFramerate: screenShareQuality.encoding.maxFramerate,
                },
            });

            mediaStreamTrack.onended = () => {
                stopScreenShare();
            };
        } catch (err) {
            notifications.createNotification({
                type: 'error',
                text: c('Error').t`Failed to start screen share`,
            });
        }
    };

    return {
        isLocalScreenShare,
        isScreenShare: !!screenShareTrack,
        screenShareParticipant: screenShareParticipant,
        screenShareTrack,
        stopScreenShare,
        startScreenShare,
    };
}
