export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function smoothstep01(t) {
    const x = clamp(t, 0, 1);
    return x * x * (3 - 2 * x);
}

/** @param {number} rawDpr @param {number} maxDpr */
export function effectiveDpr(rawDpr, maxDpr) {
    const cap = Number(maxDpr);
    if (!Number.isFinite(cap) || cap <= 0) {
        return rawDpr;
    }
    return Math.min(rawDpr, cap);
}

/** @param {string} raw */
export function parseCssColorToRgb255(raw) {
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
export function randomInRange(min, max) {
    return min + Math.random() * (max - min);
}

/** @param {{ r: number; g: number; b: number }} rgb */
export function rgb255To01(rgb) {
    return [rgb.r / 255, rgb.g / 255, rgb.b / 255];
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {number} type
 * @param {string} source
 */
export function compileGlShader(gl, type, source) {
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

/**
 * @param {WebGLRenderingContext} gl
 * @param {string} vsSource
 * @param {string} fsSource
 */
export function createGlProgram(gl, vsSource, fsSource) {
    const vs = compileGlShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = compileGlShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return null;

    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}
