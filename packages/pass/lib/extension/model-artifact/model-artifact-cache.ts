import { isModelArch } from '@proton/pass/lib/extension/model-artifact/model-artifact';
import type { ModelArtifact } from '@proton/pass/lib/extension/model-artifact/model-artifact';
import type { MaybeNull, Result } from '@proton/pass/types';
import { isObject } from '@proton/pass/utils/object/is-object';

export type ModelArtifactCache = Record<string, ModelArtifact>;

/** One entry per experiment group (`control`/`challenger`) */
const MAX_CACHED_MODEL_ARTIFACTS = 2;

const isModelArtifact = (data: unknown): data is ModelArtifact => {
    if (!isObject(data)) return false;
    const { modelId, arch, weights } = data as Record<string, unknown>;
    return typeof modelId === 'string' && typeof arch === 'string' && isModelArch(arch) && isObject(weights);
};

export const validateModelArtifactCache = (data: unknown): Result<{ cache: ModelArtifactCache }> => {
    if (!isObject(data)) return { ok: false, error: 'model artifact cache is not an object' };

    for (const [modelId, artifact] of Object.entries(data)) {
        if (!isModelArtifact(artifact)) {
            return { ok: false, error: `model artifact cache entry "${modelId}" is malformed` };
        }
    }

    return { ok: true, cache: data as ModelArtifactCache };
};

export const parseModelArtifactCache = (data: MaybeNull<string>): Result<{ cache: ModelArtifactCache }> => {
    if (!data) return { ok: true, cache: {} };

    let json: unknown;
    try {
        json = JSON.parse(data);
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'cached model artifacts are not valid JSON' };
    }

    return validateModelArtifactCache(json);
};

export const mergeModelArtifactCache = (cache: ModelArtifactCache, artifact: ModelArtifact): ModelArtifactCache => {
    const next = { ...cache };
    delete next[artifact.modelId];
    next[artifact.modelId] = artifact;

    const modelIds = Object.keys(next);
    while (modelIds.length > MAX_CACHED_MODEL_ARTIFACTS) {
        delete next[modelIds.shift()!];
    }

    return next;
};
