import { DecryptResultPmcrypto } from 'pmcrypto';
import createCache from 'proton-shared/lib/helpers/cache';
import { STATUS } from 'proton-shared/lib/models/cache';
import { CachedKey } from 'proton-shared/lib/interfaces';

import { MessageExtended } from '../../models/message';
import { ConversationResult } from '../../hooks/useConversation';
import { ELEMENTS_CACHE_KEY } from '../../hooks/useElementsCache';

export const getInstance = () => {
    const instance = createCache();
    ['set', 'get', 'has', 'toObject', 'delete', 'subscribe', 'notify', 'reset'].forEach((methodName) =>
        jest.spyOn(instance, methodName as any)
    );
    return instance;
};

export const cache = createCache();
export const messageCache = createCache<string, MessageExtended>();
export const conversationCache = createCache<string, ConversationResult>();
export const attachmentsCache = createCache<string, DecryptResultPmcrypto>();
export const addressKeysCache = createCache<string, { status: number; value: Partial<CachedKey>[] }>();

export const resolvedRequest = (value: any) => ({ status: STATUS.RESOLVED, value });

export const addToCache = (key: string, value: any) => {
    cache.set(key, resolvedRequest(value));
};

export const clearCache = () => cache.clear();

export const minimalCache = () => {
    addToCache('User', {});
    addToCache('Addresses', []);
    addToCache('MailSettings', {});
    addToCache('ContactEmails', []);
    addToCache('Labels', []);
    cache.set('ADDRESS_KEYS', addressKeysCache);
    cache.set(ELEMENTS_CACHE_KEY, { elements: {}, params: { sort: {} }, pages: [], page: {}, updatedElements: [] });
};
