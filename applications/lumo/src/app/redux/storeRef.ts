import type { LumoStore } from './store';

/**
 * Global store reference for use by services that need access to Redux state
 * outside of React components (e.g., SearchService).
 * 
 * This is set once during app initialization after the store is created.
 */
let storeRef: LumoStore | null = null;

export function setStoreRef(store: LumoStore): void {
    storeRef = store;
}

export function getStoreRef(): LumoStore | null {
    return storeRef;
}

