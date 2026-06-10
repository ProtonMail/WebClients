/// <reference lib="webworker" />
import * as vision from '@mediapipe/tasks-vision';

import {
    CONFIDENCE_BOOST_MULTIPLIER,
    CONFIDENCE_BOOST_THRESHOLD_HIGH,
    CONFIDENCE_BOOST_THRESHOLD_LOW,
    MASK_COMBINE_FRAGMENT_SHADER_SOURCE,
    VERTEX_SHADER_SOURCE,
    VERTICES,
} from './constants';

declare const self: DedicatedWorkerGlobalScope;

// MediaPipe's GPU mask readback runs isIOS() (platform_utils.ts), which does
// `'ontouchend' in document`. In a Worker `document` is undefined, so on macOS
// this throws and every mask fails -> no blur. The stub makes those checks
// answer harmlessly: has() => false (the `in` check), and createElement returns
// an OffscreenCanvas for MediaPipe's other worker path.
// See: https://github.com/google/mediapipe/issues/4694
if (typeof (self as { document?: unknown }).document === 'undefined') {
    (self as { document?: unknown }).document = new Proxy(
        {},
        {
            get(_target, prop) {
                if (prop === 'createElement') {
                    return (tag: string) => (tag === 'canvas' ? new OffscreenCanvas(1, 1) : {});
                }
                // MediaPipe's WASM also calls document.addEventListener/removeEventListener;
                // no-ops avoid "is not a function" since there's nothing to listen to in a Worker.
                if (prop === 'addEventListener' || prop === 'removeEventListener') {
                    return () => {};
                }
                return undefined;
            },
            has() {
                return false;
            },
        }
    );
}

type InitMessage = {
    type: 'init';
    wasmLoaderUrl: string;
    wasmBinaryUrl: string;
    modelBuffer: ArrayBuffer;
    delegate: 'GPU' | 'CPU';
};

type SegmentMessage = {
    type: 'segment';
    bitmap: ImageBitmap;
    timestamp: number;
    // Correlation id so the main thread can match this reply to the frame it
    // requested (and ignore stale/warmup replies).
    id: number;
};

type DestroyMessage = { type: 'destroy' };

type InboundMessage = InitMessage | SegmentMessage | DestroyMessage;

let segmenter: vision.ImageSegmenter | null = null;
// OffscreenCanvas is required for GPU delegate inside a Worker — MediaPipe
// initializes its own WebGL2 context on this canvas. A small canvas is fine;
// MediaPipe resizes internally.
let offscreenCanvas: OffscreenCanvas | null = null;
let activeDelegate: 'GPU' | 'CPU' | undefined;
// Last timestamp (integer ms) fed to segmentForVideo. MediaPipe's VIDEO graph
// requires strictly increasing timestamps; see handleSegment for the full
// rationale. Reset whenever a fresh segmenter (graph) is created.
let lastSegmentTimestampMs = -1;

const initSegmenter = async (msg: InitMessage, attemptDelegate: 'GPU' | 'CPU' = msg.delegate) => {
    offscreenCanvas = new OffscreenCanvas(256, 256);

    const fileSet = {
        wasmLoaderPath: msg.wasmLoaderUrl,
        wasmBinaryPath: msg.wasmBinaryUrl,
    };

    // initSegmenter can run twice (GPU attempt, then CPU fallback). The ArrayBuffer
    // is retained, so each attempt wraps a fresh Uint8Array view over it.
    const modelAssetBuffer = new Uint8Array(msg.modelBuffer);

    segmenter = await vision.ImageSegmenter.createFromOptions(fileSet, {
        baseOptions: {
            modelAssetBuffer,
            delegate: attemptDelegate,
        },
        canvas: offscreenCanvas as unknown as HTMLCanvasElement,
        runningMode: 'VIDEO',
        outputCategoryMask: false,
        outputConfidenceMasks: true,
    });
    activeDelegate = attemptDelegate;
    // Fresh graph: reset the monotonic timestamp baseline so the first frame fed
    // to this segmenter is accepted regardless of prior history.
    lastSegmentTimestampMs = -1;
};

const handleInit = async (msg: InitMessage) => {
    try {
        await initSegmenter(msg, msg.delegate);
        self.postMessage({ type: 'ready', delegate: activeDelegate });
    } catch (error) {
        // Fall back to CPU delegate if GPU init fails inside the worker
        if (msg.delegate === 'GPU') {
            try {
                await initSegmenter(msg, 'CPU');
                self.postMessage({ type: 'ready', delegate: activeDelegate });
                return;
            } catch (cpuError) {
                self.postMessage({ type: 'error', message: (cpuError as Error).message });
                return;
            }
        }
        self.postMessage({ type: 'error', message: (error as Error).message });
    }
};

