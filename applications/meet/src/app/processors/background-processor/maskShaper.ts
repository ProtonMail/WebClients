import {
    MASK_PASS_COPY,
    MASK_PASS_DILATE,
    MASK_PASS_ERODE,
    TEXTURE_UNIT_OUTPUT,
    VERTEX_SHADER_SOURCE,
    VERTICES,
    buildFragmentShaderSource,
} from './constants';

const compileShader = (gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null => {
    const shader = gl.createShader(type);
    if (!shader) {
        return null;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
    }
    return shader;
};

const saveWebGLState = (gl: WebGL2RenderingContext) => {
    const textureUnits = [0, TEXTURE_UNIT_OUTPUT];
    const textures = textureUnits.map((unit) => {
        gl.activeTexture(gl.TEXTURE0 + unit);
        return gl.getParameter(gl.TEXTURE_BINDING_2D) as WebGLTexture | null;
    });
    return {
        program: gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram | null,
        framebuffer: gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer | null,
        arrayBuffer: gl.getParameter(gl.ARRAY_BUFFER_BINDING) as WebGLBuffer | null,
        pixelUnpackBuffer: gl.getParameter(gl.PIXEL_UNPACK_BUFFER_BINDING) as WebGLBuffer | null,
        unpackAlignment: gl.getParameter(gl.UNPACK_ALIGNMENT) as number,
        blend: gl.isEnabled(gl.BLEND),
        activeTexture: gl.getParameter(gl.ACTIVE_TEXTURE) as number,
        viewport: gl.getParameter(gl.VIEWPORT) as Int32Array,
        textureUnits,
        textures,
    };
};

const restoreWebGLState = (gl: WebGL2RenderingContext, state: ReturnType<typeof saveWebGLState>) => {
    state.textureUnits.forEach((unit, i) => {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, state.textures[i]);
    });
    gl.activeTexture(state.activeTexture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, state.framebuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, state.arrayBuffer);
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, state.pixelUnpackBuffer);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, state.unpackAlignment);
    if (state.blend) {
        gl.enable(gl.BLEND);
    } else {
        gl.disable(gl.BLEND);
    }
    gl.useProgram(state.program);
    gl.viewport(state.viewport[0], state.viewport[1], state.viewport[2], state.viewport[3]);
};

/**
 * Uploads the segmenter's person mask, optionally closes interior holes, and inverts it for the
 * compositor.
 */
export class MaskShaper {
    private shaderProgram: WebGLProgram | null = null;
    private vertexBuffer: WebGLBuffer | null = null;
    private framebuffer: WebGLFramebuffer | null = null;
    private inputTexture: WebGLTexture | null = null;
    private inputPbo: WebGLBuffer | null = null;
    private output: WebGLTexture | null = null;
    private morphTextureA: WebGLTexture | null = null;
    private morphTextureB: WebGLTexture | null = null;
    private width = 0;
    private height = 0;

    private uniforms: {
        mask: WebGLUniformLocation | null;
        blurStep: WebGLUniformLocation | null;
        invert: WebGLUniformLocation | null;
        mode: WebGLUniformLocation | null;
        radius: WebGLUniformLocation | null;
    } | null = null;

    private attributes: { position: number; texCoord: number } | null = null;

    constructor(
        private readonly gl: WebGL2RenderingContext,
        private readonly closingRadius: number,
        private readonly shaderMaxRadius: number
    ) {}

    get outputTexture(): WebGLTexture | null {
        return this.output;
    }

