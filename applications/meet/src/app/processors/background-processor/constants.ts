// Texture unit for the mask LiveKit composites with.
export const TEXTURE_UNIT_OUTPUT = 7;

// Mild gain on the simple model's person mask (clamped to 1.0) so marginal
// pixels clear LiveKit's 0.5 cut. Overridable via MeetBlurPersonConfidenceBoost.
export const PERSON_CONFIDENCE_BOOST = 1.1;

// Stronger gain for the multiclass model, whose softmax leaves interior person
// regions below 1.0. Overridable via MeetBlurMulticlassPersonConfidenceBoost.
export const MULTICLASS_PERSON_CONFIDENCE_BOOST = 1.25;

// Longest edge (px) of the frame sent to the segmenter; sets silhouette
// crispness. Low-end cap.
export const SEGMENTATION_INPUT_MAX_EDGE = 512;

// Higher cap for capable devices; keeps thin features (fingers, hair).
export const SEGMENTATION_INPUT_MAX_EDGE_HIGH_END = 768;

// Mobile cap. Both models take a fixed 256x256 input tensor and MediaPipe upsamples
// the masks back to whatever it was handed, so a larger cap adds no detail — it only
// scales the per-pixel work downstream. The compositor's LINEAR sampling then does
// the upscale to frame size on the GPU for free.
export const SEGMENTATION_INPUT_MAX_EDGE_MOBILE = 256;

// --- Temporal smoothing of the person-confidence mask ---------------------
// Per-pixel EMA against the previous mask, damping the frame-to-frame jitter
// that flickers pixels across the 0.5 cut. Asymmetric: confidence that rises is
// followed quickly, confidence that falls eases down slowly (the slow release
// is what kills the flicker).
export const MASK_TEMPORAL_APPEAR_RATE = 0.75;
export const MASK_TEMPORAL_DISAPPEAR_RATE = 0.35;

// Motion escape hatch: a large per-pixel change is real motion, not jitter, so
// lift both rates toward "follow the model" to avoid holding a stale silhouette.
// smoothstep(LOW, HIGH) over |delta| blends between the slow and fast rates.
export const MASK_TEMPORAL_APPEAR_RATE_FAST = 0.98;
export const MASK_TEMPORAL_DISAPPEAR_RATE_FAST = 0.95;
export const MASK_TEMPORAL_MOTION_LOW = 0.15;
export const MASK_TEMPORAL_MOTION_HIGH = 0.45;

// --- Morphological closing of the person-confidence mask ------------------
// GPU close (dilate then erode) that fills the transient interior holes the
// model punches during fast motion, spatially and without ghosting. Radius in
// mask texels; a couple of texels closes dropouts without bridging real gaps.
export const MASK_CLOSING_RADIUS = 2;

// Smaller structuring element for low-end devices.
export const MASK_CLOSING_RADIUS_LOW_END = 1;

// Mobile structuring element. The radius counts mask texels, and the mobile mask is a
// third of the edge, so each texel covers ~3x more of the frame.
export const MASK_CLOSING_RADIUS_MOBILE = 1;

// Compile-time loop bound for the shader morphology; must be >= the max radius.
export const MASK_CLOSING_MAX_RADIUS = 4;

// Composited frames per segmentation request. Above 1 each mask is reused for the
// frames in between, which halves inference cost but trails behind fast movement.
export const SEGMENTATION_FRAME_INTERVAL = 1;

// Processed output frame rate on mobile, bounding compositing and encoding cost.
export const MAX_FPS_MOBILE = 16;

// Frame rate the temporal EMA rates were tuned at. They apply per mask update, so a
// slower update rate stretches the same smoothing over more wall-clock time.
export const MASK_TEMPORAL_REFERENCE_FPS = 30;

// u_mode selector for the shared mask shader.
export const MASK_PASS_COPY = 0;
export const MASK_PASS_DILATE = 1;
export const MASK_PASS_ERODE = 2;

// Asset paths
export const DEFAULT_ASSET_PATH = '/assets/background-blur';
export const DEFAULT_MODEL_PATH = 'assets/background-blur/selfie_multiclass_256x256.tflite';

// Shader sources
export const VERTEX_SHADER_SOURCE = `#version 300 es
    in vec2 a_position;
    in vec2 a_texCoord;
    out vec2 v_texCoord;

    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
    }
`;

export const buildFragmentShaderSource = (maxRadius: number): string => `#version 300 es
    precision highp float;

    // Spatial mask passes, selected per draw by u_mode; u_blurStep is the pass
    // direction (one axis non-zero) for the morphology passes. COPY passes the
    // mask through (the final pass also inverts for LiveKit); DILATE/ERODE are
    // separable grayscale morphology (max/min over +/- u_radius texels)
    // composing a close.
    uniform sampler2D u_mask;
    uniform vec2 u_blurStep;
    uniform bool u_invert;
    uniform int u_mode;
    uniform int u_radius;

    in vec2 v_texCoord;
    out vec4 outColor;

    const int MAX_RADIUS = ${Math.max(1, Math.round(maxRadius))};

    void main() {
        float value;

        if (u_mode == ${MASK_PASS_COPY}) {
            value = texture(u_mask, v_texCoord).r;
        } else {
            // max (dilate) or min (erode) over +/- u_radius; loop is bounded by
            // the compile-time MAX_RADIUS and broken early at u_radius.
            float acc = texture(u_mask, v_texCoord).r;
            for (int i = 1; i <= MAX_RADIUS; i++) {
                if (i > u_radius) {
                    break;
                }
                float offset = float(i);
                float a = texture(u_mask, v_texCoord + u_blurStep * offset).r;
                float b = texture(u_mask, v_texCoord - u_blurStep * offset).r;
                if (u_mode == ${MASK_PASS_DILATE}) {
                    acc = max(acc, max(a, b));
                } else {
                    acc = min(acc, min(a, b));
                }
            }
            value = acc;
        }

        if (u_invert) {
            value = 1.0 - value;
        }

        outColor = vec4(value, value, value, 1.0);
    }
`;

export const FRAGMENT_SHADER_SOURCE = buildFragmentShaderSource(MASK_CLOSING_MAX_RADIUS);

export const VERTICES = [
    -1,
    -1,
    0,
    0, // bottom left
    1,
    -1,
    1,
    0, // bottom right
    -1,
    1,
    0,
    1, // top left
    1,
    1,
    1,
    1, // top right
];
