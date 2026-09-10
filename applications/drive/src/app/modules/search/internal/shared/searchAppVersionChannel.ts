import type { UserId } from './types';

export interface SearchAppVersionChannel extends BroadcastChannel {
    postMessage(appVersion: string): void;
    onmessage: ((ev: MessageEvent<string>) => void) | null;
}

// Announces the app version of a search SharedWorker so other instances (spawned by a
// different deployed version, per the appVersion-scoped SharedWorker name in WorkerClient)
// can detect a mismatch across the same user's tabs/workers.
export const createSearchAppVersionChannel = (userId: UserId): SearchAppVersionChannel =>
    new BroadcastChannel(`search-app-version:${userId}`) as SearchAppVersionChannel;