    upload(mask: Uint8Array<ArrayBuffer>, width: number, height: number): boolean {
        const gl = this.gl;
        if (mask.length === 0 || width === 0 || height === 0) {
            return false;
        }

        const sizeChanged = this.width !== width || this.height !== height;
        const savedState = saveWebGLState(gl);

        // The GL context is shared with the compositor.
        try {
            gl.disable(gl.BLEND);

            if (!this.initializeShaderResources()) {
                return false;
            }
            if (!this.uploadInputTexture(mask, width, height, sizeChanged)) {
                return false;
            }
            if (this.closingRadius > 0 && !this.ensureMorphTextures(width, height, sizeChanged)) {
                return false;
            }
            if (!this.ensureOutputTexture(width, height, sizeChanged)) {
                return false;
            }
            if (!this.configureShaderProgram()) {
                return false;
            }
            if (!this.render(width, height, sizeChanged)) {
                return false;
            }

            this.width = width;
            this.height = height;

            gl.flush();

            return true;
        } finally {
            restoreWebGLState(gl, savedState);
        }
    }

    dispose() {
        const gl = this.gl;
        gl.deleteProgram(this.shaderProgram);
        gl.deleteBuffer(this.vertexBuffer);
        gl.deleteFramebuffer(this.framebuffer);
        gl.deleteTexture(this.output);
        gl.deleteTexture(this.morphTextureA);
        gl.deleteTexture(this.morphTextureB);
        gl.deleteTexture(this.inputTexture);
        gl.deleteBuffer(this.inputPbo);

        this.shaderProgram = null;
        this.vertexBuffer = null;
        this.framebuffer = null;
        this.output = null;
        this.morphTextureA = null;
        this.morphTextureB = null;
        this.inputTexture = null;
        this.inputPbo = null;
        this.uniforms = null;
        this.attributes = null;
        this.width = 0;
        this.height = 0;
    }

    private createShaderProgram(): WebGLProgram | null {
        const gl = this.gl;
        const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
        if (!vertexShader) {
            return null;
        }

        const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, buildFragmentShaderSource(this.shaderMaxRadius));
        if (!fragmentShader) {
            gl.deleteShader(vertexShader);
            return null;
        }

