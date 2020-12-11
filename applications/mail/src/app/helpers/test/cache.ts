import { DecryptResultPmcrypto } from 'pmcrypto';
import createCache from 'proton-shared/lib/helpers/cache';
import { STATUS } from 'proton-shared/lib/models/cache';
import { Address, CachedKey, Key } from 'proton-shared/lib/interfaces';
import { ADDRESS_STATUS } from 'proton-shared/lib/constants';
import { MessageExtended } from '../../models/message';
import { ConversationResult } from '../../hooks/useConversation';
import { ELEMENTS_CACHE_KEY } from '../../hooks/useElementsCache';

export interface ResolvedRequest<T> {
    status: STATUS;
    value: T;
}

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

export const elementsCache = { elements: {}, params: { sort: {} }, pages: [], page: {}, updatedElements: [] };
export const contactCache = {
    contactsMap: {} as { [email: string]: any },
    contactsMapWithDuplicates: {} as { [email: string]: any[] },
    contactGroupsMap: {} as { [path: string]: any },
    groupsWithContactsMap: {} as { [groupID: string]: any },
    recipientsLabelCache: new Map<string, string>(),
    groupsLabelCache: new Map<string, string>(),
};

export const resolvedRequest = <T>(value: T): ResolvedRequest<T> => ({ status: STATUS.RESOLVED, value });

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
    cache.set(ELEMENTS_CACHE_KEY, elementsCache);
};

export const addAddressToCache = (inputAddress: Partial<Address>) => {
    const address = {
        ID: 'AddressID',
        Keys: [{ ID: 'KeyID' } as Key],
        Status: ADDRESS_STATUS.STATUS_ENABLED,
        Send: 1,
        Receive: 1,
        ...inputAddress,
    } as Address;
    const Addresses = cache.get('Addresses') as ResolvedRequest<Address[]>;
    Addresses.value.push(address);
};
