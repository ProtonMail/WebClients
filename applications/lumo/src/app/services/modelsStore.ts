import { useSyncExternalStore } from 'react';

import type { LumoApiModel } from '@proton/lumo-api-client/types-api';

type Listener = () => void;

let modelsById: Record<string, LumoApiModel> = {};
let modelsRevision = 0;
const listeners = new Set<Listener>();

let modelsSettled = false;
let settleModels: () => void = () => {};
const modelsSettledPromise = new Promise<void>((resolve) => {
    settleModels = resolve;
});

function markSettled(): void {
    modelsSettled = true;
    settleModels();
}

function publish(): void {
    modelsRevision += 1;
    listeners.forEach((listener) => listener());
}

export function setModels(models: LumoApiModel[]): void {
    modelsById = Object.fromEntries(models.map((model) => [model.id, model]));
    markSettled();
    publish();
}

/** The models request failed: stop waiting and let sizing fall back to the default window. */
export function markModelsUnavailable(): void {
    markSettled();
}

/**
 * Wait (bounded) for model metadata, so a send made right after app load is sized against
 * the real window instead of the default one and is not re-compacted once metadata arrives.
 */
export async function waitForModels(timeoutMs: number): Promise<void> {
    if (modelsSettled) {
        return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    await Promise.race([
        modelsSettledPromise,
        new Promise<void>((resolve) => {
            timer = setTimeout(resolve, timeoutMs);
        }),
    ]);
    clearTimeout(timer);
}

export function getMaxContextLengthForModelId(modelId: string): number | undefined {
    return modelsById[modelId]?.max_context_length;
}

function subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function useModelsRevision(): number {
    return useSyncExternalStore(
        subscribe,
        () => modelsRevision,
        () => modelsRevision
    );
}
