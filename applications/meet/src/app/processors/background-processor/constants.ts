// WebGL texture units
export const TEXTURE_UNIT_MASK = 6;
export const TEXTURE_UNIT_OUTPUT = 7;

// Confidence threshold values for hair detail preservation. These are applied
// in the segmenter worker while it combines the per-class confidence masks into
// a single person-confidence mask (see segmenter.worker.ts).
export const CONFIDENCE_BOOST_THRESHOLD_LOW = 0.1;
export const CONFIDENCE_BOOST_THRESHOLD_HIGH = 0.5;
export const CONFIDENCE_BOOST_MULTIPLIER = 1.3;

// Mask edge smoothing: Gaussian blur radius applied to the segmentation mask,
// in mask texels. Higher = softer/feathered silhouette; 0 = no edge smoothing.
export const MASK_EDGE_BLUR_TEXEL_RADIUS = 1.0;

// With the simple selfie segmentation model we are more likely to have gaps between the person
// and the blurred area. This threshold is used to adjust the person/background decision point.
export const DEFAULT_PERSON_MASK_THRESHOLD = 0.5;
export const LOW_END_PERSON_MASK_THRESHOLD = 0.65;

// Longest edge (in px) of the frame sent to the segmenter. The model runs at a
// fixed 256x256 tensor internally, so feeding it anything larger only inflates
// the size of the returned confidence masks (and the per-frame postMessage +
// GPU upload + mask-combine cost) without improving inference quality. We cap
// the input here and let the mask be upsampled during compositing.
export const SEGMENTATION_INPUT_MAX_EDGE = 256;

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

export const FRAGMENT_SHADER_SOURCE = `#version 300 es
    precision highp float;

    // Single-channel person-confidence mask. The per-class max() combine and the
    // hair-detail confidence boost now happen on the worker thread, so this shader
    // only has to feather the silhouette and invert it for LiveKit.
    uniform sampler2D u_mask;
    uniform vec2 u_texelSize;
    uniform float u_personThreshold; // person/background decision point (0.5 = none)

    in vec2 v_texCoord;
    out vec4 outColor;

    float samplePersonConfidence(vec2 uv) {
        return texture(u_mask, uv).r;
    }

    void main() {
        // 3x3 Gaussian blur of the person-confidence mask. Softens the silhouette
        // so the transition between subject and blurred background is feathered
        // rather than a hard line. Kernel weights: [1,2,1; 2,4,2; 1,2,1] / 16.
        // u_texelSize already includes the blur radius (set on the JS side).
        vec2 dx = vec2(u_texelSize.x, 0.0);
        vec2 dy = vec2(0.0, u_texelSize.y);

        float personConfidence =
            (1.0 / 16.0) * samplePersonConfidence(v_texCoord - dx - dy) +
            (2.0 / 16.0) * samplePersonConfidence(v_texCoord      - dy) +
            (1.0 / 16.0) * samplePersonConfidence(v_texCoord + dx - dy) +
            (2.0 / 16.0) * samplePersonConfidence(v_texCoord - dx     ) +
            (4.0 / 16.0) * samplePersonConfidence(v_texCoord          ) +
            (2.0 / 16.0) * samplePersonConfidence(v_texCoord + dx     ) +
            (1.0 / 16.0) * samplePersonConfidence(v_texCoord - dx + dy) +
            (2.0 / 16.0) * samplePersonConfidence(v_texCoord      + dy) +
            (1.0 / 16.0) * samplePersonConfidence(v_texCoord + dx + dy);

        // Shift the person/background decision point. Raising u_personThreshold
        // above 0.5 erodes the person region inward, moving the composited edge
        // into the subject so the blur covers the misaligned silhouette ring. The
        // small ramp keeps the remap gradual rather than a hard cut. At the
        // default 0.5 (high-end devices) the remap is skipped entirely so the raw
        // blurred confidence is passed through unchanged.
        if (u_personThreshold > 0.5) {
            personConfidence = smoothstep(u_personThreshold - 0.15, u_personThreshold + 0.15, personConfidence);
        }

        // Invert the mask: LiveKit's shader expects high values for background (to blur)
        // and low values for person (to keep sharp)
        // Output normalized float (personConfidence is already 0.0-1.0)
        float maskValue = 1.0 - personConfidence;

        outColor = vec4(maskValue, maskValue, maskValue, 1.0);
    }
`;

// Runs inside the segmenter worker, in MediaPipe's own WebGL2 context, to fold
// the per-class confidence textures into a single person-confidence mask on the
// GPU. This lets us read back one mask instead of calling getAsFloat32Array()
// (a GPU->CPU stall) once per class. The feathering/inversion still happens in
// FRAGMENT_SHADER_SOURCE on the main thread.
export const MASK_COMBINE_FRAGMENT_SHADER_SOURCE = `#version 300 es
    precision highp float;

    uniform sampler2D u_texture0;
    uniform sampler2D u_texture1;
    uniform sampler2D u_texture2;
    uniform sampler2D u_texture3;
    uniform sampler2D u_texture4;
    uniform sampler2D u_texture5;
    uniform int u_numTextures;
    uniform bool u_isSimpleModel;

    in vec2 v_texCoord;
    out vec4 outColor;

    void main() {
        float personConfidence = 0.0;

        if (u_isSimpleModel) {
            if (u_numTextures == 1) {
                // Simple model variant that only returns a person mask
                personConfidence = texture(u_texture0, v_texCoord).r;
            } else {
                // Simple model: use class 1 (person)
                personConfidence = texture(u_texture1, v_texCoord).r;
            }
        } else {
            // Multiclass model: take maximum confidence across person classes (1-5)
            // Start from class 1 (skip background class 0)
            personConfidence = texture(u_texture1, v_texCoord).r;

            if (u_numTextures > 2) {
                personConfidence = max(personConfidence, texture(u_texture2, v_texCoord).r);
            }
            if (u_numTextures > 3) {
                personConfidence = max(personConfidence, texture(u_texture3, v_texCoord).r);
            }
            if (u_numTextures > 4) {
                personConfidence = max(personConfidence, texture(u_texture4, v_texCoord).r);
            }
            if (u_numTextures > 5) {
                personConfidence = max(personConfidence, texture(u_texture5, v_texCoord).r);
            }

            // Boost low confidence values slightly to preserve fine hair details
            if (personConfidence > ${CONFIDENCE_BOOST_THRESHOLD_LOW} && personConfidence < ${CONFIDENCE_BOOST_THRESHOLD_HIGH}) {
                personConfidence = min(1.0, personConfidence * ${CONFIDENCE_BOOST_MULTIPLIER});
            }
        }

        outColor = vec4(personConfidence, personConfidence, personConfidence, 1.0);
    }
`;

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
