import { createGlProgram, randomInRange } from './canvasUtils';

/** @typedef {import('./gridParticleField.d.ts').GridParticleFieldOptions} GridParticleFieldOptions */

const FLOATS_PER_POINT = 6;

const VERTEX_SHADER = `
  precision mediump float;

  attribute vec2 a_position;
  attribute float a_breathePhase;
  attribute float a_breatheSpeed;
  attribute float a_breatheMin;
  attribute float a_breatheMax;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_pointSize;

  varying float v_breatheMul;
  varying vec2 v_position;

  void main() {
    vec2 clip = (a_position / u_resolution) * 2.0 - 1.0;
    clip.y = -clip.y;
    gl_Position = vec4(clip, 0.0, 1.0);
    gl_PointSize = u_pointSize;

    float osc = 0.5 + 0.5 * sin(u_time * a_breatheSpeed + a_breathePhase);
    v_breatheMul = a_breatheMin + (a_breatheMax - a_breatheMin) * osc;
    v_position = a_position;
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;

  uniform sampler2D u_blobTexture;
  uniform vec2 u_resolution;
  uniform vec3 u_baseColor;
  uniform vec3 u_dotColor;
  uniform float u_maxAlpha;
  uniform float u_revealGain;
  uniform float u_revealThreshold;
  uniform vec2 u_mouse;
  uniform float u_interactionRadius;
  uniform float u_mouseBrighten;

  varying float v_breatheMul;
  varying vec2 v_position;

  float smoothReveal(float diff) {
    if (diff <= u_revealThreshold) return 0.0;
    return clamp((diff - u_revealThreshold) * u_revealGain, 0.0, 1.0);
  }

  void main() {
    vec2 pointCoord = gl_PointCoord - vec2(0.5);
    float roundDist = length(pointCoord);
    float roundMask = 1.0 - smoothstep(0.46, 0.5, roundDist);
    if (roundMask <= 0.001) discard;

    vec2 texUv = vec2(
      v_position.x / u_resolution.x,
      1.0 - v_position.y / u_resolution.y
    );
    vec3 blobRgb = texture2D(u_blobTexture, texUv).rgb;
    float reveal = smoothReveal(length(blobRgb - u_baseColor));
    if (reveal <= 0.001) discard;

    float dist = distance(v_position, u_mouse);
    float mouseBoost = 0.0;
    if (dist < u_interactionRadius) {
      float t = clamp(1.0 - dist / u_interactionRadius, 0.0, 1.0);
      mouseBoost = t * t * (3.0 - 2.0 * t) * u_mouseBrighten;
    }

    float alpha = (reveal * v_breatheMul * u_maxAlpha + mouseBoost * reveal) * roundMask;
    if (alpha <= 0.001) discard;

    gl_FragColor = vec4(u_dotColor, alpha);
  }
`;

/**
 * Second render pass on the blob WebGL context — samples the framebuffer via copyTexImage2D.
 * @param {WebGLRenderingContext} gl
 * @param {Partial<GridParticleFieldOptions>} options
 */
