import { useEffect, useRef } from 'react';

import type { GridParticleFieldOptions } from './gridParticleField';
import { createGridParticleField } from './gridParticleField';
import type { WebglShaderBgConfig } from './webglShaderBackground';
import { createWebglShaderBackground } from './webglShaderBackground';

// Blobs use xOffsetFromCenter so they stay centered in the main content column at any zoom/DPR.
const SHADER_CONFIG: WebglShaderBgConfig = {
    /** Linear RGB 0–1; fallback when CSS var unreadable (dark; light uses `[1,1,1]` in code). */
    baseColor: [1.0, 1.0, 1.0],
    speed: 0.82,
    glowPower: 3.4,
    glowIntensity: 0.52,
    waveAmp: 0.016,
    waveFreqX: 2,
    waveFreqY: 2.5,
    waveSpeedX: 0.24,
    waveSpeedY: 0.2,
    centerY: 0.5,
    mouse: {
        enabled: false,
        radius: 0.28,
        weight: 0.8,
        color: [0, 0.9, 1],
        mixStrength: 0.7,
    },
    blobs: [
        {
            // Sky blue — left of composer
            x: 0,
            xOffsetFromCenter: -0.26,
            y: 0.44,
            radius: 0.34,
            radiusX: 0.38,
            radiusY: 0.26,
            weight: 0.72,
            color: [0.58, 0.74, 0.99],
            mixStrength: 0.64,
            driftX: 0.07,
            driftY: 0.06,
            driftToCenter: 0.09,
            driftToCenterPeriodSec: 9,
            driftToCenterPhaseSec: 0,
            floatPeriodSec: 10,
            floatPhaseSec: 1,
            radiusPulsePeriodSec: 11,
            radiusPulsePhaseSec: 0,
            radiusPulseMinScale: 0.88,
            radiusMorphPeriodSec: 7,
            radiusMorphPhaseSec: 2,
        },
        {
            // Blue — lower-right of composer
            x: 0,
            xOffsetFromCenter: 0.1,
            y: 0.42,
            radius: 0.32,
            radiusX: 0.36,
            radiusY: 0.24,
            weight: 0.76,
            color: [0.38, 0.68, 0.96],
            mixStrength: 0.65,
            driftX: 0.065,
            driftY: 0.07,
            driftToCenter: 0.1,
            driftToCenterPeriodSec: 8,
            driftToCenterPhaseSec: 2.5,
            floatPeriodSec: 11,
            floatPhaseSec: 3,
            radiusPulsePeriodSec: 12,
            radiusPulsePhaseSec: 1,
            radiusPulseMinScale: 0.88,
            radiusMorphPeriodSec: 10,
            radiusMorphPhaseSec: 4,
        },
        {
            // Indigo — purple behind composer
            x: 0,
            xOffsetFromCenter: 0,
            y: 0.56,
            radius: 0.36,
            radiusX: 0.4,
            radiusY: 0.28,
            weight: 0.82,
            color: [0.58, 0.52, 0.92],
            mixStrength: 0.66,
            driftX: 0.06,
            driftY: 0.065,
            driftToCenter: 0.08,
            driftToCenterPeriodSec: 10,
            driftToCenterPhaseSec: 5,
            floatPeriodSec: 12,
            floatPhaseSec: 2,
            radiusPulsePeriodSec: 13,
            radiusPulsePhaseSec: 3,
            radiusPulseMinScale: 0.9,
            radiusMorphPeriodSec: 11,
            radiusMorphPhaseSec: 1,
        },
        {
            // Magenta — right of composer
            x: 0,
            xOffsetFromCenter: 0.22,
            y: 0.48,
            radius: 0.32,
            radiusX: 0.36,
            radiusY: 0.24,
            weight: 0.78,
            color: [0.88, 0.52, 0.74],
            mixStrength: 0.64,
            driftX: 0.07,
            driftY: 0.06,
            driftToCenter: 0.09,
            driftToCenterPeriodSec: 9,
            driftToCenterPhaseSec: 8,
            floatPeriodSec: 10.5,
            floatPhaseSec: 5,
            radiusPulsePeriodSec: 10,
            radiusPulsePhaseSec: 2,
            radiusPulseMinScale: 0.88,
            radiusMorphPeriodSec: 8,
            radiusMorphPhaseSec: 6,
        },
        {
            // Peach — upper-right of composer
            x: 0,
            xOffsetFromCenter: 0.14,
            y: 0.54,
            radius: 0.3,
            radiusX: 0.34,
            radiusY: 0.22,
            weight: 0.74,
            color: [0.99, 0.68, 0.54],
            mixStrength: 0.62,
            driftX: 0.065,
            driftY: 0.07,
            driftToCenter: 0.085,
            driftToCenterPeriodSec: 11,
            driftToCenterPhaseSec: 10,
            floatPeriodSec: 11.5,
            floatPhaseSec: 7,
            radiusPulsePeriodSec: 14,
            radiusPulsePhaseSec: 4,
            radiusPulseMinScale: 0.88,
            radiusMorphPeriodSec: 12,
            radiusMorphPhaseSec: 3,
        },
    ],
};

const PARTICLE_CONFIG: Partial<GridParticleFieldOptions> = {
    spacing: 14,
    size: 1.75,
    alpha: 0.72,
    interactionRadius: 80,
    mouseBrighten: 0.38,
    repelStrength: 0,
    opacityNoiseSize: 0,
    denseAroundInput: false,
    sparseAroundInput: false,
    baseColorCssVar: '--background-main-canvas',
    dotRgb: { r: 255, g: 255, b: 255 },
    breatheSpeedMin: 0.12,
    breatheSpeedMax: 0.26,
    breatheOpacityMin: 0.03,
    breatheOpacityMax: 0.58,
    revealGain: 5.5,
    revealThreshold: 0.012,
};

export function useAnimatedBackground() {
    const shaderCanvasRef = useRef<HTMLCanvasElement>(null);
    const particleCanvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const shaderCanvas = shaderCanvasRef.current;
        const particleCanvas = particleCanvasRef.current;
        if (!shaderCanvas || !particleCanvas) {
            return;
        }

        const shaderInstance = createWebglShaderBackground(shaderCanvas, SHADER_CONFIG, {
            mount: 'content',
            baseCssVar: '--background-main-canvas',
        });
        const field = createGridParticleField(particleCanvas, {
            ...PARTICLE_CONFIG,
            maskSourceCanvas: shaderCanvas,
        });
        field.init();

        return () => {
            shaderInstance.destroy();
            field.destroy();
        };
    }, []);

    return { shaderCanvasRef, particleCanvasRef };
}
