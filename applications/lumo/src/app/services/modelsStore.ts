import { useSyncExternalStore } from 'react';

import type { LumoApiModel } from '@proton/lumo-api-client/types-api';

type Listener = () => void;

let modelsById: Record<string, LumoApiModel> = {};
let modelsRevision = 0;
const listeners = new Set<Listener>();

function publish(): void {
    modelsRevision += 1;
    listeners.forEach((listener) => listener());
}

export function setModels(models: LumoApiModel[]): void {
    modelsById = Object.fromEntries(models.map((model) => [model.id, model]));
    publish();
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
