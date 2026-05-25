import { useEffect, useRef } from 'react';

import type { GridParticleFieldOptions } from './gridParticleField';
import { createGridParticleField } from './gridParticleField';
import type { WebglShaderBgConfig } from './webglShaderBackground';
import { createWebglShaderBackground } from './webglShaderBackground';

const SHADER_CONFIG: WebglShaderBgConfig = {
    /** Linear RGB 0–1; fallback when CSS var unreadable (dark; light uses `[1,1,1]` in code). */
    baseColor: [0.078, 0.078, 0.078],
    speed: 1,
    glowPower: 3,
    glowIntensity: 0.3,
    waveAmp: 0.08,
    waveFreqX: 6,
    waveFreqY: 8,
    waveSpeedX: 0.8,
    waveSpeedY: 0.6,
    mouse: {
        enabled: false,
        radius: 0.28,
        weight: 0.8,
        color: [0, 0.9, 1], // ≈ rgb(0, 230, 255)
        mixStrength: 0.7,
    },
    blobs: [
        {
            x: 0.45,
            y: 0.5,
            radius: 0.5,
            weight: 1,
            color: [0.1, 0.35, 1], // ≈ rgb(26, 89, 255)
            mixStrength: 0.6,
            driftY: 0,
        },
        {
            x: 1.05,
            y: 0.35,
            radius: 0.45,
            weight: 0.6,
            color: [0.45, 0.3, 1], // ≈ rgb(140, 64, 255)
            mixStrength: 0.5,
            driftY: 0.15,
        },
    ],
};

const PARTICLE_CONFIG: Partial<GridParticleFieldOptions> = {
    spacing: 20,
    size: 1,
    alpha: 0.98,
    interactionRadius: 120,
    repelStrength: 4,
    opacityNoiseSize: 120,
    opacityNoiseContrast: 3,
    colorCssVar: '--surface-foreground',
};

export function useAnimatedBackground() {
    const shaderCanvasRef = useRef<HTMLCanvasElement>(null);
    const particleCanvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = shaderCanvasRef.current;
        if (!canvas) {
            return;
        }
        const instance = createWebglShaderBackground(canvas, SHADER_CONFIG, {
            mount: 'content',
            baseCssVar: '--background-norm',
        });
        return () => {
            instance.destroy();
        };
    }, []);

    useEffect(() => {
        const canvas = particleCanvasRef.current;
        if (!canvas) {
            return;
        }
        const field = createGridParticleField(canvas, PARTICLE_CONFIG);
        field.init();
        return () => {
            field.destroy();
        };
    }, []);

    return { shaderCanvasRef, particleCanvasRef };
}
