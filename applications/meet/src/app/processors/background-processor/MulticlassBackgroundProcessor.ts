import {
    type BackgroundOptions,
    ProcessorWrapper,
    type ProcessorWrapperOptions,
    type SegmenterOptions,
    VideoTransformer,
    type VideoTransformerInitOptions,
} from '@livekit/track-processors';
import * as vision from '@mediapipe/tasks-vision';

import {
    DEFAULT_ASSET_PATH,
    DEFAULT_MODEL_PATH,
    FRAGMENT_SHADER_SOURCE,
    TEXTURE_UNIT_MASK,
    TEXTURE_UNIT_OUTPUT,
    VERTEX_SHADER_SOURCE,
    VERTICES,
} from './constants';

export default class MulticlassBackgroundProcessor extends VideoTransformer<BackgroundOptions> {
    static get isSupported() {
        return (
            typeof OffscreenCanvas !== 'undefined' &&
            typeof VideoFrame !== 'undefined' &&
            typeof createImageBitmap !== 'undefined' &&
            !!document.createElement('canvas').getContext('webgl2')
        );
    }

    imageSegmenter?: vision.ImageSegmenter;

    options: BackgroundOptions;

    isFirstFrame = true;

    private maskImageData?: ImageData;
    private maskTexture?: WebGLTexture | null;
    private maskGl?: WebGL2RenderingContext | null;
    private maskTextureWidth = 0;
    private maskTextureHeight = 0;
    private maskShaderProgram?: WebGLProgram | null;
    private maskVertexBuffer?: WebGLBuffer | null;
    private maskFramebuffer?: WebGLFramebuffer | null;
    private maskOutputTexture?: WebGLTexture | null;
    private maskOutputTextureWidth = 0;
    private maskOutputTextureHeight = 0;
    private lastCanvasWidth = 0;
    private lastCanvasHeight = 0;
    private fallbackConfidenceTextures: (WebGLTexture | null)[] = [];
    private useWebGLTexturePath = true;

    constructor(opts: BackgroundOptions) {
        super();
        this.options = opts;
        void this.update(opts);
    }

    async init({ outputCanvas, inputElement: inputVideo }: VideoTransformerInitOptions) {
        await super.init({ outputCanvas, inputElement: inputVideo });

        await this.initializeSegmenter();
        if (this.options.blurRadius) {
            this.gl?.setBlurRadius(this.options.blurRadius);
        }
    }

    private async initializeSegmenter(delegateOverride?: 'GPU' | 'CPU') {
        const fileSet = await vision.FilesetResolver.forVisionTasks(
            this.options.assetPaths?.tasksVisionFileSet ?? DEFAULT_ASSET_PATH
        );

        const configuredDelegate = this.options.segmenterOptions?.delegate;
        const normalizedDelegate =
            configuredDelegate === 'GPU' || configuredDelegate === 'CPU' ? configuredDelegate : undefined;
        const desiredDelegate = delegateOverride ?? normalizedDelegate ?? 'GPU';

        try {
            this.imageSegmenter = await vision.ImageSegmenter.createFromOptions(fileSet, {
                baseOptions: {
                    modelAssetPath: this.options.assetPaths?.modelAssetPath ?? DEFAULT_MODEL_PATH,
                    ...(this.options.segmenterOptions ?? {}),
                    delegate: desiredDelegate,
                },
                canvas: this.canvas,
                runningMode: 'VIDEO',
                outputCategoryMask: false,
                outputConfidenceMasks: true,
            });
        } catch (error) {
            if (!delegateOverride && !normalizedDelegate && desiredDelegate === 'GPU') {
                await this.initializeSegmenter('CPU');
                return;
            }
            throw error;
        }
    }

    async destroy() {
        await super.destroy();
        await this.imageSegmenter?.close();
        this.isFirstFrame = true;
        this.cleanupWebGLResources();
        this.resetMaskState();
    }

    private cleanupWebGLResources() {
        if (!this.maskGl) {
            return;
        }

        this.maskGl.deleteTexture(this.maskTexture as WebGLTexture);
        this.maskGl.deleteProgram(this.maskShaderProgram as WebGLProgram);
        this.maskGl.deleteBuffer(this.maskVertexBuffer as WebGLBuffer);
        this.maskGl.deleteFramebuffer(this.maskFramebuffer as WebGLFramebuffer);
        this.maskGl.deleteTexture(this.maskOutputTexture as WebGLTexture);

        this.fallbackConfidenceTextures.forEach((texture) => {
            if (texture) {
                this.maskGl!.deleteTexture(texture);
            }
        });

        this.maskTexture = null;
        this.maskShaderProgram = null;
        this.maskVertexBuffer = null;
        this.maskFramebuffer = null;
        this.maskOutputTexture = null;
        this.fallbackConfidenceTextures = [];
        this.maskGl = null;
    }

