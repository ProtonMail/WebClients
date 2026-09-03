import { useEffect, useRef, useState } from 'react';

import { isAndroid, isIos, isMobile, isSafari } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { useStableCallback } from '../../hooks/useStableCallback';
import { BackgroundEffectInitializingOverlay } from '../BackgroundEffectInitializingOverlay/BackgroundEffectInitializingOverlay';

import './VideoPreview.scss';

interface VideoPreviewProps {
    selectedCameraId: string;
    facingMode: 'environment' | 'user';
}

export const VideoPreview = ({ selectedCameraId, facingMode }: VideoPreviewProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isVideoVertical, setIsVideoVertical] = useState(false);

    const { handlePreviewCameraToggle, cleanupPreviewTrack } = useMediaManagementContext();

    const stableHandlePreviewCameraToggle = useStableCallback(handlePreviewCameraToggle);
    useEffect(() => {
        if (videoRef.current) {
            void stableHandlePreviewCameraToggle(videoRef.current);
        }
    }, [selectedCameraId, facingMode, stableHandlePreviewCameraToggle]);

    // Mobile publishes the processed preview at a resolution that disagrees with the
    // track settings, so `cover` squashes it once an effect is on. Letterbox those
    // instead, going by the element's intrinsic size rather than the track's.
    useEffect(() => {
        const videoEl = videoRef.current;
        if (!videoEl || !(isIos() || isAndroid())) {
            return;
        }

        const updateOrientation = () => {
            const { videoWidth, videoHeight } = videoEl;

            if (videoWidth && videoHeight) {
                setIsVideoVertical(videoWidth < videoHeight);
            }
        };

        updateOrientation();
        videoEl.addEventListener('loadedmetadata', updateOrientation);
        videoEl.addEventListener('resize', updateOrientation);
        return () => {
            videoEl.removeEventListener('loadedmetadata', updateOrientation);
            videoEl.removeEventListener('resize', updateOrientation);
        };
    }, [selectedCameraId, facingMode]);

    useEffect(() => {
        return () => {
            void cleanupPreviewTrack();
        };
        // Setting up cleanup for unmount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            <div className="video-preview h-full w-full relative overflow-hidden">
                <div
                    className="gradient-overlay absolute top-0 left-0 w-full h-full z-custom"
                    style={{ '--z-custom': '2' }}
                />
                {/* This is just a video preview of the user's camera, so we don't need a caption */}
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                    className={clsx(
                        'video-preview__video absolute h-full w-full lg:w-full',
                        isVideoVertical && 'vertical-video'
                    )}
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{
                        background: '#000',
                        transform:
                            (isSafari() || facingMode === 'environment') && isMobile() ? undefined : 'scaleX(-1)',
                    }}
                />
                <BackgroundEffectInitializingOverlay />
            </div>
        </>
    );
};
