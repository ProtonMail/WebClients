export interface GridParticleFieldOptions {
    spacing: number;
    size: number;
    alpha: number;
    ease: number;
    interactionRadius: number;
    repelStrength: number;
    denseAroundInput: boolean;
    focusTarget: 'lumo-input-wrapper' | 'input-container';
    focusPadding: number;
    focusSpacing: number;
    transitionPadding: number;
    opacityNoiseSize: number;
    opacityNoiseContrast: number;
    colorCssVar: string;
    colorCssVarChat: string;
}

export declare const DEFAULT_GRID_PARTICLE_FIELD_OPTIONS: GridParticleFieldOptions;

export declare function mergeGridParticleFieldOptions(
    partial?: Partial<GridParticleFieldOptions>
): GridParticleFieldOptions;

export declare class GridParticleField {
    constructor(el: HTMLCanvasElement, options?: Partial<GridParticleFieldOptions>);
    setChatColorMode(chat: boolean): void;
    destroy(): void;
}

export interface GridParticleFieldHandle {
    init: () => void;
    setChatColorMode: (chat: boolean) => void;
    destroy: () => void;
}

export declare function createGridParticleField(
    canvas: HTMLCanvasElement,
    options?: Partial<GridParticleFieldOptions>
): GridParticleFieldHandle;
