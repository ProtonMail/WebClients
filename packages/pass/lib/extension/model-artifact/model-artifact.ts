import { MODEL_ARTIFACTS_BASE_URL } from '@proton/pass/constants';
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
    `${MODEL_ARTIFACTS_BASE_URL}/${modelId}/model-artifact.zip`;
