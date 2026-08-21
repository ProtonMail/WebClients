import { getModelArch, getModelArtifactURL, isModelArch } from './model-artifact';

describe('`isModelArch`', () => {
    test.each(['lr', 'rf'])('"%s" is a valid arch', (value) => {
        expect(isModelArch(value)).toBe(true);
    });

    test.each(['xx', ''])('"%s" is not a valid arch', (value) => {
        expect(isModelArch(value)).toBe(false);
    });
});

describe('`getModelArch`', () => {
    test.each([
        ['2026.8.2475-lr', 'lr'],
        ['2026.10.1-rf', 'rf'],
    ])('resolves the arch for "%s"', (modelId, arch) => {
        const result = getModelArch(modelId);
        expect(result.ok).toBe(true);
        if (result.ok) expect(result.arch).toBe(arch);
    });

    test.each([
        '1.40.2-bundled',
        'not-a-model-id',
        '2026.8.2475-xx',
        '2026.8.2475-lr-extra',
        ' 2026.8.2475-lr',
        '2026.8.-lr',
        '2026.8.2475.1-lr',
        '2026.8.2475-LR',
    ])('fails for "%s"', (modelId) => {
        const result = getModelArch(modelId);
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error).toContain(modelId);
    });
});

describe('`getModelArtifactURL`', () => {
    test('builds the per-model artifact URL', () => {
        expect(getModelArtifactURL('2026.8.2475-lr')).toBe(
            'https://proton.me/download/pass/model-artifacts/2026.8.2475-lr/model-artifact.zip'
        );
    });

    test('passes a malformed model ID through unvalidated', () => {
        expect(getModelArtifactURL('not-a-valid-id')).toBe(
            'https://proton.me/download/pass/model-artifacts/not-a-valid-id/model-artifact.zip'
        );
    });

    test('encodes a model ID containing path-traversal or URL-breaking characters', () => {
        expect(getModelArtifactURL('../../etc/passwd')).toBe(
            'https://proton.me/download/pass/model-artifacts/..%2F..%2Fetc%2Fpasswd/model-artifact.zip'
        );
        expect(getModelArtifactURL('foo?bar#baz')).toBe(
            'https://proton.me/download/pass/model-artifacts/foo%3Fbar%23baz/model-artifact.zip'
        );
    });
});
