import { createPerceptronModelProvider } from '@protontech/autofill/models/perceptron';
import { createRandomForestModelProvider } from '@protontech/autofill/models/random_forest';
import { formatValidationProblem } from '@protontech/autofill/models/validate_weights';
import { detectionClasses } from '@protontech/autofill/types';
import type { DetectionClass, ModelProvider, PerceptronParams } from '@protontech/autofill/types';

import { MODEL_ARTIFACTS_BASE_URL } from '@proton/pass/constants';
import { readZIP } from '@proton/pass/lib/import/helpers/zip.reader';
import type { Result } from '@proton/pass/types';
import { escapeRegex } from '@proton/shared/lib/helpers/regex';

const MODEL_ARCH_VALUES = ['lr', 'rf'] as const;
export type ModelArch = (typeof MODEL_ARCH_VALUES)[number];
export const isModelArch = (name: string): name is ModelArch => (MODEL_ARCH_VALUES as readonly string[]).includes(name);

const MODEL_ID_RE = new RegExp(
    `^(?<year>\\d{4})\\.(?<month>\\d{1,2})\\.(?<pipelineId>\\d+)-(?<arch>${MODEL_ARCH_VALUES.map(escapeRegex).join('|')})$`
);

export const getModelArch = (modelId: string): Result<{ arch: ModelArch }> => {
    const arch = modelId.match(MODEL_ID_RE)?.groups?.arch;
    if (!arch || !isModelArch(arch)) return { ok: false, error: `unrecognized model ID "${modelId}"` };
    return { ok: true, arch };
};

export const getModelArtifactURL = (modelId: string): string =>
    `${MODEL_ARTIFACTS_BASE_URL}/${encodeURIComponent(modelId)}/model-artifact.zip`;

type PerceptronWeights = Record<DetectionClass, PerceptronParams>;
type RandomForestWeights = Parameters<typeof createRandomForestModelProvider>[0];

export type ModelArtifact =
    | { modelId: string; arch: 'lr'; weights: PerceptronWeights }
    | { modelId: string; arch: 'rf'; weights: RandomForestWeights };

export const createModelProvider = (artifact: ModelArtifact): Result<{ provider: ModelProvider }> => {
    if (!isModelArch(artifact.arch)) {
        return { ok: false, error: `unrecognized model architecture "${artifact.arch}"` };
    }

    let result: ReturnType<typeof createPerceptronModelProvider> | ReturnType<typeof createRandomForestModelProvider>;

    switch (artifact.arch) {
        case 'lr':
            result = createPerceptronModelProvider(artifact.weights);
            break;
        case 'rf':
            result = createRandomForestModelProvider(artifact.weights);
            break;
    }

    if (result.ok) return { ok: true, provider: result.value };
    return { ok: false, error: result.error.map(formatValidationProblem).join('; ') };
};

export const fetchModelArtifact = async (modelId: string): Promise<Result<{ artifact: ModelArtifact }>> => {
    const archResult = getModelArch(modelId);
    if (!archResult.ok) return archResult;
    const { arch } = archResult;

    let blob: Blob;
    try {
        const response = await fetch(getModelArtifactURL(modelId));
        if (!response.ok) return { ok: false, error: `failed to fetch model artifact: ${response.status}` };
        blob = await response.blob();
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'unknown error fetching model artifact' };
    }

    let reader: Awaited<ReturnType<typeof readZIP>>;
    try {
        reader = await readZIP(new File([blob], 'model-artifact.zip'));
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'model artifact is not a valid zip archive' };
    }

    const weights = {} as Record<DetectionClass, unknown>;

    try {
        for (const klass of detectionClasses) {
            const entry = await reader.getFile(`${klass}-model.json`);
            if (!entry) return { ok: false, error: `model artifact is missing "${klass}-model.json"` };

            try {
                weights[klass] = JSON.parse(await entry.text());
            } catch {
                return { ok: false, error: `"${klass}-model.json" is not valid JSON` };
            }
        }
    } finally {
        reader.close();
    }

    const artifact = { modelId, arch, weights } as ModelArtifact;
    const validated = createModelProvider(artifact);
    if (!validated.ok) return { ok: false, error: validated.error };

    return { ok: true, artifact };
};
