import { GpuAssessmentResult } from '@proton/llm/lib/types';
import { isBrave } from '@proton/shared/lib/helpers/browser';

type HardwareSpecs = {
    userAgent: string;
    deviceMemory: any;
    platform: string;
    webGlRenderer: string;
    webGlVendor: string;
};

const isBlacklisted = (specs: HardwareSpecs, adapter: GPUAdapter): GpuAssessmentResult | null => {
    // Returns null if not blacklisted, else returns a reason why it was blacklisted

    // Check FP16 support.
    // Some graphics cards like GTX 1060 have enough RAM (6GB) but lack FP16 support, so we must blacklist them.
    if (!adapter.features.has('shader-f16')) {
        console.error("Feature 'shader-f16' is not supported by this GPU adapter, but is required to run the LLM.");
        if (isBrave()) {
            console.error(
                "It looks like you're running Brave. In some cases, Brave may not expose the 'shader-f16' feature. " +
                    'Consider trying in another Chromium browser.'
            );
            return 'noShaderF16Brave';
        } else {
            return 'noShaderF16';
        }
    }

    // Unlike what the name says, 'MacIntel' appears for both older Intel CPUs and newer Apple CPUs (M1 and later).
    let isMac = specs.platform === 'MacIntel';
    if (isMac) {
        // The following criterion on maxBufferSize was chosen not because of the impact on the LLM, but because
        // based on hardware data analysis on a bunch of machines, it was a good differentiator of pre- vs post-M1.
        const macPostM1 = adapter.limits.maxBufferSize >= 4294967292;
        if (!macPostM1) {
            console.error('Mac with Intel chips are not sufficiently powerful for LLM text generation.');
            return 'macPreM1';
        }
    } else {
        // We lack sufficient data to distinguish Windows/Linux machines that have decent hardware, but we've seen at
        // least one Windows configuration where the maxBufferSize was < 4294967292 yet the LLM was working well.
        // I'm putting this criterion for now, but it's likely inexact and will have to evolve over time.
        const maxBufferSizeTooLow = adapter.limits.maxBufferSize < 2147483644;
        if (maxBufferSizeTooLow) {
            console.error(`maxBufferSize = ${adapter.limits.maxBufferSize} could be too low to run the LLM`);
            return 'maxBufferSizeTooLow';
        }
    }

    return null; // ok
};

export const checkGpu = async (): Promise<GpuAssessmentResult> => {
    const canvas = document.createElement('canvas');

    // Gather specs
    let webGlRenderer: string | undefined;
    let webGlVendor: string | undefined;
    if (canvas) {
        const gl = canvas.getContext('webgl');
        if (!gl) {
            return 'noWebGpu'; // no WebGL really, but it doesn't change the conclusion
        }
        webGlRenderer = gl.getParameter(gl.RENDERER);
        webGlVendor = gl.getParameter(gl.VENDOR);
    }
    const specs: HardwareSpecs = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        // @ts-ignore
        deviceMemory: navigator.deviceMemory || null,
        webGlRenderer: webGlRenderer || '',
        webGlVendor: webGlVendor || '',
    };

    // Test if there's enough memory
    // ...except for Brave, which under-reports the device memory
    // https://github.com/brave/brave-browser/issues/1157
    if (!isBrave()) {
        if (specs.deviceMemory !== null && specs.deviceMemory < 8) {
            console.error('This machine reports RAM under 8GB which may be too low to run the LLM.');
            return 'insufficientRam';
        }
    }

    // Test if we can load webgpu
    try {
        const navigator = globalThis.navigator as any;
        const adapter: GPUAdapter | undefined = await navigator.gpu.requestAdapter();
        if (!adapter) {
            console.error('WebGPU is not available.');
            if (specs.userAgent.includes('Firefox')) {
                return 'noWebGpuFirefox';
            } else {
                return 'noWebGpu';
            }
        }
        // Test if system is not blacklisted
        const reason = isBlacklisted(specs, adapter);
        if (reason) {
            return reason;
        }
    } catch (e) {
        console.error(e);
        if (specs.userAgent.includes('Firefox')) {
            return 'noWebGpuFirefox';
        } else {
            return 'noWebGpu';
        }
    }

    return 'ok';
};
