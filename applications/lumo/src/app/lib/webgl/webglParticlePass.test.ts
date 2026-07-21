import { createWebglParticlePass } from './webglParticlePass';

/** Minimal recording WebGL mock: records method-call names; treats UPPER_CASE props as GL constants. */
function createMockGl() {
    const calls: string[] = [];
    let attrib = 0;
    const target: any = { drawingBufferWidth: 400, drawingBufferHeight: 800 };
    const gl = new Proxy(target, {
        get(t, prop: string) {
            if (prop in t) return t[prop];
            switch (prop) {
                case 'getShaderParameter':
                case 'getProgramParameter':
                    return () => true;
                case 'getUniformLocation':
                    return (_p: unknown, name: string) => ({ name });
                case 'getAttribLocation':
                    return () => attrib++;
                case 'createShader':
                case 'createProgram':
                case 'createBuffer':
                case 'createTexture':
                    return () => ({});
                default:
                    if (typeof prop === 'string' && /^[A-Z0-9_]+$/.test(prop)) return prop;
                    return (..._args: unknown[]) => {
                        calls.push(prop);
                    };
            }
        },
    });
    return { gl: gl as unknown as WebGLRenderingContext, calls };
}

const OPTIONS = { spacing: 40, size: 1.65, alpha: 0.72 };

describe('webglParticlePass Tier A', () => {
    it('allocates the sample texture once on resize via texImage2D', () => {
        const { gl, calls } = createMockGl();
        const pass = createWebglParticlePass(gl, OPTIONS)!;
        calls.length = 0;
        pass.resize(400, 800, 1);
        expect(calls.filter((c) => c === 'texImage2D')).toHaveLength(1);
    });
});

describe('webglParticlePass Tier B split', () => {
    it('render() draws points and does NOT copy the framebuffer', () => {
        const { gl, calls } = createMockGl();
        const pass = createWebglParticlePass(gl, OPTIONS) as any;
        pass.resize(400, 800, 1);
        calls.length = 0;
        pass.render({ timeSec: 1, mouseX: 0, mouseY: 0, baseColor: [0, 0, 0] });
        expect(calls).toContain('drawArrays');
        expect(calls).not.toContain('copyTexSubImage2D');
        expect(calls).not.toContain('texImage2D');
    });

    it('sampleFramebuffer() copies via copyTexSubImage2D', () => {
        const { gl, calls } = createMockGl();
        const pass = createWebglParticlePass(gl, OPTIONS) as any;
        pass.resize(400, 800, 1);
        calls.length = 0;
        pass.sampleFramebuffer();
        expect(calls).toContain('copyTexSubImage2D');
    });
});
