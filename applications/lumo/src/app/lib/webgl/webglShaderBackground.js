/** Max blobs compiled into the fragment shader (see `MAX_BLOBS` in shader source). */
export const WEBGL_SHADER_BG_MAX_BLOBS = 8;

/**
 * @typedef {object} WebglShaderBgMouseConfig
 * @property {boolean} [enabled]
 * @property {number} [radius]
 * @property {number} [weight]
 * @property {[number, number, number]} [color] RGB 0–1
 * @property {number} [mixStrength]
 */

/**
 * @typedef {object} WebglShaderBgBlobConfig
 * @property {number} x
 * @property {number} y
 * @property {number} [xOffsetFromCenter] when set, horizontal position is gravity center + this offset (aspect-corrected UV)
 * @property {number} radius fallback for {@link radiusX} / {@link radiusY}
 * @property {number} [radiusX] half-extent along aspect-corrected x (defaults to `radius`)
 * @property {number} [radiusY] half-extent along y (defaults to `radius`)
 * @property {"left-bottom" | "right-bottom"} [corner] pin to `.content` corner (aspect-corrected UV)
 * @property {number} [weight]
 * @property {[number, number, number]} color RGB 0–1
 * @property {number} [mixStrength]
 * @property {number} [driftY] amplitude for vertical float (UV space)
 * @property {number} [driftX] amplitude for horizontal float (UV space)
 * @property {number} [driftToCenter] amplitude for radial in/out motion toward the viewport center (UV space)
 * @property {number} [driftToCenterPeriodSec] full in/out cycle toward center in seconds (default 12)
 * @property {number} [driftToCenterPhaseSec] phase offset in seconds within the center-drift cycle
 * @property {number} [floatPeriodSec] independent wander cycle in seconds (defaults to 1.35× center period)
 * @property {number} [floatPhaseSec] phase offset in seconds for the wander cycle
 * @property {number} [radiusMorphPeriodSec] ellipse shape-morph cycle in seconds (defaults to radius pulse period)
 * @property {number} [radiusMorphPhaseSec] phase offset for ellipse shape morph
 * @property {number} [pulsePeriodSec] full fade cycle in seconds; omit for always visible
 * @property {number} [pulsePhaseSec] phase offset in seconds within the pulse cycle
 * @property {number} [radiusPulsePeriodSec] breathe cycle (full → min scale → full)
 * @property {number} [radiusPulsePhaseSec] phase offset for radius breathe
 * @property {number} [radiusPulseMinScale] smallest radius fraction (default 0.6)
 */

/**
 * @param {number} timeSec
 * @param {number} periodSec
 * @param {number} phaseSec
 */
function blobPulseSine(timeSec, periodSec, phaseSec) {
    const angle = ((timeSec + phaseSec) / periodSec) * Math.PI * 2;
    return Math.sin(angle);
}

/**
 * @param {number} timeSec
 * @param {WebglShaderBgBlobConfig} blob
 * @param {boolean} freezePulse
 */
function blobPulseOpacity(timeSec, blob, freezePulse) {
    const period = blob.pulsePeriodSec;
    if (freezePulse || period == null || period <= 0) {
        return 1;
    }
    const sine = blobPulseSine(timeSec, period, blob.pulsePhaseSec ?? 0);
    return (sine + 1) * 0.5;
}

/**
 * Contract from full radius down to `radiusPulseMinScale`, then expand back; opacity tracks size.
 * @param {number} timeSec
 * @param {WebglShaderBgBlobConfig} blob
 * @param {boolean} freezePulse
 * @returns {{ scale: number; opacity: number }}
 */
function blobRadiusBreathe(timeSec, blob, freezePulse) {
    const period = blob.radiusPulsePeriodSec;
    if (freezePulse || period == null || period <= 0) {
        return { scale: 1, opacity: 1 };
    }
    const minScale = blob.radiusPulseMinScale ?? 0.6;
    const sine = blobPulseSine(timeSec, period, blob.radiusPulsePhaseSec ?? 0);
    const expand = (sine + 1) * 0.5;
    const scale = minScale + (1 - minScale) * expand;
    return { scale, opacity: scale };
}

/** @type {HTMLDivElement | null} */
let themeColorProbe = null;

/** @type {string | null} */
let themeColorProbeVar = null;

