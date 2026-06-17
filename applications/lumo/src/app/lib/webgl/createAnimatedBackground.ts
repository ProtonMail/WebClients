import {
    ANIMATED_BACKGROUND_BASE_CSS_VAR,
    ANIMATED_BACKGROUND_MAX_DPR,
    ANIMATED_BACKGROUND_PARTICLE_CONFIG,
    ANIMATED_BACKGROUND_SHADER_CONFIG,
    ANIMATED_BACKGROUND_TARGET_FPS,
} from './animatedBackgroundConfig';
import { createWebglShaderBackground } from './webglShaderBackground';

export interface AnimatedBackgroundInstance {
    destroy: () => void;
}

/** Creates the combined blob + particle WebGL background on a single canvas. */
export function createAnimatedBackground(canvas: HTMLCanvasElement): AnimatedBackgroundInstance {
    const shader = createWebglShaderBackground(canvas, ANIMATED_BACKGROUND_SHADER_CONFIG, {
        mount: 'content',
        baseCssVar: ANIMATED_BACKGROUND_BASE_CSS_VAR,
        maxDpr: ANIMATED_BACKGROUND_MAX_DPR,
        targetFps: ANIMATED_BACKGROUND_TARGET_FPS,
        particleOptions: ANIMATED_BACKGROUND_PARTICLE_CONFIG,
    });

    return {
        destroy: () => {
            shader.destroy();
        },
    };
}
