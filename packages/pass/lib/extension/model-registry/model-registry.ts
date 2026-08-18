import type { MaybeNull, Result } from '@proton/pass/types';
import { isObject } from '@proton/pass/utils/object/is-object';

// maps experiment group to model ID
export type ModelRegistry = Record<string, string>;

export const validateModelRegistry = (data: unknown): Result<{ registry: ModelRegistry }> => {
    if (!isObject(data)) return { ok: false, error: 'model registry is not an object' };

    for (const [group, modelId] of Object.entries(data)) {
        if (typeof modelId !== 'string') return { ok: false, error: `model registry entry "${group}" is not a string` };
    }

    return { ok: true, registry: data as ModelRegistry };
};

export const parseModelRegistry = (data: MaybeNull<string>): Result<{ registry: MaybeNull<ModelRegistry> }> => {
    if (!data) return { ok: true, registry: null };

    let json: unknown;
    try {
        json = JSON.parse(data);
    } catch {
        return { ok: false, error: 'cached model registry is not valid JSON' };
    }

    return validateModelRegistry(json);
};