// Collapse the segmenter's per-class confidence masks into a single
// person-confidence mask. Previously every class mask was transferred to the
// main thread and combined there with a 6-sampler shader; doing it here means a
// single transfer, a single GPU upload and a trivial compositing shader
// downstream.
//
// Multiclass model classes: 0=background, 1=hair, 2=body-skin, 3=face-skin,
// 4=clothes, 5=others. We keep the maximum confidence across the person classes
// (1..n) and drop background. The simple model only has 0=background and
// 1=person (some variants emit a single person mask).

// --- GPU combine path ----------------------------------------------------
// When the GPU delegate is active the masks live in MediaPipe's WebGL2 context
// as textures. Reading each one back with getAsFloat32Array() is a synchronous
// GPU->CPU stall, so for N person classes we'd pay N stalls per frame. Instead
// we run a max()+boost shader over the class textures in that same context and
// read back a single combined mask (one stall). All resources are created
// lazily on MediaPipe's context and reused across frames.
let combineGl: WebGL2RenderingContext | null = null;
let combineProgram: WebGLProgram | null = null;
let combineVao: WebGLVertexArrayObject | null = null;
let combineVertexBuffer: WebGLBuffer | null = null;
let combineFramebuffer: WebGLFramebuffer | null = null;
let combineOutputTexture: WebGLTexture | null = null;
let combineOutputWidth = 0;
let combineOutputHeight = 0;
let combineFloatExtChecked = false;
let combineFloatExtAvailable = false;
let combineUniforms: {
    numTextures: WebGLUniformLocation | null;
    isSimpleModel: WebGLUniformLocation | null;
    samplers: (WebGLUniformLocation | null)[];
} | null = null;
// Reused RGBA32F readback scratch buffer (we only need the R channel).
let combineReadback: Float32Array | null = null;

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

const ensureCombinePipeline = (gl: WebGL2RenderingContext, width: number, height: number): boolean => {
    if (combineGl !== gl) {
        // New context (first use). Drop stale handles; they belonged to a context
        // that no longer exists, so they can't (and needn't) be deleted here.
        combineGl = gl;
        combineProgram = null;
        combineVao = null;
        combineVertexBuffer = null;
        combineFramebuffer = null;
        combineOutputTexture = null;
        combineOutputWidth = 0;
        combineOutputHeight = 0;
        combineUniforms = null;
        combineFloatExtChecked = false;
        combineFloatExtAvailable = false;
    }

    if (!combineFloatExtChecked) {
        combineFloatExtChecked = true;
        // Required to render to / read back an RGBA32F framebuffer.
        combineFloatExtAvailable = !!gl.getExtension('EXT_color_buffer_float');
    }
    if (!combineFloatExtAvailable) {
        return false;
    }

    if (!combineProgram) {
        const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
        const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, MASK_COMBINE_FRAGMENT_SHADER_SOURCE);
        if (!vertexShader || !fragmentShader) {
            return false;
        }
        const program = gl.createProgram();
        if (!program) {
            return false;
        }
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.deleteProgram(program);
            return false;
        }
        combineProgram = program;

        combineUniforms = {
            numTextures: gl.getUniformLocation(program, 'u_numTextures'),
            isSimpleModel: gl.getUniformLocation(program, 'u_isSimpleModel'),
            samplers: ['u_texture0', 'u_texture1', 'u_texture2', 'u_texture3', 'u_texture4', 'u_texture5'].map((name) =>
                gl.getUniformLocation(program, name)
            ),
        };

        combineVao = gl.createVertexArray();
        combineVertexBuffer = gl.createBuffer();
        gl.bindVertexArray(combineVao);
        gl.bindBuffer(gl.ARRAY_BUFFER, combineVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(VERTICES), gl.STATIC_DRAW);
        const positionLoc = gl.getAttribLocation(program, 'a_position');
        const texCoordLoc = gl.getAttribLocation(program, 'a_texCoord');
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(texCoordLoc);
        gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 16, 8);
        gl.bindVertexArray(null);

        // Bind the samplers to texture units 0..5 once.
        gl.useProgram(program);
        combineUniforms.samplers.forEach((loc, unit) => {
            if (loc !== null) {
                gl.uniform1i(loc, unit);
            }
        });
    }

    if (!combineFramebuffer) {
        combineFramebuffer = gl.createFramebuffer();
    }
    if (!combineOutputTexture) {
        combineOutputTexture = gl.createTexture();
    }
    if (!combineFramebuffer || !combineOutputTexture || !combineVao) {
        return false;
    }

    if (combineOutputWidth !== width || combineOutputHeight !== height) {
        gl.bindTexture(gl.TEXTURE_2D, combineOutputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.bindFramebuffer(gl.FRAMEBUFFER, combineFramebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, combineOutputTexture, 0);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            return false;
        }

        combineOutputWidth = width;
        combineOutputHeight = height;
    }

    return true;
};

