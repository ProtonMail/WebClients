import type { SearchModuleState, UserId } from './types';

export interface SearchModuleStateUpdateChannel extends BroadcastChannel {
    postMessage(message: SearchModuleState): void;
    onmessage: ((ev: MessageEvent<SearchModuleState>) => void) | null;
}

// Propagates search state from the SharedWorker (EngineOrchestrator) to the
// main thread (SearchModule), which then notifies the UI.
// TODO: Add APP_VERSION in channel name.
export const createSearchModuleStateUpdateChannel = (userId: UserId): SearchModuleStateUpdateChannel =>
    new BroadcastChannel(`search-state-${userId}`) as SearchModuleStateUpdateChannel;