/**
 * Resolves a CSS custom property (e.g. `--surface-foreground`) to RGB 0–1 for the shader.
 * @param {string | null | undefined} cssVar
 * @param {[number, number, number]} fallback
 * @returns {[number, number, number]}
 */
function readCssVarRgb01(cssVar, fallback) {
    if (!cssVar || typeof document === 'undefined') return fallback;
    if (!themeColorProbe || themeColorProbeVar !== cssVar) {
        if (themeColorProbe) {
            themeColorProbe.remove();
            themeColorProbe = null;
        }
        const el = document.createElement('div');
        el.setAttribute('aria-hidden', 'true');
        el.style.cssText =
            'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;visibility:hidden;pointer-events:none;';
        el.style.background = `var(${cssVar})`;
        document.documentElement.appendChild(el);
        themeColorProbe = el;
        themeColorProbeVar = cssVar;
    }
    const bg = getComputedStyle(themeColorProbe).backgroundColor;
    const m = bg.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
    if (!m) return fallback;
    return [
        Math.min(1, Math.max(0, Number(m[1]) / 255)),
        Math.min(1, Math.max(0, Number(m[2]) / 255)),
        Math.min(1, Math.max(0, Number(m[3]) / 255)),
    ];
}

function removeThemeColorProbe() {
    if (themeColorProbe) {
        themeColorProbe.remove();
        themeColorProbe = null;
        themeColorProbeVar = null;
    }
}

/** @param {[number, number, number]} fallback */
function themeBaseColorFallback(fallback) {
    if (typeof document === 'undefined') return fallback;
    if (document.documentElement.getAttribute('data-theme') === 'light') {
        return [1, 1, 1];
    }
    return fallback;
}

/**
 * Reads the current WebGL framebuffer (after the last `drawArrays`) into a PNG blob.
 * Flips vertically so the image matches on-screen orientation.
 * @param {WebGLRenderingContext} gl
 * @param {number} width `drawingBufferWidth`
 * @param {number} height `drawingBufferHeight`
 * @returns {Promise<Blob | null>}
 */
function framebufferToPngBlob(gl, width, height) {
    const rowBytes = width * 4;
    const raw = new Uint8Array(rowBytes * height);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, raw);
    const rgba = new Uint8ClampedArray(rowBytes * height);
    for (let y = 0; y < height; y++) {
        const srcStart = y * rowBytes;
        rgba.set(raw.subarray(srcStart, srcStart + rowBytes), (height - 1 - y) * rowBytes);
    }
    const out = document.createElement('canvas');
    out.width = width;
    out.height = height;
    const ctx = out.getContext('2d');
    if (!ctx) return Promise.resolve(null);
    try {
        ctx.putImageData(new ImageData(rgba, width, height), 0, 0);
    } catch {
        return Promise.resolve(null);
    }
    return new Promise((resolve) => {
        out.toBlob((blob) => resolve(blob), 'image/png');
    });
}

/**
 * @typedef {object} WebglShaderBgConfig
 * @property {[number, number, number]} [baseColor] fallback if the theme CSS var cannot be read
 * @property {number} [speed] time multiplier for drift + wave
 * @property {number} [glowPower]
 * @property {number} [glowIntensity]
 * @property {number} [waveAmp]
 * @property {number} [waveFreqX]
 * @property {number} [waveFreqY]
 * @property {number} [waveSpeedX]
 * @property {number} [waveSpeedY]
 * @property {WebglShaderBgMouseConfig} [mouse]
 * @property {WebglShaderBgBlobConfig[]} [blobs]
 * @property {number} [centerY] vertical gravity anchor in UV space (default 0.5)
 * @property {number} [centerX] horizontal gravity anchor in aspect-corrected UV (default: viewport center + sidebar offset)
 * @property {number} [sidebarOffsetPx] fixed left sidebar width in px; shifts gravity center right (default 0)
 */

const MAX_BLOBS = WEBGL_SHADER_BG_MAX_BLOBS;

