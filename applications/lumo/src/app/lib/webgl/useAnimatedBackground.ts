import { useEffect, useRef } from 'react';

import { createAnimatedBackground } from './createAnimatedBackground';

export {
    ANIMATED_BACKGROUND_MAX_DPR,
    ANIMATED_BACKGROUND_TARGET_FPS,
} from './animatedBackgroundConfig';

export function useAnimatedBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        return createAnimatedBackground(canvas).destroy;
    }, []);

    return { canvasRef };
}
