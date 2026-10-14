// Derived from @livekit/track-processors 0.8.1 (Apache-2.0), src/webgl.
import type { PipelineLogger } from './types';

const GAUSSIAN_MAX_RADIUS = 16;
const GAUSSIAN_MAX_TAPS = 1 + Math.ceil(GAUSSIAN_MAX_RADIUS / 2);

const DOWNSAMPLE_FACTOR = 4;

const MASK_BLUR_RADIUS = 8;

const MASK_BUFFER_TARGET_EDGE = 640;

type CompositorCanvas = OffscreenCanvas | HTMLCanvasElement;

export interface Compositor {
    gl: WebGL2RenderingContext;
    renderFrame: (frame: VideoFrame) => void;
    updateMask: (mask: WebGLTexture) => void;
    setBackgroundImage: (image: ImageBitmap | null) => Promise<void>;
    setBlurRadius: (radius: number | null) => void;
    cleanup: () => void;
}

const createShader = (gl: WebGL2RenderingContext, type: number, source: string): WebGLShader => {
    const shader = gl.createShader(type);
    if (!shader) {
        throw new Error('Failed to create shader');
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Shader compile failed: ${info}`);
    }
    return shader;
};

const createProgram = (gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram => {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    if (!program) {
        throw new Error('Failed to create program');
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error(`Program link failed: ${info}`);
    }
    return program;
};

const initTexture = (gl: WebGL2RenderingContext, unit: number): WebGLTexture => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    const texture = gl.createTexture();
    if (!texture) {
        throw new Error('Failed to create texture');
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return texture;
};

const resizeTexture = (gl: WebGL2RenderingContext, texture: WebGLTexture, width: number, height: number) => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
};

const createFramebuffer = (
    gl: WebGL2RenderingContext,
    texture: WebGLTexture,
    width: number,
    height: number
): WebGLFramebuffer => {
    const framebuffer = gl.createFramebuffer();
    if (!framebuffer) {
        throw new Error('Failed to create framebuffer');
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    resizeTexture(gl, texture, width, height);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
        throw new Error('Framebuffer not complete');
    }
    return framebuffer;
};

const createVertexBuffer = (gl: WebGL2RenderingContext): WebGLBuffer => {
    const vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        throw new Error('Failed to create vertex buffer');
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    return vertexBuffer;
};

const resizeImageToCover = (image: ImageBitmap, targetWidth: number, targetHeight: number) => {
    const imageAspect = image.width / image.height;
    const targetAspect = targetWidth / targetHeight;
    let sx = 0;
    let sy = 0;
    let sWidth = image.width;
    let sHeight = image.height;
    if (imageAspect > targetAspect) {
        sWidth = Math.round(image.height * targetAspect);
        sx = Math.round((image.width - sWidth) / 2);
    } else if (imageAspect < targetAspect) {
        sHeight = Math.round(image.width / targetAspect);
        sy = Math.round((image.height - sHeight) / 2);
    }
    return createImageBitmap(image, sx, sy, sWidth, sHeight, {
        resizeWidth: targetWidth,
        resizeHeight: targetHeight,
        resizeQuality: 'medium',
    });
};

let emptyImageData: ImageData | undefined;
const getEmptyImageData = () => {
    emptyImageData ??= new ImageData(2, 2);
    return emptyImageData;
};

// Blurs are two flipped passes, so the downsample must not flip.
const vertexShaderSource = (flipY: boolean) => `#version 300 es
  in vec2 position;
  out vec2 texCoords;

  void main() {
    texCoords = (position + 1.0) / 2.0;
    texCoords.y = ${flipY ? '1.0 - texCoords.y' : 'texCoords.y'};
    gl_Position = vec4(position, 0, 1.0);
  }
`;

const gaussianBlurFragmentShader = `#version 300 es
  precision mediump float;
  in vec2 texCoords;
  uniform sampler2D u_texture;
  uniform vec2 u_texelSize;
  uniform vec2 u_direction;
  // Taps merged in pairs so one bilinear fetch reads two texels. Index 0 is the center.
  uniform float u_weights[${GAUSSIAN_MAX_TAPS}];
  uniform float u_offsets[${GAUSSIAN_MAX_TAPS}];
  uniform int u_tapCount;
  out vec4 fragColor;

  void main() {
    vec3 result = texture(u_texture, texCoords).rgb * u_weights[0];

    for (int i = 1; i < ${GAUSSIAN_MAX_TAPS}; ++i) {
      if (i >= u_tapCount) break;
      vec2 offset = u_direction * u_texelSize * u_offsets[i];
      result += (texture(u_texture, texCoords + offset).rgb + texture(u_texture, texCoords - offset).rgb) * u_weights[i];
    }

    fragColor = vec4(result, 1.0);
  }
`;

const boxBlurFragmentShader = `#version 300 es
  precision mediump float;
  in vec2 texCoords;
  uniform sampler2D u_texture;
  uniform vec2 u_texelSize;
  uniform vec2 u_direction;
  uniform float u_radius;
  out vec4 fragColor;

  void main() {
    vec3 sum = vec3(0.0);
    float count = 0.0;
    const int MAX_RADIUS = 16;
    int radius = int(min(float(MAX_RADIUS), u_radius));

    for (int i = -MAX_RADIUS; i <= MAX_RADIUS; ++i) {
      if (abs(i) > radius) continue;
      vec2 offset = u_direction * u_texelSize * float(i);
      sum += texture(u_texture, texCoords + offset).rgb;
      count += 1.0;
    }

    fragColor = vec4(sum / count, 1.0);
  }
`;

const compositeFragmentShader = `#version 300 es
  precision mediump float;
  in vec2 texCoords;
  uniform sampler2D background;
  uniform sampler2D frame;
  uniform sampler2D mask;
  out vec4 fragColor;

  void main() {
    vec4 frameTex = texture(frame, texCoords);
    vec4 bgTex = texture(background, texCoords);
    float maskVal = texture(mask, texCoords).r;

    float grad = length(vec2(dFdx(maskVal), dFdy(maskVal)));
    float edgeSoftness = 2.0;
    float smoothAlpha = smoothstep(0.5 - grad * edgeSoftness, 0.5 + grad * edgeSoftness, maskVal);

    fragColor = mix(bgTex, vec4(frameTex.rgb, 1.0), 1.0 - smoothAlpha);
  }
`;

const downsampleFragmentShader = `#version 300 es
  precision mediump float;
  in vec2 texCoords;
  uniform sampler2D u_texture;
  out vec4 fragColor;

  void main() {
    fragColor = texture(u_texture, texCoords);
  }
`;

const computeGaussianKernel = (blurRadius: number) => {
    const sigma = blurRadius;
    const radius = Math.min(GAUSSIAN_MAX_RADIUS, Math.ceil(blurRadius));
    const weightAt = (offset: number) => Math.exp(-(offset * offset) / (2 * sigma * sigma));
    const weights = new Float32Array(GAUSSIAN_MAX_TAPS);
    const offsets = new Float32Array(GAUSSIAN_MAX_TAPS);
    weights[0] = weightAt(0);
    let total = weights[0];
    let tapCount = 1;
    for (let i = 1; i <= radius; i += 2) {
        const w1 = weightAt(i);
        const w2 = i + 1 <= radius ? weightAt(i + 1) : 0;
        const pairWeight = w1 + w2;
        weights[tapCount] = pairWeight;
        offsets[tapCount] = (i * w1 + (i + 1) * w2) / pairWeight;
        total += 2 * pairWeight;
        tapCount += 1;
    }
    for (let i = 0; i < tapCount; i++) {
        weights[i] /= total;
    }
    return { weights, offsets, tapCount };
};

// `setRadius` must be called while the program is bound.
interface BlurPass {
    program: WebGLProgram;
    position: number;
    texture: WebGLUniformLocation | null;
    texelSize: WebGLUniformLocation | null;
    direction: WebGLUniformLocation | null;
    setRadius: (radius: number) => void;
}

const createGaussianBlurPass = (gl: WebGL2RenderingContext): BlurPass => {
    const program = createProgram(gl, vertexShaderSource(true), gaussianBlurFragmentShader);
    const weights = gl.getUniformLocation(program, 'u_weights');
    const offsets = gl.getUniformLocation(program, 'u_offsets');
    const tapCount = gl.getUniformLocation(program, 'u_tapCount');
    let kernelRadius: number | null = null;
    return {
        program,
        position: gl.getAttribLocation(program, 'position'),
        texture: gl.getUniformLocation(program, 'u_texture'),
        texelSize: gl.getUniformLocation(program, 'u_texelSize'),
        direction: gl.getUniformLocation(program, 'u_direction'),
        setRadius: (radius) => {
            if (kernelRadius === radius) {
                return;
            }
            const kernel = computeGaussianKernel(radius);
            gl.uniform1fv(weights, kernel.weights);
            gl.uniform1fv(offsets, kernel.offsets);
            gl.uniform1i(tapCount, kernel.tapCount);
            kernelRadius = radius;
        },
    };
};

const createBoxBlurPass = (gl: WebGL2RenderingContext): BlurPass => {
    const program = createProgram(gl, vertexShaderSource(true), boxBlurFragmentShader);
    const radiusLocation = gl.getUniformLocation(program, 'u_radius');
    return {
        program,
        position: gl.getAttribLocation(program, 'position'),
        texture: gl.getUniformLocation(program, 'u_texture'),
        texelSize: gl.getUniformLocation(program, 'u_texelSize'),
        direction: gl.getUniformLocation(program, 'u_direction'),
        setRadius: (radius) => gl.uniform1f(radiusLocation, radius),
    };
};

const applyBlur = (
    gl: WebGL2RenderingContext,
    sourceTexture: WebGLTexture,
    width: number,
    height: number,
    radius: number,
    pass: BlurPass,
    vertexBuffer: WebGLBuffer,
    framebuffers: [WebGLFramebuffer, WebGLFramebuffer],
    textures: [WebGLTexture, WebGLTexture]
): WebGLTexture => {
    gl.useProgram(pass.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(pass.position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(pass.position);
    gl.uniform1i(pass.texture, 0);
    gl.uniform2f(pass.texelSize, 1 / width, 1 / height);
    pass.setRadius(radius);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[0]);
    gl.viewport(0, 0, width, height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
    gl.uniform2f(pass.direction, 1, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[1]);
    gl.viewport(0, 0, width, height);
    gl.bindTexture(gl.TEXTURE_2D, textures[0]);
    gl.uniform2f(pass.direction, 0, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return textures[1];
};

const getMaskDownsampleFactor = (width: number, height: number) =>
    Math.max(1, Math.round(Math.max(width, height) / MASK_BUFFER_TARGET_EDGE));

export const createCompositor = (canvas: CompositorCanvas, logger: PipelineLogger): Compositor | null => {
    const gl = (canvas as OffscreenCanvas).getContext('webgl2', {
        antialias: false,
        premultipliedAlpha: true,
    });
    if (!gl) {
        return null;
    }

    // Only enabled around the composite draw.
    gl.disable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const compositeProgram = createProgram(gl, vertexShaderSource(true), compositeFragmentShader);
    const compositePosition = gl.getAttribLocation(compositeProgram, 'position');
    const maskLocation = gl.getUniformLocation(compositeProgram, 'mask');
    const frameLocation = gl.getUniformLocation(compositeProgram, 'frame');
    const backgroundLocation = gl.getUniformLocation(compositeProgram, 'background');

    const gaussianBlur = createGaussianBlurPass(gl);
    const boxBlur = createBoxBlurPass(gl);

    const downsampleProgram = createProgram(gl, vertexShaderSource(false), downsampleFragmentShader);
    const downsamplePosition = gl.getAttribLocation(downsampleProgram, 'position');
    const downsampleTextureLocation = gl.getUniformLocation(downsampleProgram, 'u_texture');

    const bgTexture = initTexture(gl, 0);
    const frameTexture = initTexture(gl, 1);
    const vertexBuffer = createVertexBuffer(gl);

    let bufferWidth = canvas.width;
    let bufferHeight = canvas.height;
    let bgBlurWidth = Math.max(1, Math.floor(bufferWidth / DOWNSAMPLE_FACTOR));
    let bgBlurHeight = Math.max(1, Math.floor(bufferHeight / DOWNSAMPLE_FACTOR));

    const downsampleTexture = initTexture(gl, 2);
    const downsampleFramebuffer = createFramebuffer(gl, downsampleTexture, bgBlurWidth, bgBlurHeight);
    const bgBlurTextures: [WebGLTexture, WebGLTexture] = [initTexture(gl, 3), initTexture(gl, 4)];
    const bgBlurFramebuffers: [WebGLFramebuffer, WebGLFramebuffer] = [
        createFramebuffer(gl, bgBlurTextures[0], bgBlurWidth, bgBlurHeight),
        createFramebuffer(gl, bgBlurTextures[1], bgBlurWidth, bgBlurHeight),
    ];

    let maskDownsampleFactor = getMaskDownsampleFactor(bufferWidth, bufferHeight);
    let maskBufferWidth = Math.max(1, Math.round(bufferWidth / maskDownsampleFactor));
    let maskBufferHeight = Math.max(1, Math.round(bufferHeight / maskDownsampleFactor));
    const tempMaskTexture = initTexture(gl, 5);
    const tempMaskFramebuffer = createFramebuffer(gl, tempMaskTexture, maskBufferWidth, maskBufferHeight);
    const finalMaskTextures: [WebGLTexture, WebGLTexture] = [initTexture(gl, 6), initTexture(gl, 7)];
    const finalMaskFramebuffers: [WebGLFramebuffer, WebGLFramebuffer] = [
        createFramebuffer(gl, finalMaskTextures[0], maskBufferWidth, maskBufferHeight),
        createFramebuffer(gl, finalMaskTextures[1], maskBufferWidth, maskBufferHeight),
    ];
    let readMaskIndex = 0;
    let writeMaskIndex = 1;

    let blurRadius: number | null = null;
    let customBackgroundImage: ImageBitmap | ImageData | null = null;
    let backgroundSourceImage: ImageBitmap | null = null;
    let backgroundRequestId = 0;
    let isCleanedUp = false;

    gl.useProgram(compositeProgram);
    gl.uniform1i(backgroundLocation, 0);
    gl.uniform1i(frameLocation, 1);
    gl.uniform1i(maskLocation, 2);

    const uploadBackground = (image: ImageBitmap | ImageData) => {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, bgTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    };

    const releaseCustomBackground = () => {
        if (customBackgroundImage instanceof ImageBitmap) {
            customBackgroundImage.close();
        }
        customBackgroundImage = null;
    };

    const setBackgroundImage = async (image: ImageBitmap | null) => {
        const requestId = ++backgroundRequestId;
        // Re-cropping the current image after a resize keeps the previous crop on screen until the
        // new one lands, instead of compositing against black.
        const isRecrop = !!image && image === backgroundSourceImage && customBackgroundImage instanceof ImageBitmap;
        backgroundSourceImage = image;
        if (!isRecrop) {
            releaseCustomBackground();
            if (!image) {
                return;
            }
            customBackgroundImage = getEmptyImageData();
            uploadBackground(customBackgroundImage);
        }
        let cropped: ImageBitmap | null = null;
        try {
            cropped = await resizeImageToCover(image, canvas.width, canvas.height);
        } catch (error) {
            logger.error(
                `[bg-compositor] background image could not be cropped, ${isRecrop ? 'keeping the previous crop' : 'using black'}`,
                error
            );
        }
        if (isCleanedUp || requestId !== backgroundRequestId) {
            cropped?.close();
            return;
        }
        if (cropped) {
            releaseCustomBackground();
            customBackgroundImage = cropped;
            uploadBackground(cropped);
        }
    };

    const ensureBuffersMatchCanvas = () => {
        if (canvas.width === bufferWidth && canvas.height === bufferHeight) {
            return;
        }
        bufferWidth = canvas.width;
        bufferHeight = canvas.height;
        bgBlurWidth = Math.max(1, Math.floor(bufferWidth / DOWNSAMPLE_FACTOR));
        bgBlurHeight = Math.max(1, Math.floor(bufferHeight / DOWNSAMPLE_FACTOR));
        for (const texture of [downsampleTexture, ...bgBlurTextures]) {
            resizeTexture(gl, texture, bgBlurWidth, bgBlurHeight);
        }
        maskDownsampleFactor = getMaskDownsampleFactor(bufferWidth, bufferHeight);
        maskBufferWidth = Math.max(1, Math.round(bufferWidth / maskDownsampleFactor));
        maskBufferHeight = Math.max(1, Math.round(bufferHeight / maskDownsampleFactor));
        for (const texture of [tempMaskTexture, ...finalMaskTextures]) {
            resizeTexture(gl, texture, maskBufferWidth, maskBufferHeight);
        }
        if (backgroundSourceImage) {
            void setBackgroundImage(backgroundSourceImage);
        }
    };

    const downsample = (inputTexture: WebGLTexture) => {
        gl.useProgram(downsampleProgram);
        gl.bindFramebuffer(gl.FRAMEBUFFER, downsampleFramebuffer);
        gl.viewport(0, 0, bgBlurWidth, bgBlurHeight);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.enableVertexAttribArray(downsamplePosition);
        gl.vertexAttribPointer(downsamplePosition, 2, gl.FLOAT, false, 0, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, inputTexture);
        gl.uniform1i(downsampleTextureLocation, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return downsampleTexture;
    };

    const renderFrame = (frame: VideoFrame) => {
        if (isCleanedUp || frame.codedWidth === 0) {
            return;
        }
        const width = frame.displayWidth;
        const height = frame.displayHeight;
        ensureBuffersMatchCanvas();

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, frameTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, frame);

        let backgroundTexture = bgTexture;
        if (blurRadius) {
            backgroundTexture = applyBlur(
                gl,
                downsample(frameTexture),
                bgBlurWidth,
                bgBlurHeight,
                blurRadius,
                gaussianBlur,
                vertexBuffer,
                bgBlurFramebuffers,
                bgBlurTextures
            );
        }

        gl.viewport(0, 0, width, height);
        gl.clearColor(1, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(compositeProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.vertexAttribPointer(compositePosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(compositePosition);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, frameTexture);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, finalMaskTextures[readMaskIndex]);
        gl.enable(gl.BLEND);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.disable(gl.BLEND);
    };

    const updateMask = (mask: WebGLTexture) => {
        if (isCleanedUp) {
            return;
        }
        ensureBuffersMatchCanvas();
        applyBlur(
            gl,
            mask,
            maskBufferWidth,
            maskBufferHeight,
            Math.max(1, Math.round(MASK_BLUR_RADIUS / maskDownsampleFactor)),
            boxBlur,
            vertexBuffer,
            [tempMaskFramebuffer, finalMaskFramebuffers[writeMaskIndex]],
            [tempMaskTexture, finalMaskTextures[writeMaskIndex]]
        );
        readMaskIndex = writeMaskIndex;
        writeMaskIndex = 1 - writeMaskIndex;
    };

    const setBlurRadius = (radius: number | null) => {
        blurRadius = radius ? Math.max(1, Math.floor(radius / DOWNSAMPLE_FACTOR)) : null;
        void setBackgroundImage(null);
    };

    const cleanup = () => {
        if (isCleanedUp) {
            return;
        }
        isCleanedUp = true;
        for (const program of [compositeProgram, gaussianBlur.program, boxBlur.program, downsampleProgram]) {
            gl.deleteProgram(program);
        }
        for (const texture of [
            bgTexture,
            frameTexture,
            downsampleTexture,
            tempMaskTexture,
            ...bgBlurTextures,
            ...finalMaskTextures,
        ]) {
            gl.deleteTexture(texture);
        }
        for (const framebuffer of [
            downsampleFramebuffer,
            tempMaskFramebuffer,
            ...bgBlurFramebuffers,
            ...finalMaskFramebuffers,
        ]) {
            gl.deleteFramebuffer(framebuffer);
        }
        gl.deleteBuffer(vertexBuffer);
        releaseCustomBackground();
        backgroundSourceImage = null;
    };

    return { gl, renderFrame, updateMask, setBackgroundImage, setBlurRadius, cleanup };
};
