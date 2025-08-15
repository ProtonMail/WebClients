import { useEffect, useRef, useState } from 'react';

import { CircleLoader } from '@proton/atoms';

import { useVideoAutoPlay } from '../../hooks/useVideoAutoPlay';
import UnsupportedPreview from './UnsupportedPreview';

interface Props {
    mimeType: string;
    contents?: Uint8Array<ArrayBuffer>[];
    onDownload?: () => void;
    isSharedFile?: boolean;
}

const VideoPreview = ({ contents, mimeType, onDownload, isSharedFile }: Props) => {
    const [url, setUrl] = useState<string>();
    const [error, setError] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const videoAutoPlay = useVideoAutoPlay();

    useEffect(() => {
        const newUrl = URL.createObjectURL(new Blob(contents, { type: mimeType }));
        setUrl(newUrl);
        return () => {
            if (newUrl) {
                URL.revokeObjectURL(newUrl);
            }
        };
    }, [contents]);

    const handleBrokenVideo = () => {
        setError(true);
    };

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
            {url ? (
                <video
                    ref={videoAutoPlay?.videoRef || videoRef}
                    onError={handleBrokenVideo}
                    onCanPlay={videoAutoPlay?.handleCanPlay}
                    src={url}
                    className="max-w-full max-h-full object-contain"
                    controls
                    muted={videoAutoPlay?.muted}
                />
            ) : (
                <CircleLoader />
            )}
        </div>
    );
};

export default VideoPreview;
