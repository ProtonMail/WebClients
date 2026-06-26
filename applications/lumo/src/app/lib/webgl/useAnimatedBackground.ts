import { useEffect, useRef } from 'react';

import { ThemeTypes, useLumoTheme } from '../../providers';
import type { AnimatedBackgroundBlobMode } from './animatedBackgroundConfig';
import { createAnimatedBackground } from './createAnimatedBackground';

export {
    ANIMATED_BACKGROUND_MAX_DPR,
    ANIMATED_BACKGROUND_TARGET_FPS,
} from './animatedBackgroundConfig';
export type { AnimatedBackgroundBlobMode } from './animatedBackgroundConfig';

interface UseAnimatedBackgroundOptions {
    blobMode: AnimatedBackgroundBlobMode;
}

export function useAnimatedBackground({ blobMode }: UseAnimatedBackgroundOptions) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { theme } = useLumoTheme();
    const isDark = theme === ThemeTypes.LumoDark;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        return createAnimatedBackground(canvas, isDark, { blobMode }).destroy;
    }, [isDark, blobMode]);

    return { canvasRef };
}