    private resetMaskState() {
        this.maskImageData = undefined;
        this.maskTextureWidth = 0;
        this.maskTextureHeight = 0;
        this.maskOutputTextureWidth = 0;
        this.maskOutputTextureHeight = 0;
        this.lastCanvasWidth = 0;
        this.lastCanvasHeight = 0;
    }

    async transform(frame: VideoFrame, controller: TransformStreamDefaultController<VideoFrame>) {
        let enqueuedFrame = false;
        try {
            if (!(frame instanceof VideoFrame) || frame.codedWidth === 0 || frame.codedHeight === 0) {
                // Empty frame detected, ignoring
                return;
            }

            if (this.isDisabled) {
                controller.enqueue(frame);
                enqueuedFrame = true;
                return;
            }

            const frameTimeMs = Date.now();
            if (!this.canvas) {
                throw TypeError('Canvas needs to be initialized first');
            }
            if (this.lastCanvasWidth !== frame.displayWidth || this.lastCanvasHeight !== frame.displayHeight) {
                this.canvas.width = frame.displayWidth;
                this.canvas.height = frame.displayHeight;
                this.lastCanvasWidth = frame.displayWidth;
                this.lastCanvasHeight = frame.displayHeight;
            }

            if (this.isFirstFrame) {
                controller.enqueue(frame.clone());

                if (this.inputVideo) {
                    await new Promise((resolve) => {
                        this.inputVideo!.requestVideoFrameCallback((_now, e) => {
                            const durationUntilFrameRenderedInMs = e.expectedDisplayTime - e.presentationTime;
                            setTimeout(resolve, durationUntilFrameRenderedInMs);
                        });
                    });
                }
            }
            this.isFirstFrame = false;

            const segmentationPromise = this.imageSegmenter
                ? new Promise<void>((resolve, reject) => {
                      try {
                          this.imageSegmenter!.segmentForVideo(frame, performance.now(), (result) => {
                              void this.updateMaskFromConfidences(result.confidenceMasks);
                              result.close();
                              resolve();
                          });
                      } catch (e) {
                          reject(e);
                      }
                  })
                : Promise.resolve();

            void this.drawFrame(frame);
            const canRender = this.canvas && this.canvas.width > 0 && this.canvas.height > 0;

            if (canRender) {
                const newFrame = new VideoFrame(this.canvas, {
                    timestamp: frame.timestamp || frameTimeMs,
                });
                controller.enqueue(newFrame);
            } else {
                controller.enqueue(frame);
            }
            await segmentationPromise;
        } catch (e) {
            // Error processing frame
        } finally {
            if (!enqueuedFrame) {
                frame.close();
            }
        }
    }

    async update(opts: BackgroundOptions) {
        this.options = { ...this.options, ...opts };
        this.gl?.setBlurRadius(opts.blurRadius ?? null);
    }

    private async drawFrame(frame: VideoFrame) {
        if (!this.gl) {
            return;
        }
        this.gl?.renderFrame(frame);
    }

