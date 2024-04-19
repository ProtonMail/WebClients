export default {
    model_list: [
        {
            model_url: 'https://mail.proton.me/llm/Mistral-7B-Instruct-v0.2.30/ndarray-cache.json',
            model_id: 'Mistral-7B-Instruct-v0.2-q4f16_1',
            model_lib_url:
                'https://mail.proton.me/assets/ml-models/v0_2_30/Mistral-7B-Instruct-v0.2-q4f16_1-sw4k_cs1k-webgpu.wasm',
            vram_required_MB: 6079.02,
            low_resource_required: false,
            required_features: ['shader-f16'],
        },
    ],
    use_web_worker: true,
};
