import { ELEMENTS_CACHE_KEY } from '../../hooks/useElementsCache';

import { clearCache, messageCache, conversationCache, cache, attachmentsCache } from './cache';
import { api, clearApiMocks } from './api';
import { eventManagerListeners } from './event-manager';
import { clearApiKeys } from './crypto';
import { clearApiContacts } from './contact';

export * from './cache';
export * from './crypto';
export * from './render';
export * from './api';
export * from './event-manager';
export * from './message';

export const clearAll = () => {
    jest.clearAllMocks();
    api.mockClear();
    clearApiMocks();
    clearCache();
    clearApiKeys();
    clearApiContacts();
    messageCache.clear();
    conversationCache.clear();
    attachmentsCache.clear();
    cache.delete(ELEMENTS_CACHE_KEY);
    eventManagerListeners.splice(0, eventManagerListeners.length);
};
