import { GpuAssessmentResult } from '@proton/llm/lib/types';

type HardwareSpecs = {
    userAgent: string;
    deviceMemory: any;
    platform: string;
    webGlRenderer: string;
    webGlVendor: string;
};

const isBlacklisted = (specs: HardwareSpecs): boolean => {
    // This function is meant to be completed with more cases
    const isMacPreAppleSilicon = specs.userAgent.match(/OS X 10_([789]|1[01234])/);
    if (isMacPreAppleSilicon) return true;
    return false;
};

export const checkGpu = async (): Promise<GpuAssessmentResult> => {
    const canvas = document.createElement('canvas');

    // Gather specs
    let webGlRenderer: string | undefined;
    let webGlVendor: string | undefined;
    if (canvas) {
        const gl = canvas.getContext('webgl');
        if (!gl) {
            return 'noWebGpu'; // no WebGL really, but it doesn't really change the conclusion
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

    // Test if system is not blacklisted
    if (isBlacklisted(specs)) {
        return 'blacklisted';
    }

    // Test if there's enough memory
    if (specs.deviceMemory !== null && specs.deviceMemory < 8) {
        return 'insufficientRam';
    }

    // Test if we can load webgpu
    try {
        // TODO fixme
        const navigator = globalThis.navigator as any;
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            if (specs.userAgent.includes('Firefox')) {
                return 'noWebGpuFirefox';
            } else {
                return 'noWebGpu';
            }
        }
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);
        if (specs.userAgent.includes('Firefox')) {
            return 'noWebGpuFirefox';
        } else {
            return 'noWebGpu';
        }
    }

    return 'ok';
};
