import { detectionClasses } from '@protontech/autofill/types';
import type { DetectionClass } from '@protontech/autofill/types';

import { createModelProvider, getModelArch, getModelArtifactURL, isModelArch } from './model-artifact';
import type { ModelArtifact } from './model-artifact';

/** Empty `coeffs` trivially satisfies pass-ml's structural validation. */
const validPerceptronWeights = () =>
    Object.fromEntries(detectionClasses.map((klass) => [klass, { bias: 0, coeffs: [] }])) as Record<
        DetectionClass,
        { bias: number; coeffs: [] }
    >;

const validRandomForestWeights = () =>
    Object.fromEntries(
        detectionClasses.map((klass) => [
            klass,
            {
                feature_names: [],
                objective: 'binary:logistic',
                trees: [
                    {
                        left_children: [-1],
                        right_children: [-1],
                        split_conditions: [0],
                        split_indices: [0],
                        split_type: [0],
                        default_left: [false],
                    },
                ],
                tree_info: [0],
            },
        ])
    );

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

describe('`createModelProvider`', () => {
    test('constructs a provider from valid perceptron weights', () => {
        const result = createModelProvider({
            modelId: '2026.8.2475-lr',
            arch: 'lr',
            weights: validPerceptronWeights(),
        });
        expect(result.ok).toBe(true);
        if (result.ok) expect(result.provider.email).toHaveProperty('model');
    });

    test('constructs a provider from valid random forest weights', () => {
        const result = createModelProvider({
            modelId: '2026.8.2475-rf',
            arch: 'rf',
            weights: validRandomForestWeights() as any,
        });
        expect(result.ok).toBe(true);
        if (result.ok) expect(result.provider.email).toHaveProperty('model');
    });

    test('fails with a descriptive error on malformed weights', () => {
        const weights = validPerceptronWeights();
        delete (weights as any).email;

        const result = createModelProvider({ modelId: '2026.8.2475-lr', arch: 'lr', weights });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error).toContain('email');
    });

    test('joins multiple validation problems into one error message', () => {
        const weights = validPerceptronWeights();
        delete (weights as any).email;
        delete (weights as any).otp;

        const result = createModelProvider({ modelId: '2026.8.2475-lr', arch: 'lr', weights });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error!.split('; ')).toHaveLength(2);
    });

    test('fails without throwing on an unrecognized architecture', () => {
        const artifact = { modelId: '2027.1.1-nn', arch: 'nn', weights: {} } as unknown as ModelArtifact;

        const result = createModelProvider(artifact);
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error).toContain('nn');
    });
});
