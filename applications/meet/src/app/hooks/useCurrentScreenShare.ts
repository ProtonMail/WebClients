import { useEffect } from 'react';

import { useRoomContext, useTracks } from '@livekit/components-react';
import type { RemoteTrackPublication } from 'livekit-client';
import { Track } from 'livekit-client';
import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import { PermissionsModalType, showPermissionsModal } from '@proton/meet/store/slices/deviceManagementSlice';
import { setParticipantScreenShare } from '@proton/meet/store/slices/screenShareStatusSlice';
import { isChrome, isMobile, isSafari, isWindows } from '@proton/shared/lib/helpers/browser';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';

import { screenShareQuality } from '../qualityConstants';
import { useStableCallback } from './useStableCallback';

export function useCurrentScreenShare({
    stopPiP,
    startPiP,
    preparePictureInPicture,
}: {
    stopPiP: () => void;
    startPiP: () => void;
    preparePictureInPicture: () => void;
}) {
    const dispatch = useMeetDispatch();
    const { reportMeetError } = useMeetErrorReporting();

    const notifications = useNotifications();

    const screenShareTrack = useTracks([Track.Source.ScreenShare])[0];

    const screenShareParticipant = screenShareTrack?.participant;

    const room = useRoomContext();

    const stopScreenShare = useStableCallback(() => {
        stopPiP();
        void room.localParticipant.setScreenShareEnabled(false);
    });

    useEffect(() => {
        dispatch(setParticipantScreenShare(screenShareTrack?.participant?.identity));
    }, [screenShareTrack?.participant?.identity]);

    const startScreenShare = useStableCallback(async () => {
        const start = performance.now();
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
                    selfBrowserSurface: 'exclude',
                    contentHint: 'detail',
                    resolution: {
                        width: screenShareQuality.resolution.width,
                        height: screenShareQuality.resolution.height,
                        frameRate: screenShareQuality.encoding.maxFramerate,
                    },
                },
                { simulcast: false, degradationPreference: 'maintain-resolution' }
            );

            if (!isSafari()) {
                startPiP();
            }
        } catch (err: any) {
            const end = performance.now();
            const arePermissionsBlocked = end - start < 300;

            stopPiP();

            if (
                err.message === 'Permission denied by user' ||
                err.message ===
                    'The request is not allowed by the user agent or the platform in the current context.' ||
                (err.message === 'Could not start video source' && isElectronApp)
            ) {
                if (arePermissionsBlocked && !isChrome() && !isElectronApp) {
                    dispatch(
                        showPermissionsModal({ modal: PermissionsModalType.PERMISSIONS_BLOCKED_SCREEN_SHARE_MODAL })
                    );
                }
                return;
            }

            if (
                err.message === 'The object can not be found here.' ||
                err.message ===
                    'The request is not allowed by the user agent or the platform in the current context, possibly because the user denied permission.'
            ) {
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

            reportMeetError(`useCurrentScreenShare.startScreenShare: ${err.message}`, err);
        }
    });

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
                if (publication.kind === Track.Kind.Video && publication.source === Track.Source.ScreenShare) {
                    publication.setSubscribed(true);
                    publication.setEnabled(true);
                }
            }
        }

        // Subscribe to new screen shares as they're published
        const handleTrackPublished = (publication: RemoteTrackPublication) => {
            if (publication.kind === Track.Kind.Video && publication.source === Track.Source.ScreenShare) {
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
        screenShareParticipant: screenShareParticipant,
        screenShareTrack,
        stopScreenShare,
        startScreenShare,
    };
}
