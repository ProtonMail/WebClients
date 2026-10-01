import { detectionClasses } from '@protontech/autofill/types';

import {
    createModelProvider,
    fetchModelArtifact,
    getModelArch,
    getModelArtifactURL,
    isModelArch,
} from './model-artifact';
import type { ModelArtifact } from './model-artifact';

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

const makeArtifactZip = async (files: Record<string, unknown>, rawFiles: Record<string, string> = {}) => {
    const zip = await import('@zip.js/zip.js');
    zip.configure({ useWebWorkers: false, useCompressionStream: false });
    const blobWriter = new zip.BlobWriter('application/zip');
    const writer = new zip.ZipWriter(blobWriter);
    for (const [filename, content] of Object.entries(files)) {
        await writer.add(filename, new zip.TextReader(JSON.stringify(content)));
    }
    for (const [filename, content] of Object.entries(rawFiles)) {
        await writer.add(filename, new zip.TextReader(content));
    }
    await writer.close();
    return blobWriter.getData();
};

describe('`isModelArch`', () => {
    test.each(['rf'])('"%s" is a valid arch', (value) => {
        expect(isModelArch(value)).toBe(true);
    });

    // `lr` was retired with the perceptron model (IDTEAM-6575): artifacts advertising it must
    // now be rejected outright rather than silently loaded.
    test.each(['lr', 'xx', ''])('"%s" is not a valid arch', (value) => {
        expect(isModelArch(value)).toBe(false);
    });
});

describe('`getModelArch`', () => {
    test.each([
        ['2026.10.1-rf', 'rf'],
        ['2026.10.2554-rf', 'rf'],
    ])('resolves the arch for "%s"', (modelId, arch) => {
        const result = getModelArch(modelId);
        expect(result.ok).toBe(true);
        if (result.ok) expect(result.arch).toBe(arch);
    });

    test.each([
        '1.40.2-bundled',
        'not-a-model-id',
        '2026.10.2554-xx',
        '2026.10.2554-rf-extra',
        ' 2026.10.2554-rf',
        '2026.10.-rf',
        '2026.10.2554.1-rf',
        '2026.10.2554-RF',
        '2026.8.2475-lr',
    ])('fails for "%s"', (modelId) => {
        const result = getModelArch(modelId);
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error).toContain(modelId);
    });
});

