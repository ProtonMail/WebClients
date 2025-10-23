import { useEffect } from 'react';

import { useLocalParticipant, useRoomContext, useTracks } from '@livekit/components-react';
import { Track } from '@proton-meet/livekit-client';
import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { isMobile, isSafari } from '@proton/shared/lib/helpers/browser';

import { screenShareQuality } from '../qualityConstants';

export function useCurrentScreenShare({
    stopPiP,
    startPiP,
    preparePictureInPicture,
}: {
    stopPiP: () => void;
    startPiP: () => void;
    preparePictureInPicture: () => void;
}) {
    const { localParticipant } = useLocalParticipant();

    const notifications = useNotifications();

    const screenShareTrack = useTracks([Track.Source.ScreenShare])[0];

    const screenShareParticipant = screenShareTrack?.participant;

    const isLocalScreenShare = screenShareParticipant?.identity === localParticipant.identity;

    const room = useRoomContext();

    const stopScreenShare = () => {
        stopPiP();
        void room.localParticipant.setScreenShareEnabled(false);
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

            preparePictureInPicture();

            // In Safari we need to start PiP before setting the screen share to not lose user gesture
            if (isSafari()) {
                startPiP();
            }

            await room.localParticipant.setScreenShareEnabled(
                true,
                {
                    resolution: {
                        width: screenShareQuality.resolution.width,
                        height: screenShareQuality.resolution.height,
                        frameRate: screenShareQuality.encoding.maxFramerate,
                    },
                },
                { simulcast: false }
            );

            if (!isSafari()) {
                startPiP();
            }
        } catch (err: any) {
            stopPiP();
            if (err.message === 'Permission denied by user') {
                return;
            }

            notifications.createNotification({
                type: 'error',
                text: c('Error').t`Failed to start screen share`,
            });
        }
    };

    useEffect(() => {
        if (screenShareTrack?.publication?.track) {
            screenShareTrack.publication.track.on('ended', stopPiP);
        }

        return () => {
            if (screenShareTrack?.publication?.track) {
                screenShareTrack.publication.track.off('ended', stopPiP);
            }
        };
    }, [screenShareTrack?.publication?.trackSid]);

    return {
        isLocalScreenShare,
        isScreenShare: !!screenShareTrack,
        screenShareParticipant: screenShareParticipant,
        screenShareTrack,
        stopScreenShare,
        startScreenShare,
    };
}
