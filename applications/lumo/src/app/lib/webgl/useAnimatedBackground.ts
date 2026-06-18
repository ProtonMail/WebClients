import { useEffect, useRef } from 'react';

import { ThemeTypes, useLumoTheme } from '../../providers';
import { createAnimatedBackground } from './createAnimatedBackground';

export {
    ANIMATED_BACKGROUND_MAX_DPR,
    ANIMATED_BACKGROUND_TARGET_FPS,
} from './animatedBackgroundConfig';

export function useAnimatedBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { theme } = useLumoTheme();
    const isDark = theme === ThemeTypes.LumoDark;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        return createAnimatedBackground(canvas, isDark).destroy;
    }, [isDark]);

    return { canvasRef };
}
