import type { Base64Cache } from '@proton/mail/hooks/useBase64Cache';
import { ADDRESS_STATUS } from '@proton/shared/lib/constants';
import createCache from '@proton/shared/lib/helpers/cache';
import type { Address, Key } from '@proton/shared/lib/interfaces';
import { ResolvedRequest, clearCache, mockCache, resolvedRequest } from '@proton/testing';

/**
 * Export for backward compatibility in the tests. It can be gradually migrated to use @proton/testing package directly
 * in the tests.
 */
export { resolvedRequest, mockCache, clearCache, ResolvedRequest };

export const getInstance = () => {
    const instance = createCache();
    ['set', 'get', 'has', 'toObject', 'delete', 'subscribe', 'notify', 'reset'].forEach((methodName) =>
        jest.spyOn(instance, methodName as any)
    );
    return instance;
};

export const base64Cache = createCache<string, string>() as Base64Cache;

export const minimalCache = () => {};

export const getCompleteAddress = (inputAddress: Partial<Address>) => {
    return {
        ID: 'AddressID',
        Keys: [{ ID: 'KeyID', Primary: 1 } as Key],
        Status: ADDRESS_STATUS.STATUS_ENABLED,
        Send: 1,
        Receive: 1,
        ...inputAddress,
    } as Address;
};
