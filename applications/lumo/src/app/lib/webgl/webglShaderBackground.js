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
 * @property {number} radius fallback for {@link radiusX} / {@link radiusY}
 * @property {number} [radiusX] half-extent along aspect-corrected x (defaults to `radius`)
 * @property {number} [radiusY] half-extent along y (defaults to `radius`)
 * @property {"left-bottom" | "right-bottom"} [corner] pin to `.content` corner (aspect-corrected UV)
 * @property {number} [weight]
 * @property {[number, number, number]} color RGB 0–1
 * @property {number} [mixStrength]
 * @property {number} [driftY] amplitude for `sin(time * speed + i)` vertical wobble (UV space)
 */

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
      precision highp float;
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
          pos.y += sin(t + fi * 0.7) * u_blobDriftY[i];
          vec2 radii = vec2(u_blobRadiusX[i], u_blobRadiusY[i]);
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

        color += pow(max(shape, 0.0001), u_glowPower) * u_glowIntensity;

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

/** @typedef {"viewport" | "content"} WebglShaderBgMount */

/**
 * @param {HTMLCanvasElement} canvas
 * @param {WebglShaderBgConfig} [userConfig]
 * @param {{ mount?: WebglShaderBgMount; baseCssVar?: string | null }} [runtime]
 * @returns {{
 *   destroy: () => void;
 *   capturePng: () => Promise<Blob | null>;
 * }}
 */
export function createWebglShaderBackground(canvas, userConfig, runtime = {}) {
    const config = mergeConfig(userConfig);
    const mount = runtime.mount === 'content' ? 'content' : 'viewport';
    const baseCssVar = runtime.baseCssVar ?? null;
    const gl = canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
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
    for (let i = 0; i < MAX_BLOBS; i++) {
        uBlobPos.push(gl.getUniformLocation(program, `u_blobPos[${i}]`));
        uBlobRadiusX.push(gl.getUniformLocation(program, `u_blobRadiusX[${i}]`));
        uBlobRadiusY.push(gl.getUniformLocation(program, `u_blobRadiusY[${i}]`));
        uBlobWeight.push(gl.getUniformLocation(program, `u_blobWeight[${i}]`));
        uBlobColor.push(gl.getUniformLocation(program, `u_blobColor[${i}]`));
        uBlobMix.push(gl.getUniformLocation(program, `u_blobMix[${i}]`));
        uBlobDriftY.push(gl.getUniformLocation(program, `u_blobDriftY[${i}]`));
    }

    const mouse = { x: 0, y: 0 };
    /** @type {((blob: Blob | null) => void)[]} */
    const captureResolvers = [];
    let raf = 0;
    let reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /** @param {MediaQueryListEvent} e */
    function onMotionPreference(e) {
        reducedMotion = e.matches;
    }
    const motionMq = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

    function onMouseMove(/** @type {MouseEvent} */ event) {
        const dpr = window.devicePixelRatio || 1;
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
        const dpr = window.devicePixelRatio || 1;
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

    /** @param {ReturnType<typeof mergeConfig>} cfg */
    function pushBlobUniforms(cfg) {
        const blobs = cfg.blobs.slice(0, MAX_BLOBS);
        const count = blobs.length;
        gl.uniform1i(uBlobCount, count);
        for (let i = 0; i < MAX_BLOBS; i++) {
            const b = blobs[i];
            if (b) {
                const p = resolveBlobPlacement(b);
                gl.uniform2f(uBlobPos[i], p.x, p.y);
                gl.uniform1f(uBlobRadiusX[i], p.radiusX);
                gl.uniform1f(uBlobRadiusY[i], p.radiusY);
                gl.uniform1f(uBlobWeight[i], b.weight ?? 1);
                const c = b.color;
                gl.uniform3f(uBlobColor[i], c[0], c[1], c[2]);
                gl.uniform1f(uBlobMix[i], b.mixStrength ?? 0.6);
                gl.uniform1f(uBlobDriftY[i], b.driftY ?? 0);
            } else {
                gl.uniform2f(uBlobPos[i], 0, 0);
                gl.uniform1f(uBlobRadiusX[i], 0.0001);
                gl.uniform1f(uBlobRadiusY[i], 0.0001);
                gl.uniform1f(uBlobWeight[i], 0);
                gl.uniform3f(uBlobColor[i], 0, 0, 0);
                gl.uniform1f(uBlobMix[i], 0);
                gl.uniform1f(uBlobDriftY[i], 0);
            }
        }
    }

    /** @param {ReturnType<typeof mergeConfig>} cfg */
    function applyShaderUniforms(cfg) {
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
        pushBlobUniforms(cfg);
    }

    if (config.blobs.length > MAX_BLOBS) {
        console.warn(
            `webglShaderBackground: ${config.blobs.length} blobs configured; only first ${MAX_BLOBS} are used.`
        );
    }

    function renderFrame(/** @type {number} */ now) {
        const t = reducedMotion ? 0 : now * 0.001;
        const base = readCssVarRgb01(baseCssVar, themeBaseColorFallback(config.baseColor));
        gl.clearColor(base[0], base[1], base[2], 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform3f(uBaseColor, base[0], base[1], base[2]);
        gl.uniform2f(uResolution, canvas.width, canvas.height);
        gl.uniform2f(uMouse, mouse.x, mouse.y);
        gl.uniform1f(uTime, t);
        applyShaderUniforms(config);
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
        renderFrame(now);
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
            window.removeEventListener('resize', resize);
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