/** @param {WebglShaderBgConfig | undefined} partial */
function mergeConfig(partial) {
    /** @type {Required<WebglShaderBgConfig> & { mouse: Required<WebglShaderBgMouseConfig>; blobs: WebglShaderBgBlobConfig[] }} */
    const base = {
        baseColor: [0.02, 0.03, 0.08],
        speed: 1,
        glowPower: 3,
        glowIntensity: 0.4,
        waveAmp: 0.08,
        waveFreqX: 6,
        waveFreqY: 8,
        waveSpeedX: 0.8,
        waveSpeedY: 0.6,
        mouse: {
            enabled: true,
            radius: 0.28,
            weight: 0.8,
            color: [0, 0.9, 1],
            mixStrength: 0.7,
        },
        centerY: 0.5,
        centerX: undefined,
        sidebarOffsetPx: 0,
        blobs: [
            {
                x: 0.45,
                y: 0.5,
                radius: 0.35,
                weight: 1,
                color: [0.1, 0.35, 1],
                mixStrength: 0.6,
                driftY: 0,
            },
            {
                x: 1.05,
                y: 0.35,
                radius: 0.45,
                weight: 0.6,
                color: [0.55, 0.25, 1],
                mixStrength: 0.5,
                driftY: 0.15,
            },
        ],
    };
    if (!partial) return base;
    return {
        ...base,
        ...partial,
        mouse: { ...base.mouse, ...(partial.mouse ?? {}) },
        blobs: partial.blobs != null && partial.blobs.length > 0 ? partial.blobs : base.blobs,
    };
}

function buildFragmentSource() {
    return `
      precision mediump float;
      #define MAX_BLOBS ${MAX_BLOBS}

      uniform vec2 resolution;
      uniform vec2 mouse;
      uniform float time;
      uniform vec3 u_baseColor;
      uniform float u_speed;
      uniform float u_glowPower;
      uniform float u_glowIntensity;
      uniform float u_waveAmp;
      uniform vec2 u_waveFreq;
      uniform vec2 u_waveSpeed;
      uniform float u_mouseEnabled;
      uniform float u_mouseRadius;
      uniform float u_mouseWeight;
      uniform vec3 u_mouseColor;
      uniform float u_mouseMix;
      uniform int u_blobCount;
      uniform vec2 u_blobPos[MAX_BLOBS];
      uniform float u_blobRadiusX[MAX_BLOBS];
      uniform float u_blobRadiusY[MAX_BLOBS];
      uniform float u_blobWeight[MAX_BLOBS];
      uniform vec3 u_blobColor[MAX_BLOBS];
      uniform float u_blobMix[MAX_BLOBS];
      uniform float u_blobDriftY[MAX_BLOBS];
      uniform float u_blobDriftX[MAX_BLOBS];
      uniform float u_blobDriftCenter[MAX_BLOBS];
      uniform float u_blobDriftCenterPeriod[MAX_BLOBS];
      uniform float u_blobDriftCenterPhase[MAX_BLOBS];
      uniform float u_blobFloatPeriod[MAX_BLOBS];
      uniform float u_blobFloatPhase[MAX_BLOBS];
      uniform float u_blobMorphPeriod[MAX_BLOBS];
      uniform float u_blobMorphPhase[MAX_BLOBS];
      uniform float u_centerX;
      uniform float u_centerY;

      const float TAU = 6.2831853;

      float blobAngle(float elapsedSec, float periodSec, float phaseSec) {
        return TAU * (elapsedSec + phaseSec) / max(periodSec, 0.001);
      }

      float blobEllip(vec2 uv, vec2 pos, vec2 radii) {
        vec2 d = (uv - pos) / max(radii, vec2(0.0001));
        return smoothstep(1.0, 0.0, length(d));
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        uv.x *= resolution.x / resolution.y;

        vec2 m = mouse / resolution.xy;
        m.x *= resolution.x / resolution.y;

        float t = time * u_speed;
        vec2 gravityCenter = vec2(u_centerX, u_centerY);
        float wave =
          sin((uv.x * u_waveFreq.x) + t * u_waveSpeed.x) * u_waveAmp +
          cos((uv.y * u_waveFreq.y) - t * u_waveSpeed.y) * u_waveAmp;

        vec2 uvd = uv + wave;

        float shape = 0.0;
        vec3 color = u_baseColor;

        for (int i = 0; i < MAX_BLOBS; i++) {
          float fi = float(i);
          float active = 1.0 - step(float(u_blobCount), fi);
          vec2 pos = u_blobPos[i];

          float centerAngle = blobAngle(
            time * u_speed,
            u_blobDriftCenterPeriod[i],
            u_blobDriftCenterPhase[i]
          );
          float centerDrift = sin(centerAngle);
          // Bidirectional radial breathe: full pull inward, softer push outward to avoid corner blowout.
          float radialMove = centerDrift >= 0.0 ? centerDrift : centerDrift * 0.55;

          float floatAngle = blobAngle(
            time * u_speed,
            u_blobFloatPeriod[i],
            u_blobFloatPhase[i]
          );
          pos.x += sin(floatAngle + fi * 1.17) * u_blobDriftX[i];
          pos.y += cos(floatAngle * 0.93 + fi * 0.81) * u_blobDriftY[i];
          pos.x += cos(floatAngle * 1.31 + fi * 2.03) * u_blobDriftX[i] * 0.45;
          pos.y += sin(floatAngle * 0.71 + fi * 1.49) * u_blobDriftY[i] * 0.45;

          if (u_blobDriftCenter[i] > 0.0) {
            vec2 toCenter = gravityCenter - pos;
            float dist = length(toCenter);
            if (dist > 0.0001) {
              pos += (toCenter / dist) * u_blobDriftCenter[i] * radialMove;
            }
          }

          vec2 radii = vec2(u_blobRadiusX[i], u_blobRadiusY[i]);
          float morphAngle = blobAngle(
            time * u_speed,
            u_blobMorphPeriod[i],
            u_blobMorphPhase[i]
          );
          radii.x *= 0.84 + 0.16 * sin(morphAngle + fi * 0.41);
          radii.y *= 0.84 + 0.16 * cos(morphAngle * 1.19 + fi * 0.67);

          float b =
            blobEllip(uvd, pos, radii) * u_blobWeight[i] * active;
          shape += b;
          color = mix(color, u_blobColor[i], b * u_blobMix[i]);
        }

        if (u_mouseEnabled > 0.5) {
          float bMouse =
            blobEllip(uvd, m, vec2(u_mouseRadius)) * u_mouseWeight;
          shape += bMouse;
          color = mix(color, u_mouseColor, bMouse * u_mouseMix);
        }

        // Soft-limit overlap, then add glow in the blob tint direction (not white).
        float glowShape = shape / (1.0 + shape);
        vec3 tint = max(color - u_baseColor, vec3(0.0));
        color += pow(max(glowShape, 0.0001), u_glowPower) * u_glowIntensity * tint;

        gl_FragColor = vec4(color, 1.0);
      }
    `;
}

