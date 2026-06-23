// GPUs known to struggle with real-time video segmentation. Matched against the
// WebGL unmasked renderer string. Intentionally conservative — anything not
// listed here is left to the runtime degrader to catch via frame-time feedback.
const WEAK_GPU_PATTERNS = [
    /Intel\(R\)?.*\bHD Graphics\b/i, // Intel HD 2000–6000 (Sandy Bridge → Skylake)
    /Intel\(R\)?.*\bUHD Graphics 6\d{2}\b/i, // Intel UHD 600/610/615/620/630 (Kaby Lake → Comet Lake)
    /Intel\(R\)?.*\bIris\b(?!.*Xe)/i, // Intel Iris / Iris Plus (pre-Xe), borderline for multiclass
    /Intel.*\bGMA\b|Mobile Intel/i, // Intel GMA (945/X3100) & older mobile chipsets (pre-HD branding)
    /\bRadeon\b.*\b(Vega 3|Vega 6|Vega 8|R[2-7]|HD [2-8]\d{3})\b/i, // low-end AMD APUs / old Radeon (HD 2000–8000, R2–R7)
    /GeForce\b.*\b(8\d{3}|9\d{3}|GTX? ?[2-7]\d0|MX ?[12]\d0)\b/i, // legacy & entry NVIDIA GeForce (8/9 series, GT(X) x10–x30, MX 1xx/2xx)
    /\bION\b/i, // NVIDIA ION chipset
    /\bMali\b|\bAdreno\b/i, // ARM/Qualcomm GPUs on Windows-on-ARM & Chromebooks (mobile is excluded upstream)
    /SwiftShader|llvmpipe|ANGLE_NULL|Software/i, // software fallback (no GPU acceleration)
];

// Old DirectX feature levels exposed through ANGLE's renderer string on Windows.
// `vs_4_0`/`ps_4_0` (or lower) and Direct3D9 indicate pre-D3D11 / very old GPUs.
const OLD_ANGLE_FEATURE_LEVEL = /Direct3D9|vs_[1-4]_\d|ps_[1-4]_\d/i;

// Below this, the GPU is too constrained for the multiclass model's texture work.
const MIN_TEXTURE_SIZE = 4096;

// The multiclass path binds up to 6 confidence textures plus mask/output units.
// The WebGL2 floor is 16; anything near it suggests an under-powered/under-
// reporting driver.
const MIN_TEXTURE_IMAGE_UNITS = 12;

const getWebGLRenderer = (): string => {
    try {
        const canvas = document.createElement('canvas');
        const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as
            | WebGL2RenderingContext
            | WebGLRenderingContext
            | null;
        if (!gl) {
            return '';
        }
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = debugInfo
            ? (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string)
            : (gl.getParameter(gl.RENDERER) as string);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return renderer ?? '';
    } catch {
        return '';
    }
};

// Asks the browser whether it would only serve a slow/software renderer for this
// context. A null context with failIfMajorPerformanceCaveat means the GPU is
// blocklisted, software-emulated, or otherwise unsuitable for real-time work —
// catching cases (VMs, remote desktop, bad drivers) the renderer regex misses.
const hasMajorPerformanceCaveat = (): boolean => {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) as WebGL2RenderingContext | null;
        if (!gl) {
            return true;
        }
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return false;
    } catch {
        return true;
    }
};

// Probes for the WASM SIMD extension. MediaPipe's CPU delegate runs the
// segmenter in WASM, and without SIMD the multiclass model is unusable in real
// time — so its absence is a strong signal to fall back to the lighter model.
const hasWasmSimd = (): boolean => {
    try {
        return WebAssembly.validate(
            new Uint8Array([
                0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253,
                98, 11,
            ])
        );
    } catch {
        return false;
    }
};

export const isLowEndDevice = (): boolean => {
    const cpuLogicalCores = navigator.hardwareConcurrency ?? 1;

    const deviceMemoryGB = (navigator as any).deviceMemory;
    const isLowMemory = typeof deviceMemoryGB === 'number' ? deviceMemoryGB <= 4 : false;

    // Windows reports SMT/HT threads in hardwareConcurrency, so an "8-thread" machine
    // often has only 4 physical cores competing with Defender/OneDrive/etc.
    // Require strictly more logical cores on Windows to clear the bar.
    const isWindows = /Windows/i.test(navigator.userAgent);
    const isLowCpu = isWindows ? cpuLogicalCores < 8 : cpuLogicalCores <= 4;

    let isLowGpuConstrained = false;
    try {
        const testCanvas = document.createElement('canvas');
        const gl2 = testCanvas.getContext('webgl2') as WebGL2RenderingContext | null;
        if (gl2) {
            const webglMaxTextureSize = gl2.getParameter(gl2.MAX_TEXTURE_SIZE) as number;
            const maxTextureImageUnits = gl2.getParameter(gl2.MAX_TEXTURE_IMAGE_UNITS) as number;
            if (
                !webglMaxTextureSize ||
                webglMaxTextureSize <= MIN_TEXTURE_SIZE ||
                !maxTextureImageUnits ||
                maxTextureImageUnits < MIN_TEXTURE_IMAGE_UNITS
            ) {
                isLowGpuConstrained = true;
            }
            gl2.getExtension('WEBGL_lose_context')?.loseContext();
        } else {
            isLowGpuConstrained = true;
        }
    } catch {}

    const renderer = getWebGLRenderer();
    const isWeakGpu = renderer
        ? WEAK_GPU_PATTERNS.some((re) => re.test(renderer)) || OLD_ANGLE_FEATURE_LEVEL.test(renderer)
        : false;

    const noWasmSimd = !hasWasmSimd();

    const isGpuPerformanceCaveat = hasMajorPerformanceCaveat();

    return isLowCpu || isLowMemory || isLowGpuConstrained || isWeakGpu || noWasmSimd || isGpuPerformanceCaveat;
};
