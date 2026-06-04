import { useEffect, useRef } from 'react';

import type { GridParticleFieldOptions } from './gridParticleField';
import { createGridParticleField } from './gridParticleField';
import type { WebglShaderBgConfig } from './webglShaderBackground';
import { createWebglShaderBackground } from './webglShaderBackground';

// color: [0.55, 1, 0.93] ≈ rgb(142, 255, 238)
// color: [0.91, 0.31, 0.8] -> rgb(232, 79, 205)

// latest try: less intense orbs, slower, take up less space
const SHADER_CONFIG: WebglShaderBgConfig = {
    /** Linear RGB 0–1; fallback when CSS var unreadable (dark; light uses `[1,1,1]` in code). */
    baseColor: [0.078, 0.078, 0.078],
    speed: 0.3,
    glowPower: 3,
    glowIntensity: 0.3,
    waveAmp: 0,
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
            // Cyan — outer left; fades in/out on a 10s cycle
            x: 0.2,
            y: 0.7,
            radius: 0.1,
            weight: 0.6,
            color: [0.55, 1, 0.93], // Cyan ≈ rgb(142, 255, 238)
            mixStrength: 0.7,
            driftY: 0,
            pulsePeriodSec: 10,
            pulsePhaseSec: 0,
        },
        {
            // Purple — center-left; contracts to 60% size (dimmest), then expands on a 12s cycle
            x: 0.35,
            y: 0.7,
            radius: 0.2,
            weight: 0.6,
            color: [0.45, 0.3, 1], // Purple ≈ rgb(140, 64, 255)
            mixStrength: 0.4,
            driftY: 0.1,
            radiusPulsePeriodSec: 12,
            radiusPulsePhaseSec: 0,
            radiusPulseMinScale: 0.6,
        },
        {
            // Pink — center-right; contracts to 60% size (dimmest), then expands on an 8s cycle
            x: 0.5,
            y: 0.7,
            radius: 0.2,
            weight: 0.6,
            color: [0.91, 0.31, 0.8], // Pink ≈ rgb(232, 79, 205)
            mixStrength: 0.4,
            driftY: 0,
            radiusPulsePeriodSec: 8,
            radiusPulsePhaseSec: 0,
            radiusPulseMinScale: 0.6,
        },
        {
            // Orange — outer right; same 10s cycle, 5s phase offset from cyan
            x: 0.6,
            y: 0.8,
            radius: 0.1,
            weight: 0.6,
            color: [0.99, 0.62, 0.44], // Orange ≈ rgb(254, 160, 126)
            mixStrength: 0.6,
            driftY: 0,
            pulsePeriodSec: 10,
            pulsePhaseSec: 5,
        },
    ],
};

// very light and neutral - takes up full screen with purple dominating
// const SHADER_CONFIG: WebglShaderBgConfig = {
//     /** Linear RGB 0–1; fallback when CSS var unreadable (dark; light uses `[1,1,1]` in code). */
//     baseColor: [0.078, 0.078, 0.078],
//     speed: 1,
//     glowPower: 3,
//     glowIntensity: 0.3,
//     waveAmp: 0.08,
//     waveFreqX: 6,
//     waveFreqY: 8,
//     waveSpeedX: 0.8,
//     waveSpeedY: 0.6,
//     mouse: {
//         enabled: false,
//         radius: 0.28,
//         weight: 0.8,
//         color: [0, 0.9, 1], // ≈ rgb(0, 230, 255)
//         mixStrength: 0.7,
//     },
//     blobs: [
//         {
//             // Cyan blob - FAR LEFT
//             x: -0.05,
//             y: 0.7, // TOP of screen (WebGL: 0=bottom, 1=top)
//             radius: 0.3,
//             weight: 0.45,
//             color: [0.55, 1, 0.93], // Cyan ≈ rgb(142, 255, 238)
//             mixStrength: 0.6,
//             driftY: 0,
//         },
//         {
//             // Purple blob - CENTER-LEFT
//             x: 0.3,
//             y: 0.7, // TOP of screen
//             radius: 0.4,
//             weight: 0.6,
//             color: [0.45, 0.3, 1], // Purple ≈ rgb(140, 64, 255)
//             mixStrength: 0.5,
//             driftY: 0.1,
//         },
//         {
//             // Orange blob - CENTER-RIGHT
//             x: 0.7,
//             y: 0.7, // TOP of screen
//             radius: 0.3,
//             weight: 0.5,
//             // color: [0.99, 0.62, 0.44], // Orange ≈ rgb(254, 160, 126)
//             color: [0.91, 0.31, 0.8], // Pink ≈ rgb(232, 79, 205)
//             mixStrength: 0.4,
//             driftY: 0,
//         },
//         {
//             // Pink blob - FAR RIGHT
//             x: 0.95,
//             y: 0.8, // TOP of screen
//             radius: 0.3,
//             weight: 0.6,
//             // color: [0.91, 0.31, 0.8], // Pink ≈ rgb(232, 79, 205)
//             color: [0.99, 0.62, 0.44], // Orange ≈ rgb(254, 160, 126)

