import type { SearchModuleState, UserId } from './types';

export interface SearchModuleStateUpdateChannel extends BroadcastChannel {
    postMessage(message: Partial<SearchModuleState>): void;
    onmessage: ((ev: MessageEvent<Partial<SearchModuleState>>) => void) | null;
}

// Propagates search states to the all main main threads (SearchModule), which then notifies the UI
// in every tabs. The event emitter on this channel could be:
//  - the shared worker: to notify all tabs that search indexing state has changed
//  - another tab: If a user changes a state (e.g. opt-in) in a tab, all other tabs needs to be aware
//    of this change.
export const createSearchModuleStateUpdateChannel = (userId: UserId): SearchModuleStateUpdateChannel =>
    new BroadcastChannel(`search-state-${userId}`) as SearchModuleStateUpdateChannel;
