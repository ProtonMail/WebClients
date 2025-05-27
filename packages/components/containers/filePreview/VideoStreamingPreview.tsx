import { useCallback, useRef, useState } from 'react';

import { CircleLoader } from '@proton/atoms';

import UnsupportedPreview from './UnsupportedPreview';

import './VideoStreamingPreview.scss';

type VideoStreamingPreviewProps = {
    isLoading: boolean;
    videoStreaming: {
        url: string;
        onVideoPlaybackError?: (error?: unknown) => void;
    };
    imgThumbnailUrl?: string;
    onDownload?: () => void;
    isSharedFile?: boolean;
};

export const VideoStreamingPreview: React.FC<VideoStreamingPreviewProps> = ({
    onDownload,
    isSharedFile,
    imgThumbnailUrl,
    videoStreaming,
    isLoading,
}: VideoStreamingPreviewProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState(false);

    const handleBrokenVideo = useCallback((error?: unknown) => {
        setError(true);
        videoStreaming.onVideoPlaybackError?.(error);
    }, []);

    if (error) {
        return (
            <div className="flex flex-auto relative">
                <UnsupportedPreview onDownload={onDownload} type="video" />
            </div>
        );
    }

    return (
        <div
            className={`flex w-full h-full justify-center items-center flex-1 overflow-auto ${isSharedFile ? 'pb-8 md:pb-12' : ''}`}
        >
            {/* eslint-disable-next-line */}
            {!isLoading ? (
                <div className="w-full h-full p-8 flex justify-center items-center">
                    <video
                        poster={imgThumbnailUrl}
                        ref={videoRef}
                        onError={handleBrokenVideo}
                        src={videoStreaming.url}
                        className="w-full h-full object-contain drive-video-player"
                        controls
                    />
                </div>
            ) : (
                <CircleLoader />
            )}
        </div>
    );
};

export default VideoStreamingPreview;
