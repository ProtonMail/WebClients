import type { GridParticleFieldOptions } from './gridParticleField';
import type { WebglShaderBgBlobConfig, WebglShaderBgConfig } from './webglShaderBackground';

export type AnimatedBackgroundBlobMode = 'ambient' | 'lavaLamp';

export const DEFAULT_ANIMATED_BACKGROUND_BLOB_MODE: AnimatedBackgroundBlobMode = 'ambient';

export const ANIMATED_BACKGROUND_BASE_CSS_VAR = '--background-main-canvas';

/** Matches `--background-main-canvas` in lumo-light.theme.css */
const LIGHT_BASE_COLOR: [number, number, number] = [245 / 255, 246 / 255, 254 / 255];

/** Matches `--background-main-canvas` in lumo-dark.theme.css */
const DARK_BASE_COLOR: [number, number, number] = [11 / 255, 11 / 255, 11 / 255];

/** Cap device pixel ratio for background canvases (shader + particles). */
export const ANIMATED_BACKGROUND_MAX_DPR = 1.1;

/** Ambient animation target; slow blob motion reads fine below 60fps. */
export const ANIMATED_BACKGROUND_TARGET_FPS = 24;

/** Particle sample-texture refresh cadence. Blobs drift slowly, so a few Hz reads as identical. */
export const ANIMATED_BACKGROUND_SAMPLE_REFRESH_HZ = 8;
export const ANIMATED_BACKGROUND_SAMPLE_REFRESH_INTERVAL_MS = 1000 / ANIMATED_BACKGROUND_SAMPLE_REFRESH_HZ;

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

/** Blend an accent colour toward the canvas base so tints stay soft. */
function tintTowardBase(
    base: [number, number, number],
    accent: [number, number, number],
    strength = 0.38
): [number, number, number] {
    return [
        base[0] + (accent[0] - base[0]) * strength,
        base[1] + (accent[1] - base[1]) * strength,
        base[2] + (accent[2] - base[2]) * strength,
    ];
}

function lavaLampColorPair(
    base: [number, number, number],
    accentA: [number, number, number],
    accentB: [number, number, number],
    strength = 0.5
): Pick<WebglShaderBgBlobConfig, 'color' | 'colorAlt'> {
    return {
        color: tintTowardBase(base, accentA, strength),
        colorAlt: tintTowardBase(base, accentB, strength),
    };
}

/** Lava-lamp defaults: vertical buoyancy, gooey metaballs, animated colour. */
function lavaLampBlob(
    xOffsetFromCenter: number,
    y: number,
    colors: Pick<WebglShaderBgBlobConfig, 'color' | 'colorAlt'>,
    overrides: BlobOverrides = {}
): WebglShaderBgBlobConfig {
    return blob(xOffsetFromCenter, y, colors.color, {
        radius: 0.24,
        radiusX: 0.27,
        radiusY: 0.22,
        weight: 0.34,
        mixStrength: 0.52,
        driftX: 0.03,
        driftY: 0.1,
        driftToCenter: 0,
        floatPeriodSec: 20,
        radiusMorphPeriodSec: 16,
        radiusPulseMinScale: 0.84,
        colorAlt: colors.colorAlt,
        colorShiftPeriodSec: 14,
        ...overrides,
    });
}

/** Vertical column + merge pair — clearly unlike the ambient centre cluster. */
const LAVA_LAMP_LIGHT_BLOBS: WebglShaderBgBlobConfig[] = [
    lavaLampBlob(-0.14, 0.8, lavaLampColorPair(LIGHT_BASE_COLOR, [0.48, 0.68, 0.98], [0.72, 0.48, 0.92]), {
        floatPeriodSec: 28,
        driftY: 0.13,
        colorShiftPeriodSec: 16,
    }),
    lavaLampBlob(-0.1, 0.52, lavaLampColorPair(LIGHT_BASE_COLOR, [0.42, 0.62, 0.96], [0.82, 0.52, 0.68]), {
        floatPeriodSec: 11,
        floatPhaseSec: 0,
        driftX: 0.1,
        colorShiftPeriodSec: 12,
        colorShiftPhaseSec: 0,
    }),
    lavaLampBlob(0.1, 0.52, lavaLampColorPair(LIGHT_BASE_COLOR, [0.58, 0.46, 0.94], [0.94, 0.58, 0.62]), {
        floatPeriodSec: 11,
        floatPhaseSec: 5.5,
        driftX: 0.1,
        colorShiftPeriodSec: 12,
        colorShiftPhaseSec: 3,
    }),
    lavaLampBlob(0.12, 0.24, lavaLampColorPair(LIGHT_BASE_COLOR, [0.88, 0.56, 0.62], [0.62, 0.76, 0.88]), {
        floatPeriodSec: 24,
        floatPhaseSec: 4,
        driftY: 0.12,
        colorShiftPeriodSec: 18,
        radiusPulsePeriodSec: 20,
        radiusPulseMinScale: 0.58,
    }),
];

