import { clsx } from 'clsx';

import { useLumoAnimatedBackground } from '../hooks/useLumoAnimatedBackground';
import type { AnimatedBackgroundBlobMode } from '../lib/webgl/animatedBackgroundConfig';
import { useAnimatedBackground } from '../lib/webgl/useAnimatedBackground';

import './MainLayoutAnimatedBackground.scss';

interface Props {
    hidden?: boolean;
}

interface CanvasProps extends Props {
    blobMode: AnimatedBackgroundBlobMode;
}

/** WebGL background (blobs + particles) — only mounted while animations are enabled. */
const AnimatedBackgroundCanvas = ({ hidden, blobMode }: CanvasProps) => {
    const { canvasRef } = useAnimatedBackground({ blobMode });

    return (
        /* eslint-disable-next-line jsx-a11y/no-aria-hidden-on-focusable */
        <canvas
            ref={canvasRef}
            className={clsx('animated-bg-canvas animated-bg-shader', hidden && 'animated-bg-hidden-shader')}
            aria-hidden="true"
        />
    );
};

export const MainLayoutAnimatedBackground = ({ hidden = false }: Props) => {
    const { isAnimatedBackgroundEnabled, animatedBackgroundBlobMode } = useLumoAnimatedBackground();

    if (!isAnimatedBackgroundEnabled) {
        return null;
    }

    return (
        <AnimatedBackgroundCanvas
            key={animatedBackgroundBlobMode}
            hidden={hidden}
            blobMode={animatedBackgroundBlobMode}
        />
    );
};
