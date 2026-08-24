import { useEffect, useRef, useState } from 'react';

import { VideoTrack, useLocalParticipant, useParticipantTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectCameraPermission } from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { isMobile, isSafari } from '@proton/shared/lib/helpers/browser';

import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { useStableCallback } from '../../hooks/useStableCallback';
import { BackgroundEffectInitializingOverlay } from '../BackgroundEffectInitializingOverlay/BackgroundEffectInitializingOverlay';

const useIsMirrored = () => {
    const { facingMode } = useMediaManagementContext();

    return !(isSafari() && isMobile()) && facingMode === 'user';
};

const PublishedCameraPreview = () => {
    const { localParticipant } = useLocalParticipant();
    const cameraTrackRef = useParticipantTracks([Track.Source.Camera], localParticipant.identity)[0];
    const isMirrored = useIsMirrored();

    if (!cameraTrackRef) {
        return null;
    }

    return (
        <VideoTrack
            className="absolute inset-0 w-full h-full object-cover meet-radius"
            trackRef={cameraTrackRef}
            manageSubscription={false}
            muted={true}
            autoPlay={true}
            playsInline={true}
            style={{ transform: isMirrored ? 'scaleX(-1)' : undefined }}
        />
    );
};

const StandaloneCameraPreview = ({ selectedCameraId }: { selectedCameraId: string }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isStarting, setIsStarting] = useState(true);
    const [hasFailed, setHasFailed] = useState(false);

    const { handlePreviewCameraToggle, cleanupPreviewTrack, cleanupCameraPreview, facingMode } =
        useMediaManagementContext();
    const isMirrored = useIsMirrored();

    const startPreview = useStableCallback(handlePreviewCameraToggle);
    const stopPreview = useStableCallback(cleanupPreviewTrack);
    const releasePreview = useStableCallback(cleanupCameraPreview);

    useEffect(() => {
        const videoElement = videoRef.current;

        if (!videoElement) {
            return;
        }

        let isCurrent = true;

        setIsStarting(true);
        setHasFailed(false);

        void (async () => {
            const hasStarted = await startPreview(videoElement);

            if (!isCurrent) {
                return;
            }

            setIsStarting(false);
            setHasFailed(!hasStarted);
        })();

        return () => {
            isCurrent = false;
            void stopPreview();
        };
    }, [selectedCameraId, facingMode, startPreview, stopPreview]);

    useEffect(() => {
        return () => {
            void releasePreview();
        };
    }, [releasePreview]);

    return (
        <>
            <video
                className="absolute inset-0 w-full h-full object-cover meet-radius"
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ transform: isMirrored ? 'scaleX(-1)' : undefined }}
            />

            {isStarting && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <CircleLoader className="color-primary" />
                </div>
            )}

            {hasFailed && (
                <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
                    <span className="text-sm color-weak">{c('Info').t`Preview unavailable`}</span>
                </div>
            )}
        </>
    );
};

interface BackgroundPreviewProps {
    selectedCameraId: string;
}

export const BackgroundPreview = ({ selectedCameraId }: BackgroundPreviewProps) => {
    const { isVideoEnabled } = useMediaManagementContext();
    const cameraPermission = useMeetSelector(selectCameraPermission);

    if (cameraPermission !== 'granted') {
        return (
            <div className="relative w-full ratio-16/9 bg-norm meet-radius overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
                    <span className="text-sm color-norm max-w-custom" style={{ maxWidth: '12rem' }}>{c('Info')
                        .t`Allow camera access to preview your background`}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full ratio-16/9 bg-norm meet-radius overflow-hidden">
            {isVideoEnabled ? (
                <PublishedCameraPreview />
            ) : (
                <StandaloneCameraPreview selectedCameraId={selectedCameraId} />
            )}

            <div className="gradient-overlay absolute inset-0" />

            <BackgroundEffectInitializingOverlay viewSize="small" />
        </div>
    );
};
