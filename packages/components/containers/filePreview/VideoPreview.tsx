import { useState, useEffect, useRef } from 'react';

import useElementRect from '../../hooks/useElementRect';
import UnsupportedPreview from './UnsupportedPreview';

interface Props {
    mimeType: string;
    contents?: Uint8Array[];
    onSave?: () => void;
}

const VideoPreview = ({ contents, mimeType, onSave }: Props) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const containerBounds = useElementRect(containerRef);
    const [url, setUrl] = useState<string>();
    const [scale, setScale] = useState(1);
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

    const fitToContainer = () => {
        if (!videoRef.current || !containerBounds) {
            return;
        }

        const heightRatio = containerBounds.height / videoRef.current.videoHeight;
        const widthRatio = containerBounds.width / videoRef.current.videoWidth;
        const scale = Math.min(1, heightRatio, widthRatio);
        setScale(scale);
    };

    const handleBrokenVideo = () => {
        setError(true);
    };

    const scaledDimensions = !videoRef.current?.videoHeight
        ? {}
        : {
              height: videoRef.current.videoHeight * scale,
              width: videoRef.current.videoWidth * scale,
          };

    if (error) {
        return (
            <div className="flex flex-item-fluid-auto relative">
                <UnsupportedPreview onSave={onSave} type="video" />
            </div>
        );
    }
    return (
        <div ref={containerRef} className="flex w100 h100">
            <div className="mauto">
                {/* eslint-disable-next-line */}
                <video
                    ref={videoRef}
                    onLoadedMetadata={fitToContainer}
                    onError={handleBrokenVideo}
                    src={url}
                    style={scaledDimensions}
                    controls
                />
            </div>
        </div>
    );
};

export default VideoPreview;
