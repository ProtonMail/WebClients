export declare const WEBGL_SHADER_BG_MAX_BLOBS: 8;

export interface WebglShaderBgMouseConfig {
    enabled?: boolean;
    radius?: number;
    weight?: number;
    color?: [number, number, number];
    mixStrength?: number;
}

export interface WebglShaderBgBlobConfig {
    /** Required when `xOffsetFromCenter` is omitted. */
    x: number;
    y: number;
    /** Horizontal offset from the gravity center (aspect-corrected UV); overrides `x` when set. */
    xOffsetFromCenter?: number;
    radius: number;
    radiusX?: number;
    radiusY?: number;
    corner?: 'left-bottom' | 'right-bottom';
    weight?: number;
    color: [number, number, number];
    mixStrength?: number;
    driftY?: number;
    driftX?: number;
    /** Radial in/out motion toward viewport center (UV amplitude). */
    driftToCenter?: number;
    /** Full in/out cycle toward center in seconds. */
    driftToCenterPeriodSec?: number;
    /** Phase offset in seconds within the center-drift cycle. */
    driftToCenterPhaseSec?: number;
    /** Independent wander cycle in seconds. */
    floatPeriodSec?: number;
    /** Phase offset in seconds for the wander cycle. */
    floatPhaseSec?: number;
    /** Ellipse shape-morph cycle in seconds. */
    radiusMorphPeriodSec?: number;
    /** Phase offset in seconds for ellipse shape morph. */
    radiusMorphPhaseSec?: number;
    /** Full fade-in/fade-out cycle length in seconds (sinusoidal 0–1 opacity). Omit for always visible. */
    pulsePeriodSec?: number;
    /** Time offset in seconds within the pulse cycle (e.g. half the period for opposite phase). */
    pulsePhaseSec?: number;
    /**
     * Breathe cycle: radius eases from full size down to `radiusPulseMinScale`, then back.
     * Opacity follows the same curve (full at max size, dimmest at min). Omit for fixed size.
     */
    radiusPulsePeriodSec?: number;
    /** Phase offset in seconds for the radius breathe cycle. */
    radiusPulsePhaseSec?: number;
    /** Smallest radius as a fraction of the configured `radius` (default 0.6). */
    radiusPulseMinScale?: number;
}

export interface WebglShaderBgConfig {
    baseColor?: [number, number, number];
    speed?: number;
    glowPower?: number;
    glowIntensity?: number;
    waveAmp?: number;
    waveFreqX?: number;
    waveFreqY?: number;
    waveSpeedX?: number;
    waveSpeedY?: number;
    mouse?: WebglShaderBgMouseConfig;
    blobs?: WebglShaderBgBlobConfig[];
    /** Vertical anchor for center gravity (UV 0–1, default 0.5). */
    centerY?: number;
    /** Horizontal anchor in aspect-corrected UV; defaults to viewport center + sidebar offset. */
    centerX?: number;
    /** Lumo sidebar width in px — shifts the gravity center into the main content area. */
    sidebarOffsetPx?: number;
}

import type { GridParticleFieldOptions } from './gridParticleField';

export type WebglShaderBgMount = 'viewport' | 'content';

export interface WebglShaderBgRuntime {
    mount?: WebglShaderBgMount;
    baseCssVar?: string | null;
    /** Cap device pixel ratio for the shader canvas (default: uncapped). */
    maxDpr?: number;
    /** Throttle animation updates (default: 60). */
    targetFps?: number;
    /** Dot-grid reveal pass rendered after blobs on the same canvas. */
    particleOptions?: Partial<GridParticleFieldOptions>;
    /** Optional hook after each rendered frame (time in milliseconds). */
    onAfterRender?: (timeMs: number) => void;
}

export interface WebglShaderBgInstance {
    destroy: () => void;
    capturePng: () => Promise<Blob | null>;
}

export declare function createWebglShaderBackground(
    canvas: HTMLCanvasElement,
    userConfig?: WebglShaderBgConfig,
    runtime?: WebglShaderBgRuntime
): WebglShaderBgInstance;
