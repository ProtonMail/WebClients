import type { GridParticleFieldOptions } from './gridParticleField';
import type { WebglShaderBgBlobConfig, WebglShaderBgConfig } from './webglShaderBackground';

export const ANIMATED_BACKGROUND_BASE_CSS_VAR = '--background-main-canvas';

/** Cap device pixel ratio for background canvases (shader + particles). */
export const ANIMATED_BACKGROUND_MAX_DPR = 1.1;

/** Ambient animation target; slow blob motion reads fine below 60fps. */
export const ANIMATED_BACKGROUND_TARGET_FPS = 24;

type BlobOverrides = Partial<Omit<WebglShaderBgBlobConfig, 'x' | 'color'>>;

/** Shared defaults for blob motion; override per blob as needed. */
function blob(
    xOffsetFromCenter: number,
    y: number,
    color: [number, number, number],
    overrides: BlobOverrides = {}
): WebglShaderBgBlobConfig {
    return {
        x: 0,
        xOffsetFromCenter,
        y,
        radius: 0.32,
        radiusX: 0.36,
        radiusY: 0.24,
        weight: 0.76,
        mixStrength: 0.64,
        driftX: 0.07,
        driftY: 0.065,
        driftToCenter: 0.09,
        driftToCenterPeriodSec: 10,
        driftToCenterPhaseSec: 0,
        floatPeriodSec: 11,
        floatPhaseSec: 0,
        radiusPulsePeriodSec: 12,
        radiusPulsePhaseSec: 0,
        radiusPulseMinScale: 0.88,
        radiusMorphPeriodSec: 9,
        radiusMorphPhaseSec: 0,
        color,
        ...overrides,
    };
}

export const ANIMATED_BACKGROUND_SHADER_CONFIG: WebglShaderBgConfig = {
    baseColor: [1, 1, 1],
    speed: 0.82,
    glowPower: 3.4,
    glowIntensity: 0.52,
    waveAmp: 0.016,
    waveFreqX: 2,
    waveFreqY: 2.5,
    waveSpeedX: 0.24,
    waveSpeedY: 0.2,
    centerY: 0.5,
    mouse: { enabled: false },
    blobs: [
        blob(-0.26, 0.44, [0.58, 0.74, 0.99], {
            radius: 0.34,
            radiusX: 0.38,
            radiusY: 0.26,
            weight: 0.72,
            driftToCenterPhaseSec: 0,
            floatPhaseSec: 1,
            radiusMorphPeriodSec: 7,
            radiusMorphPhaseSec: 2,
        }),
        blob(0.1, 0.42, [0.38, 0.68, 0.96], {
            mixStrength: 0.65,
            driftToCenter: 0.1,
            driftToCenterPeriodSec: 8,
            driftToCenterPhaseSec: 2.5,
            floatPeriodSec: 11,
            floatPhaseSec: 3,
            radiusMorphPeriodSec: 10,
            radiusMorphPhaseSec: 4,
        }),
        blob(0, 0.56, [0.58, 0.52, 0.92], {
            radius: 0.36,
            radiusX: 0.4,
            radiusY: 0.28,
            weight: 0.82,
            mixStrength: 0.66,
            driftToCenter: 0.08,
            driftToCenterPhaseSec: 5,
            floatPeriodSec: 12,
            floatPhaseSec: 2,
            radiusPulseMinScale: 0.9,
            radiusMorphPeriodSec: 11,
            radiusMorphPhaseSec: 1,
        }),
        blob(0.22, 0.48, [0.88, 0.52, 0.74], {
            weight: 0.78,
            driftToCenterPhaseSec: 8,
            floatPeriodSec: 10.5,
            floatPhaseSec: 5,
            radiusPulsePeriodSec: 10,
            radiusPulsePhaseSec: 2,
            radiusMorphPeriodSec: 8,
            radiusMorphPhaseSec: 6,
        }),
        blob(0.14, 0.54, [0.99, 0.68, 0.54], {
            radius: 0.3,
            radiusX: 0.34,
            radiusY: 0.22,
            weight: 0.74,
            mixStrength: 0.62,
            driftToCenter: 0.085,
            driftToCenterPeriodSec: 11,
            driftToCenterPhaseSec: 10,
            floatPeriodSec: 11.5,
            floatPhaseSec: 7,
            radiusPulsePeriodSec: 14,
            radiusPulsePhaseSec: 4,
            radiusMorphPeriodSec: 12,
            radiusMorphPhaseSec: 3,
        }),
    ],
};

export const ANIMATED_BACKGROUND_PARTICLE_CONFIG: Partial<GridParticleFieldOptions> = {
    spacing: 14,
    size: 1.65,
    alpha: 0.72,
    interactionRadius: 80,
    mouseBrighten: 0.38,
    baseColorCssVar: ANIMATED_BACKGROUND_BASE_CSS_VAR,
    dotRgb: { r: 255, g: 255, b: 255 },
    breatheSpeedMin: 0.12,
    breatheSpeedMax: 0.26,
    breatheOpacityMin: 0.03,
    breatheOpacityMax: 0.58,
    revealGain: 5.5,
    revealThreshold: 0.012,
};