// Snapshot the slice of GL state we touch so MediaPipe's next inference run is
// unaffected by our combine pass sharing its context.
const saveCombineGlState = (gl: WebGL2RenderingContext) => {
    const textures: (WebGLTexture | null)[] = [];
    for (let unit = 0; unit < 6; unit++) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        textures.push(gl.getParameter(gl.TEXTURE_BINDING_2D));
    }
    return {
        vao: gl.getParameter(gl.VERTEX_ARRAY_BINDING) as WebGLVertexArrayObject | null,
        framebuffer: gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer | null,
        program: gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram | null,
        arrayBuffer: gl.getParameter(gl.ARRAY_BUFFER_BINDING) as WebGLBuffer | null,
        viewport: gl.getParameter(gl.VIEWPORT) as Int32Array,
        activeTexture: gl.getParameter(gl.ACTIVE_TEXTURE) as number,
        textures,
    };
};

const restoreCombineGlState = (gl: WebGL2RenderingContext, state: ReturnType<typeof saveCombineGlState>) => {
    for (let unit = 0; unit < 6; unit++) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, state.textures[unit]);
    }
    gl.activeTexture(state.activeTexture);
    gl.bindVertexArray(state.vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, state.framebuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, state.arrayBuffer);
    gl.useProgram(state.program);
    gl.viewport(state.viewport[0], state.viewport[1], state.viewport[2], state.viewport[3]);
};

const combinePersonConfidenceGpu = (masks: vision.MPMask[], width: number, height: number): Float32Array | null => {
    const canvas = masks[0].canvas;
    if (!canvas) {
        return null;
    }
    const gl = canvas.getContext('webgl2') as unknown as WebGL2RenderingContext | null;
    if (!gl) {
        return null;
    }

    const state = saveCombineGlState(gl);
    try {
        if (!ensureCombinePipeline(gl, width, height) || !combineProgram || !combineUniforms) {
            return null;
        }

        gl.bindVertexArray(combineVao);
        gl.bindFramebuffer(gl.FRAMEBUFFER, combineFramebuffer);
        gl.viewport(0, 0, width, height);
        gl.useProgram(combineProgram);

        const numMasks = Math.min(masks.length, 6);
        gl.uniform1i(combineUniforms.numTextures, masks.length);
        gl.uniform1i(combineUniforms.isSimpleModel, masks.length <= 2 ? 1 : 0);

        for (let i = 0; i < numMasks; i++) {
            gl.activeTexture(gl.TEXTURE0 + i);
            // 1:1 sampling at texel centers, so MediaPipe's own filter/wrap params
            // are irrelevant and we deliberately don't mutate them.
            gl.bindTexture(gl.TEXTURE_2D, masks[i].getAsWebGLTexture());
        }

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        const rgbaLength = width * height * 4;
        if (!combineReadback || combineReadback.length !== rgbaLength) {
            combineReadback = new Float32Array(rgbaLength);
        }
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, combineReadback);

        const combined = new Float32Array(width * height);
        for (let pixel = 0, offset = 0; pixel < combined.length; pixel++, offset += 4) {
            combined[pixel] = combineReadback[offset];
        }
        return combined;
    } catch {
        return null;
    } finally {
        restoreCombineGlState(gl, state);
    }
};