//             mixStrength: 0.5,
//             driftY: 0.1,
//         },
//     ],
// };

// 2nd try: more subtle with lower mix strength
// const SHADER_CONFIG: WebglShaderBgConfig = {
//     /** Linear RGB 0–1; fallback when CSS var unreadable (dark; light uses `[1,1,1]` in code). */
//     baseColor: [0.078, 0.078, 0.078],
//     speed: 1,
//     glowPower: 3,
//     glowIntensity: 0.3,
//     waveAmp: 0.08,
//     waveFreqX: 6,
//     waveFreqY: 8,
//     waveSpeedX: 0.8,
//     waveSpeedY: 0.6,
//     mouse: {
//         enabled: false,
//         radius: 0.28,
//         weight: 0.8,
//         color: [0, 0.9, 1], // ≈ rgb(0, 230, 255)
//         mixStrength: 0.7,
//     },
//     blobs: [
//         {
//             // Cyan blob - FAR LEFT
//             x: -0.05,
//             y: 0.7, // TOP of screen (WebGL: 0=bottom, 1=top)
//             radius: 0.3,
//             weight: 0.3,
//             color: [0.55, 1, 0.93], // Cyan ≈ rgb(142, 255, 238)
//             mixStrength: 0.6,
//             driftY: 0,
//         },
//         {
//             // Purple blob - CENTER-LEFT
//             x: 0.3,
//             y: 0.7, // TOP of screen
//             radius: 0.4,
//             weight: 0.3,
//             color: [0.45, 0.3, 1], // Purple ≈ rgb(140, 64, 255)
//             mixStrength: 0.5,
//             driftY: 0.1,
//         },
//         {
//             // Orange blob - CENTER-RIGHT
//             x: 0.7,
//             y: 0.7, // TOP of screen
//             radius: 0.3,
//             weight: 0.3,
//             // color: [0.99, 0.62, 0.44], // Orange ≈ rgb(254, 160, 126)
//             color: [0.91, 0.31, 0.8], // Pink ≈ rgb(232, 79, 205)
//             mixStrength: 0.4,
//             driftY: 0,
//         },
//         {
//             // Pink blob - FAR RIGHT
//             x: 0.95,
//             y: 0.8, // TOP of screen
//             radius: 0.3,
//             weight: 0.3,
//             // color: [0.91, 0.31, 0.8], // Pink ≈ rgb(232, 79, 205)
//             color: [0.99, 0.62, 0.44], // Orange ≈ rgb(254, 160, 126)
//             mixStrength: 0.5,
//             driftY: 0.1,
//         },
//     ],
// };