describe('`getModelArtifactURL`', () => {
    test('builds the per-model artifact URL', () => {
        expect(getModelArtifactURL('2026.10.2554-rf')).toBe(
            'https://proton.me/download/pass/model-artifacts/2026.10.2554-rf/model-artifact.zip'
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
    test('constructs a provider from valid random forest weights', () => {
        const result = createModelProvider({
            modelId: '2026.10.2554-rf',
            arch: 'rf',
            weights: validRandomForestWeights() as any,
        });
        expect(result.ok).toBe(true);
        if (result.ok) expect(result.provider.email).toHaveProperty('model');
    });

    test('fails with a descriptive error on malformed weights', () => {
        const weights = validRandomForestWeights();
        delete (weights as any).email;

        const result = createModelProvider({ modelId: '2026.10.2554-rf', arch: 'rf', weights: weights as any });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error).toContain('email');
    });

    test('joins multiple validation problems into one error message', () => {
        const weights = validRandomForestWeights();
        delete (weights as any).email;
        delete (weights as any).otp;

        const result = createModelProvider({ modelId: '2026.10.2554-rf', arch: 'rf', weights: weights as any });
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

describe('`fetchModelArtifact`', () => {
    const fetchMock = jest.spyOn(global, 'fetch' as any);

    afterEach(() => fetchMock.mockReset());
    afterAll(() => fetchMock.mockRestore());

    test('fetches, unzips and validates a real artifact', async () => {
        const files = Object.fromEntries(
            detectionClasses.map((klass) => [`${klass}-model.json`, validRandomForestWeights()[klass]])
        );
        const blob = await makeArtifactZip(files);
        fetchMock.mockResolvedValue({ ok: true, blob: () => Promise.resolve(blob) } as Response);

        const result = await fetchModelArtifact('2026.10.2554-rf');
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.artifact.modelId).toBe('2026.10.2554-rf');
            expect(result.artifact.arch).toBe('rf');
        }
        expect(fetchMock).toHaveBeenCalledWith(getModelArtifactURL('2026.10.2554-rf'));
    });

    test('fails when a class file is missing from the zip', async () => {
        const weights = validRandomForestWeights();
        const files = Object.fromEntries(
            detectionClasses
                .filter((klass) => klass !== 'email')
                .map((klass) => [`${klass}-model.json`, weights[klass]])
        );
        const blob = await makeArtifactZip(files);
        fetchMock.mockResolvedValue({ ok: true, blob: () => Promise.resolve(blob) } as Response);

        const result = await fetchModelArtifact('2026.10.2554-rf');
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error).toContain('email-model.json');
    });

    test('propagates the real JSON.parse error instead of a generic message', async () => {
        const weights = validRandomForestWeights();
        const files = Object.fromEntries(
            detectionClasses
                .filter((klass) => klass !== 'email')
                .map((klass) => [`${klass}-model.json`, weights[klass]])
        );

        const blobA = await makeArtifactZip(files, { 'email-model.json': '{not-json' });
        fetchMock.mockResolvedValueOnce({ ok: true, blob: () => Promise.resolve(blobA) } as Response);
        const resultA = await fetchModelArtifact('2026.10.2554-rf');

        const blobB = await makeArtifactZip(files, { 'email-model.json': '[1, 2' });
        fetchMock.mockResolvedValueOnce({ ok: true, blob: () => Promise.resolve(blobB) } as Response);
        const resultB = await fetchModelArtifact('2026.10.2554-rf');

        expect(resultA.ok).toBe(false);
        expect(resultB.ok).toBe(false);
        if (!resultA.ok && !resultB.ok) {
            expect(resultA.error).toContain('email-model.json');
            expect(resultB.error).toContain('email-model.json');
            // A hardcoded/generic fallback would make these identical regardless of input.
            expect(resultA.error).not.toBe(resultB.error);
        }
    });

    test('fails on structurally invalid weights without throwing', async () => {
        const files = Object.fromEntries(
            detectionClasses.map((klass) => [`${klass}-model.json`, { bias: 'not-a-number', coeffs: [] }])
        );
        const blob = await makeArtifactZip(files);
        fetchMock.mockResolvedValue({ ok: true, blob: () => Promise.resolve(blob) } as Response);

        const result = await fetchModelArtifact('2026.10.2554-rf');
        expect(result.ok).toBe(false);
    });

    test('fails when the zip archive is corrupt', async () => {
        fetchMock.mockResolvedValue({ ok: true, blob: () => Promise.resolve(new Blob(['not a zip'])) } as Response);

        const result = await fetchModelArtifact('2026.10.2554-rf');
        expect(result.ok).toBe(false);
        // Proves the real rejection reason propagates rather than falling back to the generic message.
        if (!result.ok) expect(result.error).not.toBe('model artifact is not a valid zip archive');
    });

    test('fails without fetching for an unrecognized model ID', async () => {
        const result = await fetchModelArtifact('not-a-model-id');
        expect(result.ok).toBe(false);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    test('fails without fetching for a retired perceptron model ID', async () => {
        const result = await fetchModelArtifact('2026.8.2475-lr');
        expect(result.ok).toBe(false);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    test('fails when the response is not ok', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 404 } as Response);

        const result = await fetchModelArtifact('2026.10.2554-rf');
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error).toContain('404');
    });

    test('fails without throwing when the network request rejects', async () => {
        fetchMock.mockRejectedValue(new Error('network down'));

        const result = await fetchModelArtifact('2026.10.2554-rf');
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error).toContain('network down');
    });
});
