import { useRef, useState } from 'react';

import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

import './VideoInstructions.scss';

export interface VideoSource {
    format: string;
    src: string;
}

const VideoInstructions = ({ children, ...rest }: React.ComponentPropsWithoutRef<'video'>) => {
    const [videoEnded, setVideoEnded] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const onEnd = () => {
        setVideoEnded(true);
    };

    const replayVideo = () => {
        setVideoEnded(false);
        videoRef.current?.play();
    };

    return (
        <div className="text-center mb-4 relative">
            <video
                preload="auto"
                playsInline
                ref={videoRef}
                className="max-w-full rounded"
                autoPlay
                muted
                onEnded={onEnd}
                {...rest}
            >
                {children}
            </video>
            <button
                title={c('Video control').t`Click to replay the video`}
                type="button"
                className={clsx([
                    'absolute inset-0 rounded w-full flex items-center justify-center',
                    'video-player-replay-button',
                    videoEnded && 'video-ended',
                ])}
                onClick={replayVideo}
            >
                <Icon name="arrow-rotate-right" size={14} color="white" alt={c('Video control').t`Replay video`} />
            </button>
        </div>
    );
};

export default VideoInstructions;
