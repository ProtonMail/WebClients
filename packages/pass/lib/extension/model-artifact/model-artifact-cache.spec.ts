import { detectionClasses } from '@protontech/autofill/types';
import type { DetectionClass } from '@protontech/autofill/types';

import type { ModelArtifact } from './model-artifact';
import { mergeModelArtifactCache, parseModelArtifactCache, validateModelArtifactCache } from './model-artifact-cache';

/** Empty `coeffs` trivially satisfies pass-ml's structural validation. */
const validPerceptronWeights = () =>
    Object.fromEntries(detectionClasses.map((klass) => [klass, { bias: 0, coeffs: [] }])) as Record<
        DetectionClass,
        { bias: number; coeffs: [] }
    >;

describe('`validateModelArtifactCache`/`parseModelArtifactCache`', () => {
    const artifact: ModelArtifact = { modelId: '2026.8.2475-lr', arch: 'lr', weights: validPerceptronWeights() };

    test('parses an empty cache from `null`', () => {
        const result = parseModelArtifactCache(null);
        expect(result).toEqual({ ok: true, cache: {} });
    });

    test('parses a valid cache', () => {
        const result = parseModelArtifactCache(JSON.stringify({ [artifact.modelId]: artifact }));
        expect(result).toEqual({ ok: true, cache: { [artifact.modelId]: artifact } });
    });

    test('fails on invalid JSON', () => {
        const result = parseModelArtifactCache('{not-json');
        expect(result.ok).toBe(false);
    });

    test('fails when a cache entry is malformed', () => {
        const result = validateModelArtifactCache({ [artifact.modelId]: { arch: 'lr' } });
        expect(result.ok).toBe(false);
    });
});

describe('`mergeModelArtifactCache`', () => {
    const artifact = (modelId: string): ModelArtifact => ({ modelId, arch: 'lr', weights: validPerceptronWeights() });

    test('adds a new entry', () => {
        const cache = mergeModelArtifactCache({}, artifact('control-model'));
        expect(Object.keys(cache)).toEqual(['control-model']);
    });

    test('refreshes an existing entry in place', () => {
        const cache = mergeModelArtifactCache(
            { 'control-model': artifact('control-model') },
            artifact('control-model')
        );
        expect(Object.keys(cache)).toEqual(['control-model']);
    });

    test('evicts the oldest entry once the cache exceeds 2 models', () => {
        let cache = mergeModelArtifactCache({}, artifact('model-a'));
        cache = mergeModelArtifactCache(cache, artifact('model-b'));
        cache = mergeModelArtifactCache(cache, artifact('model-c'));

        expect(Object.keys(cache)).toEqual(['model-b', 'model-c']);
    });
});
