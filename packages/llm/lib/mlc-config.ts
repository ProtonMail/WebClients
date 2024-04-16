export const modelVersion = 'v0_2_30';
export const modelLibURLPrefix = 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/';

export default {
    model_list: [
        {
            model_url: 'https://huggingface.co/mlc-ai/Mistral-7B-Instruct-v0.2-q4f16_1-MLC/resolve/main/',
            model_id: 'Mistral-7B-Instruct-v0.2-q4f16_1',
            model_lib_url: modelLibURLPrefix + modelVersion + '/Mistral-7B-Instruct-v0.2-q4f16_1-sw4k_cs1k-webgpu.wasm',
            vram_required_MB: 6079.02,
            low_resource_required: false,
            required_features: ['shader-f16'],
        },
    ],
    use_web_worker: true,
};
