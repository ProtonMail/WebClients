import type { GridParticleFieldOptions } from './gridParticleField';
import type { WebglShaderBgBlobConfig, WebglShaderBgConfig } from './webglShaderBackground';

export const ANIMATED_BACKGROUND_BASE_CSS_VAR = '--background-main-canvas';

/** Matches `--background-main-canvas` in lumo-light.theme.css */
const LIGHT_BASE_COLOR: [number, number, number] = [245 / 255, 246 / 255, 254 / 255];

/** Matches `--background-main-canvas` in lumo-dark.theme.css */
const DARK_BASE_COLOR: [number, number, number] = [11 / 255, 11 / 255, 11 / 255];

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

const LIGHT_BLOBS: WebglShaderBgBlobConfig[] = [
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
];

/** Deeper, richer blob tints that read on a near-black canvas. */
const DARK_BLOBS: WebglShaderBgBlobConfig[] = [
    blob(-0.26, 0.44, [0.28, 0.38, 0.78], {
        radius: 0.34,
        radiusX: 0.38,
        radiusY: 0.26,
        weight: 0.78,
        mixStrength: 0.72,
        driftToCenterPhaseSec: 0,
        floatPhaseSec: 1,
        radiusMorphPeriodSec: 7,
        radiusMorphPhaseSec: 2,
    }),
    blob(0.1, 0.42, [0.2, 0.42, 0.82], {
        mixStrength: 0.7,
        driftToCenter: 0.1,
        driftToCenterPeriodSec: 8,
        driftToCenterPhaseSec: 2.5,
        floatPeriodSec: 11,
        floatPhaseSec: 3,
        radiusMorphPeriodSec: 10,
        radiusMorphPhaseSec: 4,
    }),
    blob(0, 0.56, [0.42, 0.32, 0.72], {
        radius: 0.36,
        radiusX: 0.4,
        radiusY: 0.28,
        weight: 0.86,
        mixStrength: 0.72,
        driftToCenter: 0.08,
        driftToCenterPhaseSec: 5,
        floatPeriodSec: 12,
        floatPhaseSec: 2,
        radiusPulseMinScale: 0.9,
        radiusMorphPeriodSec: 11,
        radiusMorphPhaseSec: 1,
    }),
    blob(0.22, 0.48, [0.72, 0.28, 0.58], {
        weight: 0.8,
        mixStrength: 0.68,
        driftToCenterPhaseSec: 8,
        floatPeriodSec: 10.5,
        floatPhaseSec: 5,
        radiusPulsePeriodSec: 10,
        radiusPulsePhaseSec: 2,
        radiusMorphPeriodSec: 8,
        radiusMorphPhaseSec: 6,
    }),
    blob(0.14, 0.54, [0.82, 0.42, 0.28], {
        radius: 0.3,
        radiusX: 0.34,
        radiusY: 0.22,
        weight: 0.76,
        mixStrength: 0.66,
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
];

export const ANIMATED_BACKGROUND_SHADER_CONFIG_LIGHT: WebglShaderBgConfig = {
    baseColor: LIGHT_BASE_COLOR,
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
    blobs: LIGHT_BLOBS,
};

export const ANIMATED_BACKGROUND_SHADER_CONFIG_DARK: WebglShaderBgConfig = {
    baseColor: DARK_BASE_COLOR,
    speed: 0.82,
    glowPower: 3.1,
    glowIntensity: 0.62,
    waveAmp: 0.012,
    waveFreqX: 2,
    waveFreqY: 2.5,
    waveSpeedX: 0.24,
    waveSpeedY: 0.2,
    centerY: 0.5,
    mouse: { enabled: false },
    blobs: DARK_BLOBS,
};

/** @deprecated Use {@link getAnimatedBackgroundShaderConfig} */
export const ANIMATED_BACKGROUND_SHADER_CONFIG = ANIMATED_BACKGROUND_SHADER_CONFIG_LIGHT;

export function getAnimatedBackgroundShaderConfig(isDark: boolean): WebglShaderBgConfig {
    return isDark ? ANIMATED_BACKGROUND_SHADER_CONFIG_DARK : ANIMATED_BACKGROUND_SHADER_CONFIG_LIGHT;
}

const PARTICLE_CONFIG_SHARED: Partial<GridParticleFieldOptions> = {
    spacing: 14,
    size: 1.65,
    interactionRadius: 80,
    mouseBrighten: 0.38,
    baseColorCssVar: ANIMATED_BACKGROUND_BASE_CSS_VAR,
    breatheSpeedMin: 0.12,
    breatheSpeedMax: 0.26,
    breatheOpacityMin: 0.03,
    breatheOpacityMax: 0.58,
    revealGain: 5.5,
    revealThreshold: 0.012,
};

export const ANIMATED_BACKGROUND_PARTICLE_CONFIG_LIGHT: Partial<GridParticleFieldOptions> = {
    ...PARTICLE_CONFIG_SHARED,
    alpha: 0.72,
};

export const ANIMATED_BACKGROUND_PARTICLE_CONFIG_DARK: Partial<GridParticleFieldOptions> = {
    ...PARTICLE_CONFIG_SHARED,
    alpha: 0.78,
};

/** @deprecated Use {@link getAnimatedBackgroundParticleConfig} */
export const ANIMATED_BACKGROUND_PARTICLE_CONFIG = ANIMATED_BACKGROUND_PARTICLE_CONFIG_LIGHT;

export function getAnimatedBackgroundParticleConfig(isDark: boolean): Partial<GridParticleFieldOptions> {
    return isDark ? ANIMATED_BACKGROUND_PARTICLE_CONFIG_DARK : ANIMATED_BACKGROUND_PARTICLE_CONFIG_LIGHT;
}
