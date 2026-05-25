export declare const WEBGL_SHADER_BG_MAX_BLOBS: 8;

export interface WebglShaderBgMouseConfig {
    enabled?: boolean;
    radius?: number;
    weight?: number;
    color?: [number, number, number];
    mixStrength?: number;
}

export interface WebglShaderBgBlobConfig {
    x: number;
    y: number;
    radius: number;
    radiusX?: number;
    radiusY?: number;
    corner?: 'left-bottom' | 'right-bottom';
    weight?: number;
    color: [number, number, number];
    mixStrength?: number;
    driftY?: number;
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
}

export type WebglShaderBgMount = 'viewport' | 'content';

export interface WebglShaderBgRuntime {
    mount?: WebglShaderBgMount;
    baseCssVar?: string | null;
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
