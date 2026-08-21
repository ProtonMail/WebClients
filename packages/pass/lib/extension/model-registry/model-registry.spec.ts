import { resolveModelId } from './model-registry';

describe('`resolveModelId`', () => {
    const bundled = '1.40.2-bundled';

    test('returns the model ID for the given group', () => {
        const registry = { control: '2026.10.1-lr', challenger: '2026.10.2-rf' };
        expect(resolveModelId(registry, 'control', bundled)).toBe('2026.10.1-lr');
        expect(resolveModelId(registry, 'challenger', bundled)).toBe('2026.10.2-rf');
    });

    test('falls back to the bundled model ID when the registry has no entry for the group', () => {
        expect(resolveModelId({ control: '2026.10.1-lr' }, 'challenger', bundled)).toBe(bundled);
    });

    test('falls back to the bundled model ID when the registry is null', () => {
        expect(resolveModelId(null, 'control', bundled)).toBe(bundled);
    });
});