const LAVA_LAMP_DARK_BLOBS: WebglShaderBgBlobConfig[] = [
    lavaLampBlob(-0.14, 0.8, lavaLampColorPair(DARK_BASE_COLOR, [0.22, 0.34, 0.76], [0.42, 0.26, 0.62]), {
        floatPeriodSec: 28,
        driftY: 0.13,
        colorShiftPeriodSec: 16,
    }),
    lavaLampBlob(-0.1, 0.52, lavaLampColorPair(DARK_BASE_COLOR, [0.14, 0.36, 0.78], [0.58, 0.22, 0.52]), {
        floatPeriodSec: 11,
        floatPhaseSec: 0,
        driftX: 0.1,
        colorShiftPeriodSec: 12,
        colorShiftPhaseSec: 0,
    }),
    lavaLampBlob(0.1, 0.52, lavaLampColorPair(DARK_BASE_COLOR, [0.3, 0.22, 0.66], [0.68, 0.28, 0.48]), {
        floatPeriodSec: 11,
        floatPhaseSec: 5.5,
        driftX: 0.1,
        colorShiftPeriodSec: 12,
        colorShiftPhaseSec: 3,
    }),
    lavaLampBlob(0.12, 0.24, lavaLampColorPair(DARK_BASE_COLOR, [0.68, 0.28, 0.46], [0.32, 0.48, 0.68]), {
        floatPeriodSec: 24,
        floatPhaseSec: 4,
        driftY: 0.12,
        colorShiftPeriodSec: 18,
        radiusPulsePeriodSec: 20,
        radiusPulseMinScale: 0.58,
    }),
];

const LAVA_LAMP_SHADER_SHARED: Omit<WebglShaderBgConfig, 'baseColor' | 'blobs'> = {
    speed: 0.36,
    glowPower: 2.8,
    glowIntensity: 0.44,
    waveAmp: 0.002,
    waveFreqX: 1,
    waveFreqY: 1.2,
    waveSpeedX: 0.08,
    waveSpeedY: 0.06,
    centerY: 0.5,
    mouse: { enabled: false },
    blobBlendMode: 'metaball',
    metaThreshold: 0.36,
    metaSoftness: 0.19,
};

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
    blobBlendMode: 'soft',
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
    blobBlendMode: 'soft',
    blobs: DARK_BLOBS,
};

export const ANIMATED_BACKGROUND_SHADER_CONFIG_LAVA_LAMP_LIGHT: WebglShaderBgConfig = {
    ...LAVA_LAMP_SHADER_SHARED,
    baseColor: LIGHT_BASE_COLOR,
    blobs: LAVA_LAMP_LIGHT_BLOBS,
};

export const ANIMATED_BACKGROUND_SHADER_CONFIG_LAVA_LAMP_DARK: WebglShaderBgConfig = {
    ...LAVA_LAMP_SHADER_SHARED,
    baseColor: DARK_BASE_COLOR,
    blobs: LAVA_LAMP_DARK_BLOBS,
};

/** @deprecated Use {@link getAnimatedBackgroundShaderConfig} */
export const ANIMATED_BACKGROUND_SHADER_CONFIG = ANIMATED_BACKGROUND_SHADER_CONFIG_LIGHT;

export function getAnimatedBackgroundShaderConfig(
    isDark: boolean,
    mode: AnimatedBackgroundBlobMode = DEFAULT_ANIMATED_BACKGROUND_BLOB_MODE
): WebglShaderBgConfig {
    if (mode === 'lavaLamp') {
        return isDark
            ? ANIMATED_BACKGROUND_SHADER_CONFIG_LAVA_LAMP_DARK
            : ANIMATED_BACKGROUND_SHADER_CONFIG_LAVA_LAMP_LIGHT;
    }
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

export function getAnimatedBackgroundParticleConfig(
    isDark: boolean,
    mode: AnimatedBackgroundBlobMode = DEFAULT_ANIMATED_BACKGROUND_BLOB_MODE
): Partial<GridParticleFieldOptions> {
    const base = isDark ? ANIMATED_BACKGROUND_PARTICLE_CONFIG_DARK : ANIMATED_BACKGROUND_PARTICLE_CONFIG_LIGHT;
    if (mode === 'lavaLamp') {
        return {
            ...base,
            alpha: (base.alpha ?? 0.72) * 0.6,
            breatheOpacityMax: 0.42,
        };
    }
    return base;
}