const VERTEX_SHADER_SOURCE = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

/**
 * @param {WebGLRenderingContext} gl
 * @param {number} type
 * @param {string} source
 */
function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

/** @param {number} rawDpr @param {number} maxDpr */
function effectiveDpr(rawDpr, maxDpr) {
    const cap = Number(maxDpr);
    if (!Number.isFinite(cap) || cap <= 0) {
        return rawDpr;
    }
    return Math.min(rawDpr, cap);
}

/** @typedef {"viewport" | "content"} WebglShaderBgMount */

/**
 * @typedef {object} WebglShaderBgRuntimeOptions
 * @property {WebglShaderBgMount} [mount]
 * @property {string | null} [baseCssVar]
 * @property {number} [maxDpr] cap device pixel ratio (default: uncapped)
 * @property {number} [targetFps] throttle renders (default: 60)
 * @property {(timeMs: number) => void} [onAfterRender] called after each rendered frame
 */

/**
 * @param {HTMLCanvasElement} canvas
 * @param {WebglShaderBgConfig} [userConfig]
 * @param {WebglShaderBgRuntimeOptions} [runtime]
 * @returns {{
 *   destroy: () => void;
 *   capturePng: () => Promise<Blob | null>;
 * }}
 */
export function createWebglShaderBackground(canvas, userConfig, runtime = {}) {
    const config = mergeConfig(userConfig);
    const mount = runtime.mount === 'content' ? 'content' : 'viewport';
    const baseCssVar = runtime.baseCssVar ?? null;
    const maxDpr = runtime.maxDpr ?? 0;
    const targetFps = Math.max(1, runtime.targetFps ?? 60);
    const onAfterRender = runtime.onAfterRender ?? null;
    const minFrameIntervalMs = 1000 / targetFps;
    const gl = canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: true,
    });

    const noop = () => {};

    if (!gl) {
        console.warn('WebGL not available; shader background disabled.');
        return {
            destroy: noop,
            capturePng: () => Promise.resolve(null),
        };
    }

    const fsSource = buildFragmentSource();
    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) {
        return {
            destroy: noop,
            capturePng: () => Promise.resolve(null),
        };
    }

    const program = gl.createProgram();
    if (!program) {
        return {
            destroy: noop,
            capturePng: () => Promise.resolve(null),
        };
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return {
            destroy: noop,
            capturePng: () => Promise.resolve(null),
        };
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    gl.useProgram(program);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, 'resolution');
    const uMouse = gl.getUniformLocation(program, 'mouse');
    const uTime = gl.getUniformLocation(program, 'time');
    const uBaseColor = gl.getUniformLocation(program, 'u_baseColor');
    const uSpeed = gl.getUniformLocation(program, 'u_speed');
    const uGlowPower = gl.getUniformLocation(program, 'u_glowPower');
    const uGlowIntensity = gl.getUniformLocation(program, 'u_glowIntensity');
    const uWaveAmp = gl.getUniformLocation(program, 'u_waveAmp');
    const uWaveFreq = gl.getUniformLocation(program, 'u_waveFreq');
    const uWaveSpeed = gl.getUniformLocation(program, 'u_waveSpeed');
    const uMouseEnabled = gl.getUniformLocation(program, 'u_mouseEnabled');
    const uMouseRadius = gl.getUniformLocation(program, 'u_mouseRadius');
    const uMouseWeight = gl.getUniformLocation(program, 'u_mouseWeight');
    const uMouseColor = gl.getUniformLocation(program, 'u_mouseColor');
    const uMouseMix = gl.getUniformLocation(program, 'u_mouseMix');
    const uBlobCount = gl.getUniformLocation(program, 'u_blobCount');
    const uBlobPos = [];
    const uBlobRadiusX = [];
    const uBlobRadiusY = [];
    const uBlobWeight = [];
    const uBlobColor = [];
    const uBlobMix = [];
    const uBlobDriftY = [];
    const uBlobDriftX = [];
    const uBlobDriftCenter = [];
    const uBlobDriftCenterPeriod = [];
    const uBlobDriftCenterPhase = [];
    const uBlobFloatPeriod = [];
    const uBlobFloatPhase = [];
    const uBlobMorphPeriod = [];
    const uBlobMorphPhase = [];
    const uCenterX = gl.getUniformLocation(program, 'u_centerX');
    const uCenterY = gl.getUniformLocation(program, 'u_centerY');
    for (let i = 0; i < MAX_BLOBS; i++) {
        uBlobPos.push(gl.getUniformLocation(program, `u_blobPos[${i}]`));
        uBlobRadiusX.push(gl.getUniformLocation(program, `u_blobRadiusX[${i}]`));
        uBlobRadiusY.push(gl.getUniformLocation(program, `u_blobRadiusY[${i}]`));
        uBlobWeight.push(gl.getUniformLocation(program, `u_blobWeight[${i}]`));
        uBlobColor.push(gl.getUniformLocation(program, `u_blobColor[${i}]`));
        uBlobMix.push(gl.getUniformLocation(program, `u_blobMix[${i}]`));
        uBlobDriftY.push(gl.getUniformLocation(program, `u_blobDriftY[${i}]`));
        uBlobDriftX.push(gl.getUniformLocation(program, `u_blobDriftX[${i}]`));
        uBlobDriftCenter.push(gl.getUniformLocation(program, `u_blobDriftCenter[${i}]`));
        uBlobDriftCenterPeriod.push(gl.getUniformLocation(program, `u_blobDriftCenterPeriod[${i}]`));
        uBlobDriftCenterPhase.push(gl.getUniformLocation(program, `u_blobDriftCenterPhase[${i}]`));
        uBlobFloatPeriod.push(gl.getUniformLocation(program, `u_blobFloatPeriod[${i}]`));
        uBlobFloatPhase.push(gl.getUniformLocation(program, `u_blobFloatPhase[${i}]`));
        uBlobMorphPeriod.push(gl.getUniformLocation(program, `u_blobMorphPeriod[${i}]`));
        uBlobMorphPhase.push(gl.getUniformLocation(program, `u_blobMorphPhase[${i}]`));
    }

    const mouse = { x: 0, y: 0 };
    /** @type {((blob: Blob | null) => void)[]} */
    const captureResolvers = [];
    let raf = 0;
    let reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let paused = typeof document !== 'undefined' && document.hidden;
    let lastFrameMs = 0;
    let baseColorDirty = true;
    /** @type {[number, number, number] | null} */
    let cachedBaseColor = null;

    /** @param {MediaQueryListEvent} e */
    function onMotionPreference(e) {
        reducedMotion = e.matches;
    }
    const motionMq = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

    function onVisibilityChange() {
        paused = document.hidden;
        if (!paused) {
            baseColorDirty = true;
            lastFrameMs = 0;
        }
    }

    function resolveBaseColor() {
        if (baseColorDirty || !cachedBaseColor) {
            cachedBaseColor = readCssVarRgb01(baseCssVar, themeBaseColorFallback(config.baseColor));
            baseColorDirty = false;
        }
        return cachedBaseColor;
    }

    function onMouseMove(/** @type {MouseEvent} */ event) {
        const dpr = effectiveDpr(window.devicePixelRatio || 1, maxDpr);
        if (mount === 'content') {
            const rect = canvas.getBoundingClientRect();
            mouse.x = (event.clientX - rect.left) * dpr;
            mouse.y = (rect.bottom - event.clientY) * dpr;
        } else {
            mouse.x = event.clientX * dpr;
            mouse.y = (window.innerHeight - event.clientY) * dpr;
        }
    }

    let resizeRaf = 0;

    function resize() {
        const dpr = effectiveDpr(window.devicePixelRatio || 1, maxDpr);
        let cssW;
        let cssH;
        if (mount === 'content') {
            const host = canvas.parentElement;
            if (!host) return;
            cssW = host.clientWidth;
            cssH = host.clientHeight;
            if (cssW < 2 || cssH < 2) {
                canvas.style.visibility = 'hidden';
                return;
            }
            canvas.style.visibility = 'visible';
            canvas.style.width = `${cssW}px`;
            canvas.style.height = `${cssH}px`;
        } else {
            cssW = window.innerWidth;
            cssH = window.innerHeight;
            canvas.style.width = '';
            canvas.style.height = '';
            canvas.style.visibility = 'visible';
        }
        const w = Math.max(1, Math.floor(cssW * dpr));
        const h = Math.max(1, Math.floor(cssH * dpr));
        const sizeChanged = canvas.width !== w || canvas.height !== h;
        if (sizeChanged) {
            canvas.width = w;
            canvas.height = h;
        }
        gl.viewport(0, 0, w, h);
        if (sizeChanged) {
            baseColorDirty = true;
            renderFrame(performance.now());
        }
    }

    function scheduleResize() {
        if (resizeRaf) cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(() => {
            resizeRaf = 0;
            resize();
        });
    }

    /** Aspect-corrected UV width (matches fragment shader `uv.x` scale). */
    function aspectUvWidth() {
        return canvas.height > 0 ? canvas.width / canvas.height : 1;
    }

    /** CSS pixel height of the canvas (stable across devicePixelRatio / browser zoom). */
    function cssCanvasHeight() {
        const dpr = window.devicePixelRatio || 1;
        return canvas.height / dpr;
    }

    /** @param {ReturnType<typeof mergeConfig>} cfg */
    function resolveGravityCenter(cfg) {
        const aspect = aspectUvWidth();
        if (mount === 'content') {
            return {
                x: cfg.centerX ?? aspect * 0.5,
                y: cfg.centerY ?? 0.5,
            };
        }
        const sidebarUv = (cfg.sidebarOffsetPx ?? 0) / Math.max(cssCanvasHeight(), 1);
        return {
            x: cfg.centerX ?? (aspect + sidebarUv) * 0.5,
            y: cfg.centerY ?? 0.5,
        };
    }

    /** @param {WebglShaderBgBlobConfig} blob */
    function resolveBlobPlacement(blob) {
        const rx = blob.radiusX ?? blob.radius;
        const ry = blob.radiusY ?? blob.radius;
        if (blob.corner === 'left-bottom') {
            return { x: 0, y: 0, radiusX: rx, radiusY: ry };
        }
        if (blob.corner === 'right-bottom') {
            return { x: aspectUvWidth(), y: 0, radiusX: rx, radiusY: ry };
        }
        return {
            x: blob.x,
            y: blob.y,
            radiusX: rx,
            radiusY: ry,
        };
    }

    /** @param {WebglShaderBgBlobConfig} blob */
    function resolveBlobMotionPeriods(blob) {
        const centerPeriod = blob.driftToCenterPeriodSec ?? 12;
        const floatPeriod = blob.floatPeriodSec ?? centerPeriod * 1.35;
        const morphPeriod =
            blob.radiusMorphPeriodSec ?? blob.radiusPulsePeriodSec ?? centerPeriod * 0.85;
        return {
            centerPeriod,
            floatPeriod,
            morphPeriod,
        };
    }

    /** @param {ReturnType<typeof mergeConfig>} cfg @param {number} timeSec @param {{ x: number; y: number }} gravity */
    function pushBlobUniforms(cfg, timeSec, gravity) {
        const blobs = cfg.blobs.slice(0, MAX_BLOBS);
        const count = blobs.length;
        gl.uniform1i(uBlobCount, count);
        for (let i = 0; i < MAX_BLOBS; i++) {
            const b = blobs[i];
            if (b) {
                let opacity = blobPulseOpacity(timeSec, b, reducedMotion);
                let radiusScale = 1;
                const radiusPeriod = b.radiusPulsePeriodSec;
                if (radiusPeriod != null && radiusPeriod > 0) {
                    const breathe = blobRadiusBreathe(timeSec, b, reducedMotion);
                    radiusScale = breathe.scale;
                    const hasOpacityPulse = b.pulsePeriodSec != null && b.pulsePeriodSec > 0;
                    if (!hasOpacityPulse) {
                        opacity = breathe.opacity;
                    } else {
                        opacity = opacity * breathe.opacity;
                    }
                }
                const p = resolveBlobPlacement(b);
                const blobX = b.xOffsetFromCenter != null ? gravity.x + b.xOffsetFromCenter : p.x;
                gl.uniform2f(uBlobPos[i], blobX, p.y);
                gl.uniform1f(uBlobRadiusX[i], p.radiusX * radiusScale);
                gl.uniform1f(uBlobRadiusY[i], p.radiusY * radiusScale);
                gl.uniform1f(uBlobWeight[i], (b.weight ?? 1) * opacity);
                const c = b.color;
                gl.uniform3f(uBlobColor[i], c[0], c[1], c[2]);
                gl.uniform1f(uBlobMix[i], (b.mixStrength ?? 0.6) * opacity);
                gl.uniform1f(uBlobDriftY[i], b.driftY ?? 0);
                gl.uniform1f(uBlobDriftX[i], b.driftX ?? 0);
                gl.uniform1f(uBlobDriftCenter[i], b.driftToCenter ?? 0);
                const motion = resolveBlobMotionPeriods(b);
                gl.uniform1f(uBlobDriftCenterPeriod[i], motion.centerPeriod);
                gl.uniform1f(uBlobDriftCenterPhase[i], b.driftToCenterPhaseSec ?? 0);
                gl.uniform1f(uBlobFloatPeriod[i], motion.floatPeriod);
                gl.uniform1f(uBlobFloatPhase[i], b.floatPhaseSec ?? 0);
                gl.uniform1f(uBlobMorphPeriod[i], motion.morphPeriod);
                gl.uniform1f(uBlobMorphPhase[i], b.radiusMorphPhaseSec ?? b.radiusPulsePhaseSec ?? 0);
            } else {
                gl.uniform2f(uBlobPos[i], 0, 0);
                gl.uniform1f(uBlobRadiusX[i], 0.0001);
                gl.uniform1f(uBlobRadiusY[i], 0.0001);
                gl.uniform1f(uBlobWeight[i], 0);
                gl.uniform3f(uBlobColor[i], 0, 0, 0);
                gl.uniform1f(uBlobMix[i], 0);
                gl.uniform1f(uBlobDriftY[i], 0);
                gl.uniform1f(uBlobDriftX[i], 0);
                gl.uniform1f(uBlobDriftCenter[i], 0);
                gl.uniform1f(uBlobDriftCenterPeriod[i], 12);
                gl.uniform1f(uBlobDriftCenterPhase[i], 0);
                gl.uniform1f(uBlobFloatPeriod[i], 16);
                gl.uniform1f(uBlobFloatPhase[i], 0);
                gl.uniform1f(uBlobMorphPeriod[i], 10);
                gl.uniform1f(uBlobMorphPhase[i], 0);
            }
        }
    }

    /** @param {ReturnType<typeof mergeConfig>} cfg @param {number} timeSec */
    function applyShaderUniforms(cfg, timeSec) {
        const mc = cfg.mouse.color;
        gl.uniform1f(uSpeed, cfg.speed);
        gl.uniform1f(uGlowPower, cfg.glowPower);
        gl.uniform1f(uGlowIntensity, cfg.glowIntensity);
        gl.uniform1f(uWaveAmp, cfg.waveAmp);
        gl.uniform2f(uWaveFreq, cfg.waveFreqX, cfg.waveFreqY);
        gl.uniform2f(uWaveSpeed, cfg.waveSpeedX, cfg.waveSpeedY);
        gl.uniform1f(uMouseEnabled, cfg.mouse.enabled ? 1 : 0);
        gl.uniform1f(uMouseRadius, cfg.mouse.radius);
        gl.uniform1f(uMouseWeight, cfg.mouse.weight);
        gl.uniform3f(uMouseColor, mc[0], mc[1], mc[2]);
        gl.uniform1f(uMouseMix, cfg.mouse.mixStrength);
        const gravity = resolveGravityCenter(cfg);
        gl.uniform1f(uCenterX, gravity.x);
        gl.uniform1f(uCenterY, gravity.y);
        pushBlobUniforms(cfg, timeSec, gravity);
    }

    if (config.blobs.length > MAX_BLOBS) {
        console.warn(
            `webglShaderBackground: ${config.blobs.length} blobs configured; only first ${MAX_BLOBS} are used.`
        );
    }

    function renderFrame(/** @type {number} */ now) {
        const t = reducedMotion ? 0 : now * 0.001;
        const base = resolveBaseColor();
        gl.clearColor(base[0], base[1], base[2], 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform3f(uBaseColor, base[0], base[1], base[2]);
        gl.uniform2f(uResolution, canvas.width, canvas.height);
        gl.uniform2f(uMouse, mouse.x, mouse.y);
        gl.uniform1f(uTime, t);
        applyShaderUniforms(config, t);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        const w = gl.drawingBufferWidth;
        const h = gl.drawingBufferHeight;
        while (captureResolvers.length > 0) {
            const resolve = captureResolvers.shift();
            if (!resolve) continue;
            void framebufferToPngBlob(gl, w, h).then(resolve);
        }
    }

    function render(/** @type {number} */ now) {
        raf = window.requestAnimationFrame(render);
        if (paused) {
            return;
        }
        if (now - lastFrameMs < minFrameIntervalMs) {
            return;
        }
        lastFrameMs = now;
        renderFrame(now);
        onAfterRender?.(now);
    }

    /** @type {ResizeObserver | null} */
    let resizeObserver = null;
    if (mount === 'content' && typeof ResizeObserver !== 'undefined') {
        const host = canvas.parentElement;
        if (host) {
            resizeObserver = new ResizeObserver(() => scheduleResize());
            resizeObserver.observe(host);
        }
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', scheduleResize);
    document.addEventListener('visibilitychange', onVisibilityChange);
    motionMq?.addEventListener('change', onMotionPreference);
    resize();
    raf = window.requestAnimationFrame(render);

    return {
        destroy() {
            window.cancelAnimationFrame(raf);
            if (resizeRaf) cancelAnimationFrame(resizeRaf);
            resizeRaf = 0;
            resizeObserver?.disconnect();
            resizeObserver = null;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('resize', scheduleResize);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            motionMq?.removeEventListener('change', onMotionPreference);
            while (captureResolvers.length > 0) {
                const r = captureResolvers.shift();
                r?.(null);
            }
            removeThemeColorProbe();
            gl.deleteBuffer(buffer);
            gl.deleteProgram(program);
        },
        capturePng() {
            return new Promise((resolve) => {
                captureResolvers.push(resolve);
            });
        },
    };
}
