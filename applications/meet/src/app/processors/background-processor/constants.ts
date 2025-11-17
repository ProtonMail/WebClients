// WebGL texture units
export const TEXTURE_UNIT_MASK = 6;
export const TEXTURE_UNIT_OUTPUT = 7;

// Confidence threshold values for hair detail preservation
export const CONFIDENCE_BOOST_THRESHOLD_LOW = 0.1;
export const CONFIDENCE_BOOST_THRESHOLD_HIGH = 0.5;
export const CONFIDENCE_BOOST_MULTIPLIER = 1.3;

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
            float confidence1 = texture(u_texture1, v_texCoord).r;
            personConfidence = max(personConfidence, confidence1);

            if (u_numTextures > 2) {
                float confidence2 = texture(u_texture2, v_texCoord).r;
                personConfidence = max(personConfidence, confidence2);
            }
            if (u_numTextures > 3) {
                float confidence3 = texture(u_texture3, v_texCoord).r;
                personConfidence = max(personConfidence, confidence3);
            }
            if (u_numTextures > 4) {
                float confidence4 = texture(u_texture4, v_texCoord).r;
                personConfidence = max(personConfidence, confidence4);
            }
            if (u_numTextures > 5) {
                float confidence5 = texture(u_texture5, v_texCoord).r;
                personConfidence = max(personConfidence, confidence5);
            }

            // Boost low confidence values slightly to preserve fine hair details
            if (personConfidence > ${CONFIDENCE_BOOST_THRESHOLD_LOW} && personConfidence < ${CONFIDENCE_BOOST_THRESHOLD_HIGH}) {
                personConfidence = min(1.0, personConfidence * ${CONFIDENCE_BOOST_MULTIPLIER});
            }
        }

        // Invert the mask: LiveKit's shader expects high values for background (to blur)
        // and low values for person (to keep sharp)
        // Output normalized float (personConfidence is already 0.0-1.0)
        float maskValue = 1.0 - personConfidence;

        outColor = vec4(maskValue, maskValue, maskValue, 1.0);
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
