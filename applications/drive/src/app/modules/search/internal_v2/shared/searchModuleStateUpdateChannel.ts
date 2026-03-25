import type { SearchModuleState, UserId } from './types';

export interface SearchModuleStateUpdateChannel extends BroadcastChannel {
    postMessage(message: Partial<SearchModuleState>): void;
    onmessage: ((ev: MessageEvent<Partial<SearchModuleState>>) => void) | null;
}

// Propagates search state from the SharedWorker (Indexer) to the
// main thread (SearchModule), which then notifies the UI.
export const createSearchModuleStateUpdateChannel = (userId: UserId): SearchModuleStateUpdateChannel =>
    new BroadcastChannel(`search-state-${userId}`) as SearchModuleStateUpdateChannel;
