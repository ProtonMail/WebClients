import {
    ANIMATED_BACKGROUND_BASE_CSS_VAR,
    ANIMATED_BACKGROUND_MAX_DPR,
    ANIMATED_BACKGROUND_TARGET_FPS,
    getAnimatedBackgroundParticleConfig,
    getAnimatedBackgroundShaderConfig,
} from './animatedBackgroundConfig';
import { createWebglShaderBackground } from './webglShaderBackground';

export interface AnimatedBackgroundInstance {
    destroy: () => void;
}

/** Creates the combined blob + particle WebGL background on a single canvas. */
export function createAnimatedBackground(canvas: HTMLCanvasElement, isDark: boolean): AnimatedBackgroundInstance {
    const shader = createWebglShaderBackground(canvas, getAnimatedBackgroundShaderConfig(isDark), {
        mount: 'content',
        baseCssVar: ANIMATED_BACKGROUND_BASE_CSS_VAR,
        maxDpr: ANIMATED_BACKGROUND_MAX_DPR,
        targetFps: ANIMATED_BACKGROUND_TARGET_FPS,
        particleOptions: getAnimatedBackgroundParticleConfig(isDark),
    });

    return {
        destroy: () => {
            shader.destroy();
        },
    };
}
