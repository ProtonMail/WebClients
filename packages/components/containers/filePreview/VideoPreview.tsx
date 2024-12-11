import { useEffect, useRef, useState } from 'react';

import { CircleLoader } from '@proton/atoms';

import UnsupportedPreview from './UnsupportedPreview';

interface Props {
    mimeType: string;
    contents?: Uint8Array[];
    onDownload?: () => void;
    isSharedFile?: boolean;
}

const VideoPreview = ({ contents, mimeType, onDownload, isSharedFile }: Props) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    const [url, setUrl] = useState<string>();
    const [error, setError] = useState(false);

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
            {/* eslint-disable-next-line */}
            {url ? (
                <video
                    ref={videoRef}
                    onError={handleBrokenVideo}
                    src={url}
                    className="max-w-full max-h-full object-contain"
                    controls
                />
            ) : (
                <CircleLoader />
            )}
        </div>
    );
};

export default VideoPreview;
