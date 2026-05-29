import { clsx } from 'clsx';

import { useLumoAnimatedBackground } from '../hooks/useLumoAnimatedBackground';
import { useAnimatedBackground } from '../lib/webgl/useAnimatedBackground';

import './MainLayoutAnimatedBackground.scss';

interface Props {
    hidden?: boolean;
}

/** WebGL canvases — only mounted while animations are enabled. */
const AnimatedBackgroundCanvases = ({ hidden }: Props) => {
    const { shaderCanvasRef, particleCanvasRef } = useAnimatedBackground();

    return (
        <>
            {/* eslint-disable-next-line jsx-a11y/no-aria-hidden-on-focusable */}
            <canvas
                ref={shaderCanvasRef}
                className={clsx('animated-bg-canvas animated-bg-shader', hidden && 'animated-bg-hidden-shader')}
                aria-hidden="true"
            />
            {/* eslint-disable-next-line jsx-a11y/no-aria-hidden-on-focusable */}
            <canvas
                ref={particleCanvasRef}
                className={clsx('animated-bg-canvas animated-bg-particles', hidden && 'animated-bg-hidden-particles')}
                aria-hidden="true"
            />
        </>
    );
};

export const MainLayoutAnimatedBackground = ({ hidden = false }: Props) => {
    const { isAnimatedBackgroundEnabled } = useLumoAnimatedBackground();

    if (!isAnimatedBackgroundEnabled) {
        return null;
    }

    return <AnimatedBackgroundCanvases hidden={hidden} />;
};
