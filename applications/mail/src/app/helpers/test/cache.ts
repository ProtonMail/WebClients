import { ADDRESS_STATUS } from '@proton/shared/lib/constants';
import createCache from '@proton/shared/lib/helpers/cache';
import { Address, DecryptedKey, Key } from '@proton/shared/lib/interfaces';
import { SHORTCUTS } from '@proton/shared/lib/mail/mailSettings';
import { ResolvedRequest, addToCache, clearCache, mockCache, resolvedRequest } from '@proton/testing';

import { Base64Cache } from '../../hooks/useBase64Cache';
import { addKeysToAddressKeysCache } from './crypto';

/**
 * Export for backward compatibility in the tests. It can be gradually migrated to use @proton/testing package directly
 * in the tests.
 */
export { resolvedRequest, mockCache, addToCache, clearCache, ResolvedRequest };

export const getInstance = () => {
    const instance = createCache();
    ['set', 'get', 'has', 'toObject', 'delete', 'subscribe', 'notify', 'reset'].forEach((methodName) =>
        jest.spyOn(instance, methodName as any)
    );
    return instance;
};

export const addressKeysCache = createCache<string, { status: number; value: Partial<DecryptedKey>[] }>();
export const base64Cache = createCache<string, string>() as Base64Cache;

export const minimalCache = () => {
    addToCache('User', { UsedSpace: 10, MaxSpace: 100, Flags: {} });
    addToCache('Addresses', []);
    // Enable hotkeys to trigger composer save easily
    addToCache('MailSettings', { Shortcuts: SHORTCUTS.ENABLED });
    addToCache('UserSettings', { Flags: {} });
    addToCache('ContactEmails', []);
    addToCache('Labels', []);
    addToCache('MessageCounts', []);
    addToCache('ConversationCounts', []);
    addToCache('Filters', []);
    mockCache.set('ADDRESS_KEYS', addressKeysCache);
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
    const Addresses = mockCache.get('Addresses') as ResolvedRequest<Address[]>;
    Addresses.value.push(address);
};
