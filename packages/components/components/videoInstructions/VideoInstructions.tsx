import { useState, useRef } from 'react';
import { c } from 'ttag';
import { classnames } from '../../helpers';

import { Icon } from '../icon';

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
        <div className="text-center mb1 relative">
            <video
                preload="auto"
                playsInline
                ref={videoRef}
                className="max-w100 rounded"
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
                className={classnames([
                    'covered-absolute rounded w100 flex flex-align-items-center flex-justify-center',
                    'video-player-replay-button',
                    videoEnded && 'video-ended',
                ])}
                onClick={replayVideo}
            >
                <Icon name="arrow-rotate-right" size={56} color="white" alt={c('Video control').t`Replay video`} />
            </button>
        </div>
    );
};

export default VideoInstructions;