export function createWebglParticlePass(gl, options) {
    const settings = { ...options };
    const program = createGlProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    if (!program) {
        console.warn('Particle pass shader failed to link.');
        return null;
    }

    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uPointSize = gl.getUniformLocation(program, 'u_pointSize');
    const uBlobTexture = gl.getUniformLocation(program, 'u_blobTexture');
    const uBaseColor = gl.getUniformLocation(program, 'u_baseColor');
    const uDotColor = gl.getUniformLocation(program, 'u_dotColor');
    const uMaxAlpha = gl.getUniformLocation(program, 'u_maxAlpha');
    const uRevealGain = gl.getUniformLocation(program, 'u_revealGain');
    const uRevealThreshold = gl.getUniformLocation(program, 'u_revealThreshold');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');
    const uInteractionRadius = gl.getUniformLocation(program, 'u_interactionRadius');
    const uMouseBrighten = gl.getUniformLocation(program, 'u_mouseBrighten');

    const aPosition = gl.getAttribLocation(program, 'a_position');
    const aBreathePhase = gl.getAttribLocation(program, 'a_breathePhase');
    const aBreatheSpeed = gl.getAttribLocation(program, 'a_breatheSpeed');
    const aBreatheMin = gl.getAttribLocation(program, 'a_breatheMin');
    const aBreatheMax = gl.getAttribLocation(program, 'a_breatheMax');

    const pointBuffer = gl.createBuffer();
    const blobTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, blobTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.useProgram(program);
    const dot = settings.dotRgb ?? { r: 255, g: 255, b: 255 };
    gl.uniform3f(uDotColor, dot.r / 255, dot.g / 255, dot.b / 255);
    gl.uniform1f(uMaxAlpha, settings.alpha ?? 0.72);
    gl.uniform1f(uRevealGain, settings.revealGain ?? 5.5);
    gl.uniform1f(uRevealThreshold, settings.revealThreshold ?? 0.012);
    gl.uniform1f(uInteractionRadius, settings.interactionRadius ?? 80);
    gl.uniform1f(uMouseBrighten, settings.mouseBrighten ?? 0.38);
    gl.uniform1i(uBlobTexture, 0);

    let pointCount = 0;
    let cssW = 1;
    let cssH = 1;
    let dpr = 1;
    const stride = FLOATS_PER_POINT * 4;

    function bindVertexAttributes() {
        gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(aBreathePhase);
        gl.vertexAttribPointer(aBreathePhase, 1, gl.FLOAT, false, stride, 8);
        gl.enableVertexAttribArray(aBreatheSpeed);
        gl.vertexAttribPointer(aBreatheSpeed, 1, gl.FLOAT, false, stride, 12);
        gl.enableVertexAttribArray(aBreatheMin);
        gl.vertexAttribPointer(aBreatheMin, 1, gl.FLOAT, false, stride, 16);
        gl.enableVertexAttribArray(aBreatheMax);
        gl.vertexAttribPointer(aBreatheMax, 1, gl.FLOAT, false, stride, 20);
    }

    function buildGrid() {
        const spacing = settings.spacing ?? 14;
        const data = [];

        for (let y = spacing / 2; y < cssH; y += spacing) {
            for (let x = spacing / 2; x < cssW; x += spacing) {
                const floor = randomInRange(
                    settings.breatheOpacityMin ?? 0.03,
                    (settings.breatheOpacityMin ?? 0.03) + 0.04
                );
                const ceiling = randomInRange(
                    (settings.breatheOpacityMax ?? 0.58) - 0.1,
                    settings.breatheOpacityMax ?? 0.58
                );
                data.push(
                    x,
                    y,
                    Math.random() * Math.PI * 2,
                    randomInRange(settings.breatheSpeedMin ?? 0.12, settings.breatheSpeedMax ?? 0.26),
                    floor,
                    Math.max(ceiling, floor + 0.12)
                );
            }
        }

        pointCount = data.length / FLOATS_PER_POINT;
        gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        bindVertexAttributes();
    }

    return {
        /** @param {number} width @param {number} height @param {number} pixelRatio */
        resize(width, height, pixelRatio) {
            cssW = Math.max(0, width);
            cssH = Math.max(0, height);
            dpr = pixelRatio;
            gl.useProgram(program);
            gl.uniform2f(uResolution, Math.max(cssW, 1), Math.max(cssH, 1));
            gl.uniform1f(uPointSize, (settings.size ?? 1.75) * dpr * 2);
            buildGrid();
        },

        /**
         * @param {{ timeSec: number; mouseX: number; mouseY: number; baseColor: [number, number, number] }} frame
         */
        render(frame) {
            if (pointCount === 0) return;

            const w = gl.drawingBufferWidth;
            const h = gl.drawingBufferHeight;

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, blobTexture);
            // Default framebuffer is RGB when the context is created with alpha: false.
            gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGB, 0, 0, w, h, 0);

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.useProgram(program);
            bindVertexAttributes();

            gl.uniform1f(uTime, frame.timeSec);
            gl.uniform3f(uBaseColor, frame.baseColor[0], frame.baseColor[1], frame.baseColor[2]);
            gl.uniform2f(uMouse, frame.mouseX, frame.mouseY);

            gl.drawArrays(gl.POINTS, 0, pointCount);
        },

        destroy() {
            gl.deleteBuffer(pointBuffer);
            gl.deleteTexture(blobTexture);
            gl.deleteProgram(program);
        },
    };
}