        const program = gl.createProgram();
        if (!program) {
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            return null;
        }

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.deleteProgram(program);
            return null;
        }

        return program;
    }

    private initializeShaderResources() {
        if (this.shaderProgram) {
            return true;
        }

        const gl = this.gl;
        this.shaderProgram = this.createShaderProgram();
        if (!this.shaderProgram) {
            return false;
        }

        gl.useProgram(this.shaderProgram);
        this.uniforms = {
            mask: gl.getUniformLocation(this.shaderProgram, 'u_mask'),
            blurStep: gl.getUniformLocation(this.shaderProgram, 'u_blurStep'),
            invert: gl.getUniformLocation(this.shaderProgram, 'u_invert'),
            mode: gl.getUniformLocation(this.shaderProgram, 'u_mode'),
            radius: gl.getUniformLocation(this.shaderProgram, 'u_radius'),
        };
        this.attributes = {
            position: gl.getAttribLocation(this.shaderProgram, 'a_position'),
            texCoord: gl.getAttribLocation(this.shaderProgram, 'a_texCoord'),
        };

        gl.uniform1i(this.uniforms.mask, 0);

        this.vertexBuffer = gl.createBuffer();
        if (this.vertexBuffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(VERTICES), gl.STATIC_DRAW);
        }

        return true;
    }

    private uploadInputTexture(
        mask: Uint8Array<ArrayBuffer>,
        width: number,
        height: number,
        sizeChanged: boolean
    ): boolean {
        const gl = this.gl;
        this.inputTexture ??= gl.createTexture();
        this.inputPbo ??= gl.createBuffer();
        if (!this.inputTexture || !this.inputPbo) {
            return false;
        }

        gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, this.inputPbo);
        if (sizeChanged) {
            gl.bufferData(gl.PIXEL_UNPACK_BUFFER, mask.byteLength, gl.STREAM_DRAW);
        }
        gl.bufferSubData(gl.PIXEL_UNPACK_BUFFER, 0, mask);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.inputTexture);

        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

        if (sizeChanged) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, width, height, 0, gl.RED, gl.UNSIGNED_BYTE, 0);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        } else {
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RED, gl.UNSIGNED_BYTE, 0);
        }

        gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, null);

        return true;
    }

    private ensureOutputTexture(width: number, height: number, sizeChanged: boolean): boolean {
        const gl = this.gl;
        gl.activeTexture(gl.TEXTURE0 + TEXTURE_UNIT_OUTPUT);

        if (!this.output) {
            this.output = gl.createTexture();
            if (!this.output) {
                return false;
            }
            gl.bindTexture(gl.TEXTURE_2D, this.output);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        } else {
            gl.bindTexture(gl.TEXTURE_2D, this.output);
        }

        if (sizeChanged) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        }

        return true;
    }

    private ensureMorphTextures(width: number, height: number, sizeChanged: boolean): boolean {
        const gl = this.gl;
        gl.activeTexture(gl.TEXTURE0);

        for (const key of ['morphTextureA', 'morphTextureB'] as const) {
            let texture = this[key];
            if (!texture) {
                texture = gl.createTexture();
                if (!texture) {
                    return false;
                }
                this[key] = texture;
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            } else {
                gl.bindTexture(gl.TEXTURE_2D, texture);
            }

            if (sizeChanged) {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            }
        }

        return true;
    }

    private configureShaderProgram() {
        if (!this.shaderProgram || !this.uniforms || !this.attributes) {
            return false;
        }

        const gl = this.gl;
        gl.useProgram(this.shaderProgram);

        if (this.vertexBuffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.enableVertexAttribArray(this.attributes.position);
            gl.vertexAttribPointer(this.attributes.position, 2, gl.FLOAT, false, 16, 0);
            gl.enableVertexAttribArray(this.attributes.texCoord);
            gl.vertexAttribPointer(this.attributes.texCoord, 2, gl.FLOAT, false, 16, 8);
        }

        return true;
    }

    // The caller sets framebuffer and viewport. Only validate after a resize: the completeness
    // check can stall some drivers.
    private drawPass(
        target: WebGLTexture,
        source: WebGLTexture,
        stepX: number,
        stepY: number,
        mode: number,
        invert: boolean,
        radius: number,
        validateFramebuffer: boolean
    ): boolean {
        const gl = this.gl;
        if (!this.uniforms) {
            return false;
        }
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target, 0);
        if (validateFramebuffer && gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            return false;
        }
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, source);
        gl.uniform2f(this.uniforms.blurStep, stepX, stepY);
        gl.uniform1i(this.uniforms.invert, invert ? 1 : 0);
        gl.uniform1i(this.uniforms.mode, mode);
        gl.uniform1i(this.uniforms.radius, radius);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        return true;
    }

    private render(width: number, height: number, sizeChanged: boolean): boolean {
        const gl = this.gl;
        this.framebuffer ??= gl.createFramebuffer();

        if (!this.framebuffer || !this.output || !this.inputTexture || !this.uniforms) {
            return false;
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.viewport(0, 0, width, height);

        const output = this.output;
        const a = this.morphTextureA;
        const b = this.morphTextureB;
        if (this.closingRadius > 0 && a && b) {
            const radius = this.closingRadius;
            const texelX = width > 0 ? 1 / width : 0;
            const texelY = height > 0 ? 1 / height : 0;

            return (
                this.drawPass(a, this.inputTexture, texelX, 0, MASK_PASS_DILATE, false, radius, sizeChanged) &&
                this.drawPass(b, a, 0, texelY, MASK_PASS_DILATE, false, radius, sizeChanged) &&
                this.drawPass(a, b, texelX, 0, MASK_PASS_ERODE, false, radius, sizeChanged) &&
                this.drawPass(output, a, 0, texelY, MASK_PASS_ERODE, true, radius, sizeChanged)
            );
        }

        return this.drawPass(output, this.inputTexture, 0, 0, MASK_PASS_COPY, true, 0, sizeChanged);
    }
}
