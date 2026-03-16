import { renderHook } from '@testing-library/react';

import { ADDRESS_FLAGS, ADDRESS_RECEIVE, ADDRESS_STATUS } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces/Address';

import { ApiSyncState } from '../api/api.interface';
import { ImportType } from '../interface';
import type { Sync } from '../logic/sync/sync.interface';
import { useNonBYOESyncs } from './useNonBYOESyncs';

jest.mock('@proton/account/addresses/hooks', () => ({
    useAddresses: jest.fn(),
}));

jest.mock('../logic/store', () => ({
    useEasySwitchSelector: jest.fn(),
}));

jest.mock('../logic/sync/sync.selectors', () => ({
    getAllSync: jest.fn(),
}));

const byoeAddress = {
    Email: 'byoe@gmail.com',
    Status: ADDRESS_STATUS.STATUS_ENABLED,
    Receive: ADDRESS_RECEIVE.RECEIVE_YES,
    Flags: ADDRESS_FLAGS.BYOE,
} as Address;

const internalAddress = {
    Email: 'user@proton.me',
    Status: ADDRESS_STATUS.STATUS_ENABLED,
    Receive: ADDRESS_RECEIVE.RECEIVE_YES,
} as Address;

const byoeSync: Sync = {
    id: 'sync-byoe',
    account: 'byoe@gmail.com',
    importerID: 'importer1',
    product: ImportType.MAIL,
    state: ApiSyncState.ACTIVE,
    startDate: new Date('2026-01-01').getTime(),
};

const nonByoeSync: Sync = {
    id: 'sync-non-byoe',
    account: 'other@gmail.com',
    importerID: 'importer2',
    product: ImportType.MAIL,
    state: ApiSyncState.ACTIVE,
    startDate: new Date('2023-01-01').getTime(),
};

const nonByoeSync2: Sync = {
    id: 'sync-non-byoe2',
    account: 'other2@gmail.com',
    importerID: 'importer3',
    product: ImportType.MAIL,
    state: ApiSyncState.ACTIVE,
    startDate: new Date('2024-01-01').getTime(),
};

describe('useNonBYOESyncs', () => {
    const mockUseAddresses = require('@proton/account/addresses/hooks').useAddresses;
    const mockUseEasySwitchSelector = require('../logic/store').useEasySwitchSelector;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should filter out syncs linked to a BYOE address', () => {
        mockUseAddresses.mockReturnValue([[byoeAddress, internalAddress]]);
        mockUseEasySwitchSelector.mockReturnValue([byoeSync, nonByoeSync]);

        const { result } = renderHook(() => useNonBYOESyncs());

        expect(result.current).toEqual([nonByoeSync.id]);
    });

    it('should include syncs whose account does not match any address', () => {
        mockUseAddresses.mockReturnValue([[byoeAddress]]);
        mockUseEasySwitchSelector.mockReturnValue([byoeSync, nonByoeSync]);

        const { result } = renderHook(() => useNonBYOESyncs());

        expect(result.current).toEqual([nonByoeSync.id]);
    });

    it('should return syncs ordered by startDate descending', () => {
        mockUseAddresses.mockReturnValue([[byoeAddress]]);
        mockUseEasySwitchSelector.mockReturnValue([nonByoeSync2, nonByoeSync]);

        const { result } = renderHook(() => useNonBYOESyncs());

        expect(result.current).toEqual([nonByoeSync2.id, nonByoeSync.id]);
    });

    it('should return all syncs when there are no BYOE addresses', () => {
        mockUseAddresses.mockReturnValue([[internalAddress]]);
        mockUseEasySwitchSelector.mockReturnValue([byoeSync, nonByoeSync]);

        const { result } = renderHook(() => useNonBYOESyncs());

        expect(result.current).toEqual([byoeSync.id, nonByoeSync.id]);
    });

    it('should return an empty array when there are no syncs', () => {
        mockUseAddresses.mockReturnValue([[byoeAddress, internalAddress]]);
        mockUseEasySwitchSelector.mockReturnValue([]);

        const { result } = renderHook(() => useNonBYOESyncs());

        expect(result.current).toEqual([]);
    });

    it('should return an empty array when all syncs are linked to BYOE addresses', () => {
        mockUseAddresses.mockReturnValue([[byoeAddress]]);
        mockUseEasySwitchSelector.mockReturnValue([byoeSync]);

        const { result } = renderHook(() => useNonBYOESyncs());

        expect(result.current).toEqual([]);
    });
});
