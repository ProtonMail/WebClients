import createCache from '@proton/shared/lib/helpers/cache';
import { STATUS } from '@proton/shared/lib/models/cache';
import { Address, DecryptedKey, Key } from '@proton/shared/lib/interfaces';
import { ADDRESS_STATUS } from '@proton/shared/lib/constants';
import { MessageExtended } from '../../models/message';
import { Base64Cache } from '../../hooks/useBase64Cache';
import { addKeysToAddressKeysCache } from './crypto';

export interface ResolvedRequest<T> {
    status: STATUS;
    value: T;
}

export const resolvedRequest = <T>(value: T): ResolvedRequest<T> => ({ status: STATUS.RESOLVED, value });

export const getInstance = () => {
    const instance = createCache();
    ['set', 'get', 'has', 'toObject', 'delete', 'subscribe', 'notify', 'reset'].forEach((methodName) =>
        jest.spyOn(instance, methodName as any)
    );
    return instance;
};

export const cache = createCache();
export const messageCache = createCache<string, MessageExtended>();
export const addressKeysCache = createCache<string, { status: number; value: Partial<DecryptedKey>[] }>();
export const base64Cache = createCache<string, string>() as Base64Cache;

export const contactCache = {
    contactsMap: {} as { [email: string]: any },
    contactsMapWithDuplicates: {} as { [email: string]: any[] },
    contactGroupsMap: {} as { [path: string]: any },
    groupsWithContactsMap: {} as { [groupID: string]: any },
    recipientsLabelCache: new Map<string, string>(),
    groupsLabelCache: new Map<string, string>(),
};

export const clearContactCache = () => {
    contactCache.contactsMap = {};
    contactCache.contactsMapWithDuplicates = {};
    contactCache.contactGroupsMap = {};
    contactCache.groupsWithContactsMap = {};
    contactCache.recipientsLabelCache = new Map<string, string>();
    contactCache.groupsLabelCache = new Map<string, string>();
};

export const addToCache = (key: string, value: any) => {
    cache.set(key, resolvedRequest(value));
};

export const clearCache = () => cache.clear();

export const minimalCache = () => {
    addToCache('User', { UsedSpace: 10, MaxSpace: 100 });
    addToCache('Addresses', []);
    addToCache('MailSettings', {});
    addToCache('UserSettings', { Flags: {} });
    addToCache('ContactEmails', []);
    addToCache('Labels', []);
    addToCache('MessageCounts', []);
    addToCache('ConversationCounts', []);
    cache.set('ADDRESS_KEYS', addressKeysCache);
    addKeysToAddressKeysCache('AddressID', undefined);
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
