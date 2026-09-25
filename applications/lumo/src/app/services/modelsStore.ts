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

export function getModelById(modelId: string): LumoApiModel | undefined {
    return modelsById[modelId];
}

export function getMaxContextLengthForModelId(modelId: string): number | undefined {
    return modelsById[modelId]?.max_context_length;
}

function subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot(): Record<string, LumoApiModel> {
    return modelsById;
}

function getServerSnapshot(): Record<string, LumoApiModel> {
    return modelsById;
}

export function useModelsById(): Record<string, LumoApiModel> {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useModelsRevision(): number {
    return useSyncExternalStore(
        subscribe,
        () => modelsRevision,
        () => modelsRevision
    );
}
