import { MODEL_ARTIFACTS_BASE_URL } from '@proton/pass/constants';
import type { MaybeNull } from '@proton/pass/types';
import { escapeRegex } from '@proton/shared/lib/helpers/regex';

const MODEL_ARCH_VALUES = ['lr', 'rf'] as const;
export type ModelArch = (typeof MODEL_ARCH_VALUES)[number];
export const isModelArch = (name: string): name is ModelArch => (MODEL_ARCH_VALUES as readonly string[]).includes(name);

const MODEL_ID_RE = new RegExp(
    `^(?<year>\\d{4})\\.(?<month>\\d{1,2})\\.(?<pipelineId>\\d+)-(?<arch>${MODEL_ARCH_VALUES.map(escapeRegex).join('|')})$`
);

export const getModelArch = (modelId: string): MaybeNull<ModelArch> => {
    const arch = modelId.match(MODEL_ID_RE)?.groups?.arch;
    return arch && isModelArch(arch) ? arch : null;
};

/** Does not validate `modelId` — callers must gate on `getModelArch` returning non-null first. */
export const getModelArtifactURL = (modelId: string): string =>
    `${MODEL_ARTIFACTS_BASE_URL}/${modelId}/model-artifact.zip`;