// --- CPU combine path ----------------------------------------------------
// Used for the CPU delegate (masks are already CPU-side, so getAsFloat32Array()
// is cheap) and as a fallback when the GPU combine can't run.
const combinePersonConfidenceCpu = (masks: vision.MPMask[], width: number, height: number): Float32Array => {
    const size = width * height;
    const isSimpleModel = masks.length <= 2;

    if (isSimpleModel) {
        const personIndex = masks.length === 1 ? 0 : 1;
        // getAsFloat32Array() returns a fresh Float32Array each call; ownership is ours.
        return masks[personIndex].getAsFloat32Array();
    }

    const classArrays = masks.map((mask) => mask.getAsFloat32Array());
    const combined = new Float32Array(size);

    for (let pixel = 0; pixel < size; pixel++) {
        let personConfidence = classArrays[1][pixel];
        for (let classIndex = 2; classIndex < classArrays.length; classIndex++) {
            const value = classArrays[classIndex][pixel];
            if (value > personConfidence) {
                personConfidence = value;
            }
        }

        // Boost low confidence values slightly to preserve fine hair details.
        if (personConfidence > CONFIDENCE_BOOST_THRESHOLD_LOW && personConfidence < CONFIDENCE_BOOST_THRESHOLD_HIGH) {
            personConfidence = Math.min(1, personConfidence * CONFIDENCE_BOOST_MULTIPLIER);
        }

        combined[pixel] = personConfidence;
    }

    return combined;
};

const combinePersonConfidence = (masks: vision.MPMask[], width: number, height: number): Float32Array => {
    // Only worth the GPU round-trip when the masks are already GPU textures;
    // otherwise getAsFloat32Array() is free and the CPU loop wins.
    if (masks[0].hasWebGLTexture()) {
        const gpuResult = combinePersonConfidenceGpu(masks, width, height);
        if (gpuResult) {
            return gpuResult;
        }
    }
    return combinePersonConfidenceCpu(masks, width, height);
};

const deleteCombineResources = () => {
    const gl = combineGl;
    if (gl) {
        if (combineProgram) {
            gl.deleteProgram(combineProgram);
        }
        if (combineVao) {
            gl.deleteVertexArray(combineVao);
        }
        if (combineVertexBuffer) {
            gl.deleteBuffer(combineVertexBuffer);
        }
        if (combineFramebuffer) {
            gl.deleteFramebuffer(combineFramebuffer);
        }
        if (combineOutputTexture) {
            gl.deleteTexture(combineOutputTexture);
        }
    }
    combineGl = null;
    combineProgram = null;
    combineVao = null;
    combineVertexBuffer = null;
    combineFramebuffer = null;
    combineOutputTexture = null;
    combineOutputWidth = 0;
    combineOutputHeight = 0;
    combineUniforms = null;
    combineReadback = null;
    combineFloatExtChecked = false;
    combineFloatExtAvailable = false;
};

// MediaPipe's VIDEO running mode feeds packets into a graph that requires
// strictly monotonically increasing timestamps (rounded to whole microseconds).
// The main thread tags each request with performance.now(), but clock-resolution
// clamping and rounding can yield equal or backwards microsecond values for
// frames that arrive close together. A single violation puts the graph into a
// permanent error state ("Packet timestamp mismatch ... free_memory"), after
// which every subsequent segmentForVideo call fails and the mask freezes. Clamp
// to a strictly increasing integer-millisecond timestamp here, at the actual
// segmentForVideo call site, so the graph can never be wedged by a bad value.
const handleSegment = (msg: SegmentMessage) => {
    const { id } = msg;
    if (!segmenter) {
        msg.bitmap.close();
        self.postMessage({ type: 'mask-failed', id });
        return;
    }

    const timestampMs = Math.max(Math.round(msg.timestamp), lastSegmentTimestampMs + 1);
    lastSegmentTimestampMs = timestampMs;

    try {
        segmenter.segmentForVideo(msg.bitmap, timestampMs, (result) => {
            try {
                const masks = result.confidenceMasks ?? [];
                if (masks.length === 0) {
                    self.postMessage({ type: 'mask-failed', id });
                    return;
                }

                const width = masks[0].width;
                const height = masks[0].height;
                const combined = combinePersonConfidence(masks, width, height);

                self.postMessage(
                    {
                        type: 'mask',
                        id,
                        width,
                        height,
                        buffer: combined.buffer,
                    },
                    [combined.buffer]
                );
            } finally {
                result.close();
                msg.bitmap.close();
            }
        });
    } catch {
        msg.bitmap.close();
        self.postMessage({ type: 'mask-failed', id });
    }
};

self.onmessage = (event: MessageEvent<InboundMessage>) => {
    const msg = event.data;
    if (msg.type === 'init') {
        void handleInit(msg);
    } else if (msg.type === 'segment') {
        handleSegment(msg);
    } else if (msg.type === 'destroy') {
        deleteCombineResources();
        segmenter?.close();
        segmenter = null;
        offscreenCanvas = null;
        self.close();
    }
};
