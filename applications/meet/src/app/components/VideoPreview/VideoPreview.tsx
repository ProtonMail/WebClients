import { useEffect, useRef } from 'react';

import { isMobile, isSafari } from '@proton/shared/lib/helpers/browser';

import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';

import './VideoPreview.scss';

interface VideoPreviewProps {
    selectedCameraId: string;
    facingMode: 'environment' | 'user';
}

export const VideoPreview = ({ selectedCameraId, facingMode }: VideoPreviewProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    const { handlePreviewCameraToggle } = useMediaManagementContext();

    useEffect(() => {
        if (videoRef.current) {
            void handlePreviewCameraToggle(videoRef.current);
        }
    }, [selectedCameraId, facingMode]);

    return (
        <>
            <div className="h-full w-full relative overflow-hidden">
                <div
                    className="gradient-overlay absolute top-0 left-0 w-full h-full z-custom"
                    style={{ '--z-custom': '2' }}
                />
                {/* This is just a video preview of the user's camera, so we don't need a caption */}
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                    className="absolute h-full w-full lg:w-full"
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{
                        objectFit: 'cover',
                        background: '#000',
                        transform:
                            (isSafari() || facingMode === 'environment') && isMobile() ? undefined : 'scaleX(-1)',
                    }}
                />
            </div>
        </>
    );
};
