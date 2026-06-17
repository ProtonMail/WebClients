export interface GridParticleFieldRgb {
    r: number;
    g: number;
    b: number;
}

/** Tunables for the blob-reveal dot grid (rendered as a second pass on the shader canvas). */
export interface GridParticleFieldOptions {
    spacing: number;
    size: number;
    alpha: number;
    interactionRadius: number;
    mouseBrighten: number;
    baseColorCssVar: string;
    dotRgb: GridParticleFieldRgb;
    breatheSpeedMin: number;
    breatheSpeedMax: number;
    breatheOpacityMin: number;
    breatheOpacityMax: number;
    revealGain: number;
    revealThreshold: number;
}
