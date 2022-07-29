import { ADDRESS_STATUS } from '@proton/shared/lib/constants';
import createCache from '@proton/shared/lib/helpers/cache';
import { Address, DecryptedKey, Key } from '@proton/shared/lib/interfaces';
import { STATUS } from '@proton/shared/lib/models/cache';

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
export const addressKeysCache = createCache<string, { status: number; value: Partial<DecryptedKey>[] }>();
export const base64Cache = createCache<string, string>() as Base64Cache;

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
