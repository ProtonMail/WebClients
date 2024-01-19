import { ADDRESS_STATUS } from '@proton/shared/lib/constants';
import createCache from '@proton/shared/lib/helpers/cache';
import { Address, Key } from '@proton/shared/lib/interfaces';
import { ResolvedRequest, addToCache, clearCache, mockCache, resolvedRequest } from '@proton/testing';

import { Base64Cache } from '../../hooks/useBase64Cache';

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

export const base64Cache = createCache<string, string>() as Base64Cache;

export const minimalCache = () => {
    addToCache('MessageCounts', []);
    addToCache('ConversationCounts', []);
};

export const getCompleteAddress = (inputAddress: Partial<Address>) => {
    return {
        ID: 'AddressID',
        Keys: [{ ID: 'KeyID' } as Key],
        Status: ADDRESS_STATUS.STATUS_ENABLED,
        Send: 1,
        Receive: 1,
        ...inputAddress,
    } as Address;
};