    private compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
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
    }

    private createMaskShaderProgram(gl: WebGL2RenderingContext): WebGLProgram | null {
        const vertexShader = this.compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
        if (!vertexShader) {
            return null;
        }

        const fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
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

        // Clean up shaders after linking
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.deleteProgram(program);
            return null;
        }

        return program;
    }

    private saveWebGLState(gl: WebGL2RenderingContext) {
        return {
            program: gl.getParameter(gl.CURRENT_PROGRAM),
            framebuffer: gl.getParameter(gl.FRAMEBUFFER_BINDING),
            arrayBuffer: gl.getParameter(gl.ARRAY_BUFFER_BINDING),
            texture: gl.getParameter(gl.TEXTURE_BINDING_2D),
            activeTexture: gl.getParameter(gl.ACTIVE_TEXTURE),
            viewport: gl.getParameter(gl.VIEWPORT),
        };
    }

    private restoreWebGLState(
        gl: WebGL2RenderingContext,
        state: {
            program: any;
            framebuffer: any;
            arrayBuffer: any;
            texture: any;
            activeTexture: any;
            viewport: any;
        }
    ) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, state.framebuffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, state.arrayBuffer);
        gl.bindTexture(gl.TEXTURE_2D, state.texture);
        gl.activeTexture(state.activeTexture);
        gl.useProgram(state.program);
        gl.viewport(state.viewport[0], state.viewport[1], state.viewport[2], state.viewport[3]);
    }

    private initializeShaderResources(gl: WebGL2RenderingContext) {
        if (this.maskShaderProgram) {
            return true;
        }

        this.maskShaderProgram = this.createMaskShaderProgram(gl);
        if (!this.maskShaderProgram) {
            return false;
        }

        // Create vertex buffer for quad
        this.maskVertexBuffer = gl.createBuffer();
        if (this.maskVertexBuffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.maskVertexBuffer);
            const vertices = new Float32Array(VERTICES);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        }

        return true;
    }

    private loadConfidenceTextures(
        gl: WebGL2RenderingContext,
        masks: vision.MPMask[],
        width: number,
        height: number
    ): (WebGLTexture | null)[] {
        if (this.useWebGLTexturePath) {
            const firstMask = masks[0];
            const supportsWebGLTexture = typeof firstMask.getAsWebGLTexture === 'function';

            if (supportsWebGLTexture) {
                try {
                    const textures = masks.map((mask) => mask.getAsWebGLTexture());
                    const allValid = textures.length > 0 && textures.every((t) => t !== null);
                    if (allValid) {
                        textures.forEach((texture, i) => {
                            if (texture) {
                                gl.activeTexture(gl.TEXTURE0 + i);
                                gl.bindTexture(gl.TEXTURE_2D, texture);
                            }
                        });
                        return textures;
                    }
                    this.useWebGLTexturePath = false;
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.warn('getAsWebGLTexture failed, falling back to Float32Array', e);
                    this.useWebGLTexturePath = false;
                }
            } else {
                this.useWebGLTexturePath = false;
            }
        }

        return this.loadConfidenceTexturesFromFloat32Array(gl, masks, width, height);
    }

    private loadConfidenceTexturesFromFloat32Array(
        gl: WebGL2RenderingContext,
        masks: vision.MPMask[],
        width: number,
        height: number
    ): (WebGLTexture | null)[] {
        const confidenceMasks = masks.map((mask) => mask.getAsFloat32Array());
        const numMasks = masks.length;

        while (this.fallbackConfidenceTextures.length < numMasks) {
            this.fallbackConfidenceTextures.push(gl.createTexture());
        }

        for (let i = 0; i < confidenceMasks.length; i++) {
            const texture = this.fallbackConfidenceTextures[i];
            if (!texture) {
                continue;
            }

            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, texture);

            if (this.maskTextureWidth === width && this.maskTextureHeight === height) {
                gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RED, gl.FLOAT, confidenceMasks[i]);
            } else {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, width, height, 0, gl.RED, gl.FLOAT, confidenceMasks[i]);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            }
        }

        return this.fallbackConfidenceTextures;
    }

    private initializeMaskTexture(gl: WebGL2RenderingContext, width: number, height: number) {
        gl.activeTexture(gl.TEXTURE0 + TEXTURE_UNIT_MASK);

        if (!this.maskTexture) {
            this.maskTexture = gl.createTexture();
            if (!this.maskTexture) {
                return false;
            }
            gl.bindTexture(gl.TEXTURE_2D, this.maskTexture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            this.maskTextureWidth = 0;
            this.maskTextureHeight = 0;
        } else {
            gl.bindTexture(gl.TEXTURE_2D, this.maskTexture);
        }

        if (this.maskTextureWidth !== width || this.maskTextureHeight !== height) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            this.maskTextureWidth = width;
            this.maskTextureHeight = height;
        }

        return true;
    }

    private configureShaderProgram(gl: WebGL2RenderingContext, numMasks: number, isSimpleModel: boolean) {
        if (!this.maskShaderProgram) {
            return false;
        }

        gl.useProgram(this.maskShaderProgram);

        // Set uniforms
        const numTexturesLoc = gl.getUniformLocation(this.maskShaderProgram, 'u_numTextures');
        const isSimpleModelLoc = gl.getUniformLocation(this.maskShaderProgram, 'u_isSimpleModel');

        gl.uniform1i(numTexturesLoc, numMasks);
        gl.uniform1i(isSimpleModelLoc, isSimpleModel ? 1 : 0);

        // Set texture samplers
        const samplerNames = ['u_texture0', 'u_texture1', 'u_texture2', 'u_texture3', 'u_texture4', 'u_texture5'];
        for (let i = 0; i < numMasks && i < samplerNames.length; i++) {
            const samplerLoc = gl.getUniformLocation(this.maskShaderProgram, samplerNames[i]);
            if (samplerLoc !== null) {
                gl.uniform1i(samplerLoc, i);
            }
        }

        // Set up vertex attributes
        const positionLoc = gl.getAttribLocation(this.maskShaderProgram, 'a_position');
        const texCoordLoc = gl.getAttribLocation(this.maskShaderProgram, 'a_texCoord');

        if (this.maskVertexBuffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.maskVertexBuffer);
            gl.enableVertexAttribArray(positionLoc);
            gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 16, 0);
            gl.enableVertexAttribArray(texCoordLoc);
            gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 16, 8);
        }

        return true;
    }

    private renderMaskToFramebuffer(gl: WebGL2RenderingContext, width: number, height: number): boolean {
        if (!this.maskFramebuffer) {
            this.maskFramebuffer = gl.createFramebuffer();
        }

        if (!this.maskFramebuffer || !this.maskTexture) {
            return false;
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.maskFramebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.maskTexture, 0);

        const fbStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (fbStatus !== gl.FRAMEBUFFER_COMPLETE) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return false;
        }

        gl.viewport(0, 0, width, height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        return true;
    }

    private copyMaskToOutputTexture(gl: WebGL2RenderingContext, width: number, height: number) {
        gl.activeTexture(gl.TEXTURE0 + TEXTURE_UNIT_OUTPUT);

        if (!this.maskOutputTexture) {
            this.maskOutputTexture = gl.createTexture();
            if (this.maskOutputTexture) {
                gl.bindTexture(gl.TEXTURE_2D, this.maskOutputTexture);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            }
        }

        if (!this.maskTexture || !this.maskOutputTexture || !this.maskFramebuffer || !this.gl) {
            return;
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.maskFramebuffer);
        gl.bindTexture(gl.TEXTURE_2D, this.maskOutputTexture);

        const outputNeedsInit = this.maskOutputTextureWidth !== width || this.maskOutputTextureHeight !== height;
        if (outputNeedsInit) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            this.maskOutputTextureWidth = width;
            this.maskOutputTextureHeight = height;
        }

        gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 0, 0, width, height);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);

        this.gl.updateMask(this.maskOutputTexture);
    }

    /**
     * Combine confidence masks from multiclass segmenter into a single binary mask
     *
     * Multiclass model - Classes: 0=background, 1=hair, 2=body-skin, 3=face-skin, 4=clothes, 5=others (accessories)
     * We want to keep classes 1-5 (all person-related) and remove class 0 (background)
     *
     * Simple model - Classes: 0=background, 1=person
     * We want to keep class 1 (person) and remove class 0 (background)
     *
     * Reference: https://ai.google.dev/edge/mediapipe/solutions/vision/image_segmenter
     */
    private async updateMaskFromConfidences(masks: vision.MPMask[] | undefined) {
        if (!masks || masks.length === 0 || !this.gl || !this.canvas) {
            return;
        }

        const width = masks[0].width;
        const height = masks[0].height;

        if (!this.maskImageData || this.maskImageData.width !== width || this.maskImageData.height !== height) {
            this.maskImageData = new ImageData(width, height);
            this.maskTextureWidth = 0;
            this.maskTextureHeight = 0;
        }

        // Use GPU to combine confidence masks instead of CPU loop
        // Get the WebGL context from the same canvas LiveKit is using
        if (!this.maskGl && typeof (this.canvas as any).getContext === 'function') {
            this.maskGl = (this.canvas as any).getContext('webgl2') as WebGL2RenderingContext | null;
        }

        const gl = this.maskGl;
        if (!gl) {
            return;
        }

        // Save WebGL state to restore later (avoid conflicts with LiveKit)
        const savedState = this.saveWebGLState(gl);

        // Initialize shader program and resources if needed
        if (!this.initializeShaderResources(gl)) {
            return;
        }

        const numMasks = masks.length;
        const isSimpleModel = numMasks <= 2;

        // Load confidence masks as textures
        this.loadConfidenceTextures(gl, masks, width, height);

        // Initialize or resize mask texture if needed
        if (!this.initializeMaskTexture(gl, width, height)) {
            return;
        }

        // Set up shader program and uniforms
        if (!this.configureShaderProgram(gl, numMasks, isSimpleModel)) {
            return;
        }

        // Render the combined mask to framebuffer
        if (!this.renderMaskToFramebuffer(gl, width, height)) {
            return;
        }

        // Copy the framebuffer result to output texture and pass to LiveKit
        this.copyMaskToOutputTexture(gl, width, height);

        // Restore WebGL state to avoid conflicts with LiveKit
        this.restoreWebGLState(gl, savedState);
    }
}

export const BackgroundBlur = (
    blurRadius?: number,
    segmenterOptions?: SegmenterOptions,
    processorOptions?: ProcessorWrapperOptions
) => {
    const options: BackgroundOptions = {
        blurRadius,
        segmenterOptions,
        ...processorOptions,
    };
    return new ProcessorWrapper<BackgroundOptions>(
        new MulticlassBackgroundProcessor(options),
        'background-blur',
        processorOptions
    );
};
