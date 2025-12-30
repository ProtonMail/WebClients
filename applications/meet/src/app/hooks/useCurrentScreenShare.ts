import { useEffect } from 'react';

import { useLocalParticipant, useRoomContext, useTracks } from '@livekit/components-react';
import type { RemoteTrackPublication } from 'livekit-client';
import { Track } from 'livekit-client';
import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { isMobile, isSafari, isWindows } from '@proton/shared/lib/helpers/browser';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';

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
                    audio: !(isElectronApp && isWindows()),
                    systemAudio: isElectronApp && isWindows() ? undefined : 'include',
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

            if (
                err.message === 'Permission denied by user' ||
                (err.message === 'Could not start video source' && isElectronApp)
            ) {
                return;
            }

            if (err.message === 'The object can not be found here.') {
                notifications.createNotification({
                    type: 'error',
                    text: c('Error').t`Please allow screen sharing in your system permissions, then try again`,
                });
            } else {
                notifications.createNotification({
                    type: 'error',
                    text: c('Error').t`Failed to start screen share`,
                });
            }
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

    useEffect(() => {
        // Subscribe to all existing screen shares when joining
        for (const participant of room.remoteParticipants.values()) {
            for (const publication of participant.trackPublications.values()) {
                if (publication.source === Track.Source.ScreenShare) {
                    publication.setSubscribed(true);
                    publication.setEnabled(true);
                }
            }
        }

        // Subscribe to new screen shares as they're published
        const handleTrackPublished = (publication: RemoteTrackPublication) => {
            if (publication.source === Track.Source.ScreenShare) {
                publication.setSubscribed(true);
                publication.setEnabled(true);
            }
        };

        room.on('trackPublished', handleTrackPublished);

        return () => {
            room.off('trackPublished', handleTrackPublished);
        };
    }, []);

    return {
        isLocalScreenShare,
        isScreenShare: !!screenShareTrack,
        screenShareParticipant: screenShareParticipant,
        screenShareTrack,
        stopScreenShare,
        startScreenShare,
    };
}
