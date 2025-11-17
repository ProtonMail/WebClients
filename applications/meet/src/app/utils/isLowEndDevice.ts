export const isLowEndDevice = (): boolean => {
    const cpuLogicalCores = navigator.hardwareConcurrency ?? 1;

    const deviceMemoryGB = (navigator as any).deviceMemory;
    const isLowMemory = typeof deviceMemoryGB === 'number' ? deviceMemoryGB <= 4 : false;

    let isLowGpuConstrained = false;
    try {
        const testCanvas = document.createElement('canvas');
        const gl2 = testCanvas.getContext('webgl2') as WebGL2RenderingContext | null;
        if (gl2) {
            const webglMaxTextureSize = gl2.getParameter(gl2.MAX_TEXTURE_SIZE) as number;
            if (!webglMaxTextureSize || webglMaxTextureSize <= 4096) {
                isLowGpuConstrained = true;
            }
        }
    } catch {}

    return cpuLogicalCores <= 4 || isLowMemory || isLowGpuConstrained;
};