// 3rd try, brighter more orb like and slower
// const SHADER_CONFIG: WebglShaderBgConfig = {
//     /** Linear RGB 0–1; fallback when CSS var unreadable (dark; light uses `[1,1,1]` in code). */
//     baseColor: [0.078, 0.078, 0.078],
//     speed: 1,
//     glowPower: 3,
//     glowIntensity: 0.3,
//     waveAmp: 0.02,
//     waveFreqX: 6,
//     waveFreqY: 8,
//     waveSpeedX: 0.8,
//     waveSpeedY: 0.6,
//     mouse: {
//         enabled: false,
//         radius: 0.28,
//         weight: 0.8,
//         color: [0, 0.9, 1], // ≈ rgb(0, 230, 255)
//         mixStrength: 0.7,
//     },
//     blobs: [
//         {
//             // Cyan blob - FAR LEFT
//             x: -0.05,
//             y: 0.7, // TOP of screen (WebGL: 0=bottom, 1=top)
//             radius: 0.3,
//             weight: 0.6,
//             color: [0.55, 1, 0.93], // Cyan ≈ rgb(142, 255, 238)
//             mixStrength: 0.6,
//             driftY: 0,
//         },
//         {
//             // Purple blob - CENTER-LEFT
//             x: 0.3,
//             y: 0.7, // TOP of screen
//             radius: 0.3,
//             weight: 0.6,
//             color: [0.45, 0.3, 1], // Purple ≈ rgb(140, 64, 255)
//             mixStrength: 0.5,
//             driftY: 0.1,
//         },
//         {
//             // Orange blob - CENTER-RIGHT
//             x: 0.7,
//             y: 0.7, // TOP of screen
//             radius: 0.3,
//             weight: 0.6,
//             // color: [0.99, 0.62, 0.44], // Orange ≈ rgb(254, 160, 126)
//             color: [0.91, 0.31, 0.8], // Pink ≈ rgb(232, 79, 205)
//             mixStrength: 0.4,
//             driftY: 0,
//         },
//         {
//             // Pink blob - FAR RIGHT
//             x: 0.95,
//             y: 0.8, // TOP of screen
//             radius: 0.3,
//             weight: 0.6,
//             // color: [0.91, 0.31, 0.8], // Pink ≈ rgb(232, 79, 205)
//             color: [0.99, 0.62, 0.44], // Orange ≈ rgb(254, 160, 126)
//             mixStrength: 0.5,
//             driftY: 0.1,
//         },
//     ],
// };

// 4th try - more contained and closer together but bright
// const SHADER_CONFIG: WebglShaderBgConfig = {
//     /** Linear RGB 0–1; fallback when CSS var unreadable (dark; light uses `[1,1,1]` in code). */
//     baseColor: [0.078, 0.078, 0.078],
//     speed: 0.7,
//     glowPower: 3,
//     glowIntensity: 0.3,
//     waveAmp: 0,
//     waveFreqX: 6,
//     waveFreqY: 8,
//     waveSpeedX: 0.8,
//     waveSpeedY: 0.6,
//     mouse: {
//         enabled: false,
//         radius: 0.28,
//         weight: 0.8,
//         color: [0, 0.9, 1], // ≈ rgb(0, 230, 255)
//         mixStrength: 0.7,
//     },
//     blobs: [
//         {
//             // Cyan blob - FAR LEFT
//             // x: -0.05,
//             x: 0.05,
//             y: 0.7, // TOP of screen (WebGL: 0=bottom, 1=top)
//             radius: 0.2,
//             weight: 0.6,
//             color: [0.55, 1, 0.93], // Cyan ≈ rgb(142, 255, 238)
//             mixStrength: 0.7,
//             driftY: 0,
//         },
//         {
//             // Purple blob - CENTER-LEFT
//             x: 0.3,
//             y: 0.7, // TOP of screen
//             radius: 0.25,
//             weight: 0.8,
//             color: [0.45, 0.3, 1], // Purple ≈ rgb(140, 64, 255)
//             mixStrength: 0.6,
//             driftY: 0.1,
//         },
//         {
//             // Orange blob - CENTER-RIGHT
//             x: 0.6,
//             y: 0.7, // TOP of screen
//             radius: 0.25,
//             weight: 0.8,
//             // color: [0.99, 0.62, 0.44], // Orange ≈ rgb(254, 160, 126)
//             color: [0.91, 0.31, 0.8], // Pink ≈ rgb(232, 79, 205)
//             mixStrength: 0.6,
//             driftY: 0,
//         },
//         {
//             // Pink blob - FAR RIGHT
//             x: 0.85,
//             y: 0.8, // TOP of screen
//             radius: 0.2,
//             weight: 0.7,
//             // color: [0.91, 0.31, 0.8], // Pink ≈ rgb(232, 79, 205)
//             color: [0.99, 0.62, 0.44], // Orange ≈ rgb(254, 160, 126)
//             mixStrength: 0.6,
//             driftY: 0.1,
//         },
//     ],
// };

const PARTICLE_CONFIG: Partial<GridParticleFieldOptions> = {
    spacing: 18,
    size: 2,
    alpha: 0.98,
    interactionRadius: 200, // Larger area of effect (was 120)
    repelStrength: 10, // Stronger push effect (was 6)
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
            mount: 'viewport',
            baseCssVar: '--background-main-canvas',
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
