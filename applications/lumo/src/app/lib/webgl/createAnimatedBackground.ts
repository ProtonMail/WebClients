import {
    ANIMATED_BACKGROUND_BASE_CSS_VAR,
    ANIMATED_BACKGROUND_MAX_DPR,
    ANIMATED_BACKGROUND_SAMPLE_REFRESH_INTERVAL_MS,
    ANIMATED_BACKGROUND_TARGET_FPS,
    type AnimatedBackgroundBlobMode,
    DEFAULT_ANIMATED_BACKGROUND_BLOB_MODE,
    getAnimatedBackgroundParticleConfig,
    getAnimatedBackgroundShaderConfig,
} from './animatedBackgroundConfig';
import { createWebglShaderBackground } from './webglShaderBackground';

export interface AnimatedBackgroundInstance {
    destroy: () => void;
}

export interface CreateAnimatedBackgroundOptions {
    blobMode?: AnimatedBackgroundBlobMode;
}

/** Creates the combined blob + particle WebGL background on a single canvas. */
export function createAnimatedBackground(
    canvas: HTMLCanvasElement,
    isDark: boolean,
    options: CreateAnimatedBackgroundOptions = {}
): AnimatedBackgroundInstance {
    const { blobMode = DEFAULT_ANIMATED_BACKGROUND_BLOB_MODE } = options;
    const shader = createWebglShaderBackground(canvas, getAnimatedBackgroundShaderConfig(isDark, blobMode), {
        mount: 'content',
        baseCssVar: ANIMATED_BACKGROUND_BASE_CSS_VAR,
        maxDpr: ANIMATED_BACKGROUND_MAX_DPR,
        targetFps: ANIMATED_BACKGROUND_TARGET_FPS,
        sampleRefreshIntervalMs: ANIMATED_BACKGROUND_SAMPLE_REFRESH_INTERVAL_MS,
        particleOptions: getAnimatedBackgroundParticleConfig(isDark, blobMode),
    });

    return {
        destroy: () => {
            shader.destroy();
        },
    };
}
