// function cssColorToRgba(color, alpha) {
//   const s = String(color).trim();
//   if (s.startsWith("#")) {
//     const h = s.slice(1);
//     const full =
//       h.length === 3 ? [...h].map((c) => c + c).join("") : h.padEnd(6, "0");
//     const r = parseInt(full.slice(0, 2), 16);
//     const g = parseInt(full.slice(2, 4), 16);
//     const b = parseInt(full.slice(4, 6), 16);
//     return `rgba(${r},${g},${b},${alpha})`;
//   }
//   const m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
//   if (m) {
//     return `rgba(${m[1]},${m[2]},${m[3]},${alpha})`;
//   }
//   return null;
// }

function coerceSetting(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function smoothstep01(t) {
    const x = clamp(t, 0, 1);
    return x * x * (3 - 2 * x);
}

/** @param {string} raw */
function parseCssColorToRgb255(raw) {
    const s = String(raw).trim();
    if (!s) return null;
    if (s.startsWith('#')) {
        const h = s.slice(1);
        const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h.padEnd(6, '0');
        return {
            r: parseInt(full.slice(0, 2), 16),
            g: parseInt(full.slice(2, 4), 16),
            b: parseInt(full.slice(4, 6), 16),
        };
    }
    const m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
    if (!m) return null;
    return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
}

/** @param {number} min @param {number} max */
function randomInRange(min, max) {
    return min + Math.random() * (max - min);
}

/** @type {number[] | null} */
let perlinPerm = null;

/** Deterministic permutation table for 2D Perlin (stable across reloads). */
function initPerlinPerm() {
    if (perlinPerm) return;
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    let seed = 12345;
    for (let i = 255; i > 0; i--) {
        seed = (seed * 16807) % 2147483647;
        const j = seed % (i + 1);
        const tmp = p[i];
        p[i] = p[j];
        p[j] = tmp;
    }
    perlinPerm = new Array(512);
    for (let i = 0; i < 512; i++) perlinPerm[i] = p[i & 255];
}

/** @param {number} t */
function perlinFade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

/** @param {number} a @param {number} b @param {number} t */
function perlinLerp(a, b, t) {
    return a + t * (b - a);
}

/** @param {number} hash @param {number} x @param {number} y */
function perlinGrad2(hash, x, y) {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return (h & 1 ? -u : u) + (h & 2 ? -v : v);
}

/**
 * 2D Perlin noise in [0, 1]. Higher input coordinates = finer grain; divide pixel
 * coords by `opacityNoiseSize` for feature size in px.
 * @param {number} x
 * @param {number} y
 */
function perlin2d01(x, y) {
    initPerlinPerm();
    const perm = /** @type {number[]} */ (perlinPerm);
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = perlinFade(xf);
    const v = perlinFade(yf);
    const aa = perm[perm[xi] + yi];
    const ab = perm[perm[xi] + yi + 1];
    const ba = perm[perm[xi + 1] + yi];
    const bb = perm[perm[xi + 1] + yi + 1];
    const n = perlinLerp(
        perlinLerp(perlinGrad2(aa, xf, yf), perlinGrad2(ba, xf - 1, yf), u),
        perlinLerp(perlinGrad2(ab, xf, yf - 1), perlinGrad2(bb, xf - 1, yf - 1), u),
        v
    );
    return (n + 1) * 0.5;
}

/** Intro content-area particle grid (used by `LumoInput` via `createGridParticleField`). */
export const DEFAULT_GRID_PARTICLE_FIELD_OPTIONS = {
    spacing: 12,
    size: 1,
    alpha: 1,
    ease: 12,
    interactionRadius: 240,
    repelStrength: 8,
    denseAroundInput: false,
    sparseAroundInput: false,
    focusTarget: 'lumo-input-wrapper',
    focusPadding: 4,
    focusSpacing: 6,
    transitionPadding: 24,
    /**
     * Perlin-driven opacity variation (noise is not drawn). Pixel scale of the field:
     * larger = broader bright/dim regions. `0` = every dot uses full `alpha`.
     * Per-dot opacity = `alpha` × remapped noise (see `opacityNoiseContrast`).
     */
    opacityNoiseSize: 80,
    /**
     * Stretches noise toward 0 and 1 (`1` = raw Perlin, `~3` = strong: many dots at full
     * `alpha`, many near invisible). Only applies when `opacityNoiseSize` > 0.
     */
    opacityNoiseContrast: 2,
    /**
     * When set, dots are revealed only where this canvas (blob layer) has color
     * beneath them — white dots, per-dot breathe, mouse brighten (no fisheye repel).
     */
    maskSourceCanvas: null,
    /** CSS var for the plain background color (used to measure blob tint for reveal). */
    baseColorCssVar: '--background-main-canvas',
    /** Peak extra opacity added near the cursor (smooth falloff). */
    mouseBrighten: 0.55,
    /** Per-dot breathe speed range (rad/s); keep slow so motion stays ambient. */
    breatheSpeedMin: 0.12,
    breatheSpeedMax: 0.26,
    /** Per-dot opacity floor during breathe (near-invisible at the trough). */
    breatheOpacityMin: 0.03,
    /** Per-dot opacity ceiling during breathe (soft peak, not full strength). */
    breatheOpacityMax: 0.58,
    /** Multiplier on color distance from base before clamping to [0, 1]. */
    revealGain: 5.5,
    /** Ignore tiny compression/noise on the plain background. */
    revealThreshold: 0.012,
    /** Dot color when `maskSourceCanvas` is set (defaults to white). */
    dotRgb: { r: 255, g: 255, b: 255 },
    /** Legacy mode dot color token on `:root`. */
    colorCssVar: '--surface-foreground',
    /** Chat mode dot color token (see `CONTENT_GRID_CHAT_COLOR_CSS_VAR` in `site.js`). */
    colorCssVarChat: '--border-default',
};

const D = DEFAULT_GRID_PARTICLE_FIELD_OPTIONS;

/**
 * @param {Partial<typeof DEFAULT_GRID_PARTICLE_FIELD_OPTIONS>} [partial]
 */
export function mergeGridParticleFieldOptions(partial = {}) {
    const o = { ...D, ...partial };
    return {
        spacing: Math.max(4, coerceSetting(o.spacing, D.spacing)),
        size: Math.max(0.5, coerceSetting(o.size, D.size)),
        alpha: clamp(coerceSetting(o.alpha, D.alpha), 0, 1),
        ease: Math.max(1, coerceSetting(o.ease, D.ease)),
        interactionRadius: Math.max(1, coerceSetting(o.interactionRadius, D.interactionRadius)),
        repelStrength: Math.max(0, coerceSetting(o.repelStrength, D.repelStrength)),
        denseAroundInput: Boolean(o.denseAroundInput),
        sparseAroundInput: Boolean(o.sparseAroundInput),
        focusTarget:
            o.focusTarget === 'input-container'
                ? 'input-container'
                : o.focusTarget === 'lumo-input-container'
                  ? 'lumo-input-container'
                  : 'lumo-input-wrapper',
        focusPadding: Math.max(0, coerceSetting(o.focusPadding, D.focusPadding)),
        focusSpacing: Math.max(4, coerceSetting(o.focusSpacing, D.focusSpacing)),
        transitionPadding: Math.max(0, coerceSetting(o.transitionPadding, D.transitionPadding)),
        opacityNoiseSize: Math.max(0, coerceSetting(o.opacityNoiseSize, D.opacityNoiseSize)),
        opacityNoiseContrast: Math.max(1, coerceSetting(o.opacityNoiseContrast, D.opacityNoiseContrast)),
        maskSourceCanvas: o.maskSourceCanvas ?? null,
        baseColorCssVar: String(o.baseColorCssVar || D.baseColorCssVar).trim(),
        mouseBrighten: clamp(coerceSetting(o.mouseBrighten, D.mouseBrighten), 0, 1),
        breatheSpeedMin: Math.max(0.05, coerceSetting(o.breatheSpeedMin, D.breatheSpeedMin)),
        breatheSpeedMax: Math.max(0.05, coerceSetting(o.breatheSpeedMax, D.breatheSpeedMax)),
        breatheOpacityMin: clamp(coerceSetting(o.breatheOpacityMin, D.breatheOpacityMin), 0, 1),
        breatheOpacityMax: clamp(coerceSetting(o.breatheOpacityMax, D.breatheOpacityMax), 0, 1),
        revealGain: Math.max(0, coerceSetting(o.revealGain, D.revealGain)),
        revealThreshold: clamp(coerceSetting(o.revealThreshold, D.revealThreshold), 0, 1),
        dotRgb: o.dotRgb ?? D.dotRgb,
        colorCssVar: String(o.colorCssVar || D.colorCssVar).trim(),
        colorCssVarChat: String(o.colorCssVarChat || D.colorCssVarChat).trim(),
    };
}

export class GridParticleField {
    /**
     * @param {HTMLCanvasElement} el
     * @param {Partial<typeof DEFAULT_GRID_PARTICLE_FIELD_OPTIONS>} [options]
     */
    constructor(el, options = {}) {
        this.canvas = el;
        if (!this.canvas) return;

        this.root = this.canvas.parentElement;
        this.context = this.canvas.getContext('2d');
        this.dpr = window.devicePixelRatio || 1;
        this.settings = mergeGridParticleFieldOptions(options);
        this.revealMode = Boolean(this.settings.maskSourceCanvas);
        /** @type {boolean} */
        this._chatColorMode = false;
        this.points = [];
        this.mouse = { x: 0, y: 0, active: false };
        this.canvasSize = { w: 0, h: 0 };
        this.rafId = 0;
        this._disposed = false;
        this._resizeObserver = null;
        this._resizeRaf = 0;
        /** @type {{ r: number; g: number; b: number } | null} */
        this._particleRgb = null;
        /** @type {ImageData | null} */
        this._maskImageData = null;
        /** @type {{ r: number; g: number; b: number }} */
        this._baseRgb255 = { r: 255, g: 255, b: 255 };
        this._maskReadCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
        this._maskReadCtx = this._maskReadCanvas?.getContext('2d', { willReadFrequently: true }) ?? null;

        this.onMouseMove = this.onMouseMove.bind(this);
        this.initCanvas = this.initCanvas.bind(this);
        this.onContentResize = this.onContentResize.bind(this);
        this.resizeCanvas = this.resizeCanvas.bind(this);
        this.clearContext = this.clearContext.bind(this);
        this.drawDot = this.drawDot.bind(this);
        this.buildGrid = this.buildGrid.bind(this);
        this.getFocusRect = this.getFocusRect.bind(this);
        this.isInsideRect = this.isInsideRect.bind(this);
        this.distanceToRect = this.distanceToRect.bind(this);
        this.getDensityMix = this.getDensityMix.bind(this);
        this.shouldKeepDensePoint = this.shouldKeepDensePoint.bind(this);
        this.updateMaskSample = this.updateMaskSample.bind(this);
        this.getRevealAt = this.getRevealAt.bind(this);
        this.getBreatheMul = this.getBreatheMul.bind(this);
        this.getMouseBrighten = this.getMouseBrighten.bind(this);
        this.animateReveal = this.animateReveal.bind(this);
        this.animateLegacy = this.animateLegacy.bind(this);
        this.animate = this.animate.bind(this);

        this.init();
    }

    init() {
        if (!this.canvas) return;
        this.initCanvas();
        this.animate();
        /** Programmatic `window.dispatchEvent(new Event("resize"))` and viewport changes. */
        window.addEventListener('resize', this.onContentResize);
        if (typeof ResizeObserver !== 'undefined' && this.root) {
            this._resizeObserver = new ResizeObserver(this.onContentResize);
            this._resizeObserver.observe(this.root);
            const inputWrap = this.root.querySelector('.input-wrapper');
            if (inputWrap) {
                this._resizeObserver.observe(inputWrap);
            }
            const focusEl = this.root.querySelector(`.${this.settings.focusTarget}`);
            if (focusEl) {
                this._resizeObserver.observe(focusEl);
            }
        }
        window.addEventListener('mousemove', this.onMouseMove);
    }

    onContentResize() {
        if (this._disposed) return;
        if (this._resizeRaf) {
            cancelAnimationFrame(this._resizeRaf);
        }
        this._resizeRaf = requestAnimationFrame(() => {
            this._resizeRaf = 0;
            this.initCanvas();
        });
    }

    initCanvas() {
        this.resizeCanvas();
        this.buildGrid();
    }

    onMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = event.clientX - rect.left;
        this.mouse.y = event.clientY - rect.top;
        this.mouse.active = true;
    }

    resizeCanvas() {
        if (!this.root || !this.context) return;
        this.canvasSize.w = this.root.offsetWidth;
        this.canvasSize.h = this.root.offsetHeight;
        this.canvas.width = this.canvasSize.w * this.dpr;
        this.canvas.height = this.canvasSize.h * this.dpr;
        this.canvas.style.width = `${this.canvasSize.w}px`;
        this.canvas.style.height = `${this.canvasSize.h}px`;
        this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    clearContext() {
        this.context.clearRect(0, 0, this.canvasSize.w, this.canvasSize.h);
    }

    /**
     * Maps raw Perlin [0, 1] to dot opacity multiplier with contrast toward 0/1.
     * @param {number} n
     */
    mapOpacityNoise(n) {
        const contrast = this.settings.opacityNoiseContrast;
        if (contrast <= 1) return n;
        return clamp(0.5 + (n - 0.5) * contrast, 0, 1);
    }

    /**
     * Perlin sample for dot opacity (0…1). Dark regions → lower opacity when `alpha` < 1.
     * @param {number} x
     * @param {number} y
     */
    getOpacityNoiseMul(x, y) {
        const size = this.settings.opacityNoiseSize;
        if (!size || size <= 0) return 1;
        return this.mapOpacityNoise(perlin2d01(x / size, y / size));
    }

    drawDot(point, alphaOverride) {
        const rgb = this._particleRgb;
        if (!rgb) {
            return;
        }
        const alpha = alphaOverride ?? this.settings.alpha * (point.opacityMul ?? 1);
        if (alpha <= 0.001) {
            return;
        }

        this.context.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
        this.context.beginPath();
        const x = point.x + (point.translateX ?? 0);
        const y = point.y + (point.translateY ?? 0);
        this.context.arc(x, y, this.settings.size, 0, 2 * Math.PI);
        this.context.fill();
    }

    /** @returns {{ r: number; g: number; b: number }} */
    getBaseRgb255() {
        const raw = getComputedStyle(document.documentElement)
            .getPropertyValue(this.settings.baseColorCssVar)
            .trim();
        return parseCssColorToRgb255(raw) ?? { r: 255, g: 255, b: 255 };
    }

    /**
     * @param {number} r @param {number} g @param {number} b
     * @param {{ r: number; g: number; b: number }} base
     */
    computeReveal(r, g, b, base) {
        const dr = (r - base.r) / 255;
        const dg = (g - base.g) / 255;
        const db = (b - base.b) / 255;
        const diff = Math.sqrt(dr * dr + dg * dg + db * db);
        const { revealThreshold, revealGain } = this.settings;
        if (diff <= revealThreshold) {
            return 0;
        }
        return clamp((diff - revealThreshold) * revealGain, 0, 1);
    }

    updateMaskSample() {
        const src = this.settings.maskSourceCanvas;
        if (!src || !this._maskReadCtx || !this._maskReadCanvas) {
            return;
        }

        const w = this.canvasSize.w;
        const h = this.canvasSize.h;
        if (w < 1 || h < 1) {
            return;
        }

        if (this._maskReadCanvas.width !== w || this._maskReadCanvas.height !== h) {
            this._maskReadCanvas.width = w;
            this._maskReadCanvas.height = h;
        }

        this._maskReadCtx.drawImage(src, 0, 0, w, h);
        this._maskImageData = this._maskReadCtx.getImageData(0, 0, w, h);
        this._baseRgb255 = this.getBaseRgb255();
    }

    /** @param {number} x @param {number} y */
    getRevealAt(x, y) {
        if (!this._maskImageData) {
            return 0;
        }

        const w = this.canvasSize.w;
        const h = this.canvasSize.h;
        const ix = clamp(Math.floor(x), 0, w - 1);
        const iy = clamp(Math.floor(y), 0, h - 1);
        const i = (iy * w + ix) * 4;
        const data = this._maskImageData.data;
        return this.computeReveal(data[i], data[i + 1], data[i + 2], this._baseRgb255);
    }

    /** @param {{ breathePhase: number; breatheSpeed: number; breatheMin: number; breatheMax: number }} point @param {number} timeSec */
    getBreatheMul(point, timeSec) {
        const osc = 0.5 + 0.5 * Math.sin(timeSec * point.breatheSpeed + point.breathePhase);
        return point.breatheMin + (point.breatheMax - point.breatheMin) * osc;
    }

    /** @param {number} x @param {number} y */
    getMouseBrighten(x, y) {
        if (!this.mouse.active) {
            return 0;
        }

        const dx = x - this.mouse.x;
        const dy = y - this.mouse.y;
        const distance = Math.hypot(dx, dy);
        const radius = this.settings.interactionRadius;
        if (distance >= radius) {
            return 0;
        }

        return smoothstep01(1 - distance / radius) * this.settings.mouseBrighten;
    }

    /** @param {boolean} [chat] */
    setChatColorMode(chat) {
        this._chatColorMode = Boolean(chat);
    }

    activeColorCssVar() {
        return this._chatColorMode ? this.settings.colorCssVarChat : this.settings.colorCssVar;
    }

    /** @returns {{ r: number; g: number; b: number } | null} */
    getParticleRgb() {
        if (this.revealMode) {
            return this.settings.dotRgb ?? { r: 255, g: 255, b: 255 };
        }

        const raw = getComputedStyle(document.documentElement).getPropertyValue(this.activeColorCssVar()).trim();
        return parseCssColorToRgb255(raw);
    }

    getFocusRect() {
        if ((!this.settings.denseAroundInput && !this.settings.sparseAroundInput) || !this.root) {
            return null;
        }

        const focusTarget = this.root.querySelector(`.${this.settings.focusTarget}`);
        if (!(focusTarget instanceof HTMLElement)) {
            return null;
        }

        const rootRect = this.root.getBoundingClientRect();
        const inputRect = focusTarget.getBoundingClientRect();
        const borderRadius = parseFloat(window.getComputedStyle(focusTarget).borderTopLeftRadius || '0');
        return {
            minX: clamp(inputRect.left - rootRect.left - this.settings.focusPadding, 0, this.canvasSize.w),
            maxX: clamp(inputRect.right - rootRect.left + this.settings.focusPadding, 0, this.canvasSize.w),
            minY: clamp(inputRect.top - rootRect.top - this.settings.focusPadding, 0, this.canvasSize.h),
            maxY: clamp(inputRect.bottom - rootRect.top + this.settings.focusPadding, 0, this.canvasSize.h),
            radius: Math.max(0, borderRadius + this.settings.focusPadding),
        };
    }

    isInsideRect(x, y, rect) {
        return this.distanceToRect(x, y, rect) === 0;
    }

    distanceToRect(x, y, rect) {
        if (!rect) {
            return Infinity;
        }
        const width = rect.maxX - rect.minX;
        const height = rect.maxY - rect.minY;
        const radius = clamp(rect.radius ?? 0, 0, Math.min(width, height) / 2);
        const centerX = (rect.minX + rect.maxX) / 2;
        const centerY = (rect.minY + rect.maxY) / 2;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const innerHalfWidth = Math.max(0, halfWidth - radius);
        const innerHalfHeight = Math.max(0, halfHeight - radius);
        const qx = Math.abs(x - centerX) - innerHalfWidth;
        const qy = Math.abs(y - centerY) - innerHalfHeight;
        const outsideX = Math.max(qx, 0);
        const outsideY = Math.max(qy, 0);
        const outsideDistance = Math.hypot(outsideX, outsideY) - radius;
        return Math.max(0, outsideDistance);
    }

    getDensityMix(x, y, focusRect) {
        if (!focusRect) {
            return 0;
        }

        if (this.isInsideRect(x, y, focusRect)) {
            return 1;
        }

        if (this.settings.transitionPadding <= 0) {
            return 0;
        }

        const distance = this.distanceToRect(x, y, focusRect);
        if (distance >= this.settings.transitionPadding) {
            return 0;
        }

        const normalized = 1 - distance / this.settings.transitionPadding;
        return normalized * normalized * (3 - 2 * normalized);
    }

    shouldKeepDensePoint(x, y, focusRect) {
        const denseStep = this.settings.focusSpacing;
        const coarseStep = this.settings.spacing;
        const coarseModX = Math.round((x - denseStep / 2) / denseStep);
        const coarseModY = Math.round((y - denseStep / 2) / denseStep);
        const coarseRatio = Math.max(1, Math.round(coarseStep / denseStep));
        const onCoarseGrid = coarseModX % coarseRatio === 0 && coarseModY % coarseRatio === 0;

        if (onCoarseGrid) {
            return true;
        }

        const mix = this.getDensityMix(x, y, focusRect);
        if (mix <= 0) {
            return false;
        }

        const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        const noise = hash - Math.floor(hash);
        return noise < mix;
    }

    shouldSkipSparsePoint(x, y, focusRect) {
        if (!this.settings.sparseAroundInput || !focusRect) {
            return false;
        }

        return this.distanceToRect(x, y, focusRect) < this.settings.transitionPadding;
    }

    buildGrid() {
        this.points = [];
        const focusRect = this.getFocusRect();
        const baseStep = this.settings.denseAroundInput ? this.settings.focusSpacing : this.settings.spacing;

        for (let y = baseStep / 2; y < this.canvasSize.h; y += baseStep) {
            for (let x = baseStep / 2; x < this.canvasSize.w; x += baseStep) {
                if (this.settings.denseAroundInput && !this.shouldKeepDensePoint(x, y, focusRect)) {
                    continue;
                }
                if (this.shouldSkipSparsePoint(x, y, focusRect)) {
                    continue;
                }

                const point = {
                    x,
                    y,
                    translateX: 0,
                    translateY: 0,
                    opacityMul: this.revealMode ? 1 : this.getOpacityNoiseMul(x, y),
                };

                if (this.revealMode) {
                    point.breathePhase = Math.random() * Math.PI * 2;
                    point.breatheSpeed = randomInRange(
                        this.settings.breatheSpeedMin,
                        this.settings.breatheSpeedMax
                    );
                    const floor = randomInRange(
                        this.settings.breatheOpacityMin,
                        this.settings.breatheOpacityMin + 0.04
                    );
                    const ceiling = randomInRange(
                        this.settings.breatheOpacityMax - 0.1,
                        this.settings.breatheOpacityMax
                    );
                    point.breatheMin = floor;
                    point.breatheMax = Math.max(ceiling, floor + 0.12);
                }

                this.points.push(point);
            }
        }
    }

    animateReveal() {
        this.updateMaskSample();
        this._particleRgb = this.getParticleRgb();
        if (!this._particleRgb) {
            return;
        }

        const timeSec = performance.now() * 0.001;
        const maxAlpha = this.settings.alpha;

        for (const point of this.points) {
            const reveal = this.getRevealAt(point.x, point.y);
            const breathe = this.getBreatheMul(point, timeSec);
            const mouseBoost = this.getMouseBrighten(point.x, point.y);
            const alpha = clamp(reveal * breathe * maxAlpha + mouseBoost * reveal, 0, 1);
            this.drawDot(point, alpha);
        }
    }

    animateLegacy() {
        this._particleRgb = this.getParticleRgb();
        if (!this._particleRgb) {
            return;
        }

        for (const point of this.points) {
            let targetX = 0;
            let targetY = 0;

            if (this.mouse.active) {
                const renderedX = point.x + point.translateX;
                const renderedY = point.y + point.translateY;
                const dx = renderedX - this.mouse.x;
                const dy = renderedY - this.mouse.y;
                const distance = Math.hypot(dx, dy);

                if (distance > 0.001 && distance < this.settings.interactionRadius) {
                    const falloff = 1 - distance / this.settings.interactionRadius;
                    const strength = falloff * falloff * this.settings.repelStrength;
                    targetX = (dx / distance) * strength;
                    targetY = (dy / distance) * strength;
                }
            }

            point.translateX += (targetX - point.translateX) / this.settings.ease;
            point.translateY += (targetY - point.translateY) / this.settings.ease;
            this.drawDot(point);
        }
    }

    animate() {
        if (this._disposed || !this.canvas) return;

        this.clearContext();
        if (this.revealMode) {
            this.animateReveal();
        } else {
            this.animateLegacy();
        }

        this.rafId = window.requestAnimationFrame(this.animate);
    }

    destroy() {
        if (this._disposed) return;
        this._disposed = true;
        cancelAnimationFrame(this.rafId);
        if (this._resizeRaf) {
            cancelAnimationFrame(this._resizeRaf);
            this._resizeRaf = 0;
        }
        this._resizeObserver?.disconnect();
        this._resizeObserver = null;
        window.removeEventListener('resize', this.onContentResize);
        window.removeEventListener('mousemove', this.onMouseMove);
        this.points.length = 0;
    }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Partial<typeof DEFAULT_GRID_PARTICLE_FIELD_OPTIONS>} [options]
 */
export function createGridParticleField(canvas, options) {
    let animation = null;
    const resolvedOptions = options ?? {};

    return {
        init() {
            if (!animation) {
                animation = new GridParticleField(canvas, resolvedOptions);
            }
        },
        /** @param {boolean} chat */
        setChatColorMode(chat) {
            animation?.setChatColorMode(chat);
        },
        destroy() {
            animation?.destroy();
            animation = null;
        },
    };
}
