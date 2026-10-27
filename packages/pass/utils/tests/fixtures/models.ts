import { detectionClasses } from '@protontech/autofill/types';
import { createHash } from 'crypto';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import JSZip from 'jszip';
import { tmpdir } from 'os';
import { join } from 'path';

import type { ModelArtifact } from '../../../lib/extension/model-artifact/model-artifact';
import { getModelArch } from '../../../lib/extension/model-artifact/model-artifact';
import type { ModelRegistry } from '../../../lib/extension/model-registry/model-registry';
import type { AutofillModelExperimentGroup } from '../../../types/api/features';

/** Filled by the jest global setup `models.download.ts` on every run, one per checkout */
export const MODELS_CACHE_DIR = join(
    tmpdir(),
    'pass-detection-models',
    createHash('sha256').update(__dirname).digest('hex').slice(0, 12)
);
export const MODEL_REGISTRY_FILE = 'model-registry.json';

// nosemgrep: path-join-resolve-traversal -- `modelId` comes from the production registry
export const getModelArtifactFile = (modelId: string) => join(MODELS_CACHE_DIR, `${modelId}.zip`);

export const hasDownloadedModels = () => existsSync(join(MODELS_CACHE_DIR, MODEL_REGISTRY_FILE));

const readModelArtifact = async (modelId: string): Promise<ModelArtifact> => {
    const arch = getModelArch(modelId);
    if (!arch.ok) throw new Error(`Unrecognized model ID "${modelId}"`);

    const zip = await JSZip.loadAsync(await readFile(getModelArtifactFile(modelId)));
    const weights = await Promise.all(
        detectionClasses.map(async (klass) => {
            const json = await zip.file(`${klass}-model.json`)?.async('string');
            if (json === undefined) throw new Error(`Model artifact ${modelId} has no ${klass}-model.json`);
            return [klass, JSON.parse(json)];
        })
    );

    return { modelId, arch: arch.arch, weights: Object.fromEntries(weights) };
};

/** `storage.local` of an extension worker which already fetched the registry
 * and the model of `group`, as the autofill service persists them */
export const readModelStorage = async (group: AutofillModelExperimentGroup) => {
    const registry: ModelRegistry = JSON.parse(await readFile(join(MODELS_CACHE_DIR, MODEL_REGISTRY_FILE), 'utf8'));
    const artifact = await readModelArtifact(registry[group]);

    return {
        modelId: artifact.modelId,
        storage: {
            modelRegistry: JSON.stringify(registry),
            modelArtifacts: JSON.stringify({ [artifact.modelId]: artifact }),
        },
    };
};
