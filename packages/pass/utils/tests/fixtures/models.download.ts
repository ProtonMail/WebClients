import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';

import { MODEL_REGISTRY_URL } from '../../../constants';
import { getModelArtifactURL } from '../../../lib/extension/model-artifact/model-artifact';
import { MODELS_CACHE_DIR, MODEL_REGISTRY_FILE, getModelArtifactFile } from './models';

const DOWNLOAD_TIMEOUT = 10_000;

const download = async (url: string) => {
    const response = await fetch(url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT) });
    if (!response.ok) throw new Error(`${url} answered ${response.status}`);
    return new Uint8Array(await response.arrayBuffer());
};

/** Jest global setup: downloads the registry and the remote models production serves today.
 * Leaves no cache behind when offline or on a non-Pass MR, the remote model tests then skip. */
export default async () => {
    await rm(MODELS_CACHE_DIR, { recursive: true, force: true });
    const labels = process.env.CI_MERGE_REQUEST_LABELS;
    if (labels !== undefined && !labels.split(',').includes('Pass')) return;

    try {
        const registry = await download(MODEL_REGISTRY_URL);
        const modelIds = new Set<string>(Object.values(JSON.parse(new TextDecoder().decode(registry))));
        const artifacts = await Promise.all(
            Array.from(modelIds, async (modelId) => [modelId, await download(getModelArtifactURL(modelId))] as const)
        );

        await mkdir(MODELS_CACHE_DIR, { recursive: true });
        await Promise.all(artifacts.map(([modelId, zip]) => writeFile(getModelArtifactFile(modelId), zip)));
        /** Written last: its presence means every model of the registry is cached */
        await writeFile(join(MODELS_CACHE_DIR, MODEL_REGISTRY_FILE), registry);
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        console.warn(`[models] Detection models not downloaded, the remote model tests will skip: ${reason}`);
    }
};
