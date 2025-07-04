import { type SyntheticEvent, useCallback, useRef } from 'react';

import { CircleLoader } from '@proton/atoms';

import './VideoStreamingPreview.scss';

type VideoStreamingPreviewProps = {
    isLoading: boolean;
    videoStreaming: {
        url: string;
        onVideoPlaybackError?: (error?: SyntheticEvent<HTMLVideoElement, Event>) => void;
    };
    imgThumbnailUrl?: string;
    isSharedFile?: boolean;
};

export const VideoStreamingPreview: React.FC<VideoStreamingPreviewProps> = ({
    isSharedFile,
    imgThumbnailUrl,
    videoStreaming,
    isLoading,
}: VideoStreamingPreviewProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleBrokenVideo = useCallback(
        (event: SyntheticEvent<HTMLVideoElement, Event>) => {
            videoStreaming.onVideoPlaybackError?.(event);
        },
        [videoStreaming]
    );

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
