import type { ModelArtifact } from './model-artifact';
import { mergeModelArtifactCache, parseModelArtifactCache, validateModelArtifactCache } from './model-artifact-cache';

// The cache layer only validates structure (string modelId, known arch, object weights) —
// real weight validation happens in `createModelProvider` at load time.
const artifactFixture = (modelId: string): ModelArtifact => ({ modelId, arch: 'rf', weights: {} as never });

describe('`validateModelArtifactCache`/`parseModelArtifactCache`', () => {
    const artifact: ModelArtifact = artifactFixture('2026.10.2554-rf');
    const rfArtifact: ModelArtifact = artifactFixture('2026.8.2475-rf');

    test('parses an empty cache from `null`', () => {
        const result = parseModelArtifactCache(null);
        expect(result).toEqual({ ok: true, cache: {} });
    });

    test('parses a valid cache', () => {
        const result = parseModelArtifactCache(JSON.stringify({ [artifact.modelId]: artifact }));
        expect(result).toEqual({ ok: true, cache: { [artifact.modelId]: artifact } });
    });

    test('accepts an `rf` entry', () => {
        const result = validateModelArtifactCache({ [rfArtifact.modelId]: rfArtifact });
        expect(result).toEqual({ ok: true, cache: { [rfArtifact.modelId]: rfArtifact } });
    });

    test('fails on invalid JSON', () => {
        const result = parseModelArtifactCache('{not-json');
        expect(result.ok).toBe(false);
        // Proves the real rejection reason propagates rather than falling back to the generic message.
        if (!result.ok) expect(result.error).not.toBe('cached model artifacts are not valid JSON');
    });

    test.each([
        ['not an object', '42'],
        ['an array', '[]'],
        ['a string', '"str"'],
    ])('fails when the parsed JSON is %s', (_label, json) => {
        const result = parseModelArtifactCache(json);
        expect(result.ok).toBe(false);
    });

    test('fails when a non-first cache entry is malformed', () => {
        const result = validateModelArtifactCache({
            [artifact.modelId]: artifact,
            'other-model': { arch: 'rf' },
        });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error).toContain('other-model');
    });

    test.each([
        ['missing `modelId`', { arch: 'rf', weights: {} }],
        ['missing `arch`', { modelId: 'x', weights: {} }],
        ['an unrecognized `arch`', { modelId: 'x', arch: 'xgboost', weights: {} }],
        ['a retired `arch`', { modelId: 'x', arch: 'lr', weights: {} }],
        ['non-object `weights`', { modelId: 'x', arch: 'rf', weights: 'not-an-object' }],
    ])('fails when a cache entry has %s', (_label, entry) => {
        const result = validateModelArtifactCache({ x: entry });
        expect(result.ok).toBe(false);
    });
});

describe('`mergeModelArtifactCache`', () => {
    const artifact = (modelId: string): ModelArtifact => ({ modelId, arch: 'rf', weights: {} as never });

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

    test('protects a just-refreshed entry from eviction', () => {
        let cache = mergeModelArtifactCache({}, artifact('model-a'));
        cache = mergeModelArtifactCache(cache, artifact('model-b'));
        cache = mergeModelArtifactCache(cache, artifact('model-a'));
        cache = mergeModelArtifactCache(cache, artifact('model-c'));

        expect(Object.keys(cache)).toEqual(['model-a', 'model-c']);
    });

    test('converges an already-over-limit cache to 2 entries in one merge', () => {
        const overLimitCache = {
            'model-a': artifact('model-a'),
            'model-b': artifact('model-b'),
            'model-c': artifact('model-c'),
        };

        const cache = mergeModelArtifactCache(overLimitCache, artifact('model-d'));

        expect(Object.keys(cache)).toEqual(['model-c', 'model-d']);
    });
});
