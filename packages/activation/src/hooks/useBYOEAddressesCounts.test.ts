import { renderHook } from '@testing-library/react';

import { ADDRESS_FLAGS, ADDRESS_RECEIVE, ADDRESS_SEND, ADDRESS_STATUS } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces/Address';

import { ApiSyncState } from '../api/api.interface';
import { MAX_SYNC_FREE_USER, MAX_SYNC_PAID_USER } from '../constants';
import { ImportType } from '../interface';
import type { Sync } from '../logic/sync/sync.interface';
import useBYOEAddressesCounts from './useBYOEAddressesCounts';

jest.mock('@proton/account/addresses/hooks', () => ({
    useAddresses: jest.fn(),
}));

jest.mock('@proton/account/user/hooks', () => ({
    useUser: jest.fn(),
}));

jest.mock('../logic/store', () => ({
    useEasySwitchSelector: jest.fn(),
}));

jest.mock('../logic/sync/sync.selectors', () => ({
    getAllSync: jest.fn(),
}));

const enabledBYOEAddress = {
    Email: 'test@gmail.com',
    Status: ADDRESS_STATUS.STATUS_ENABLED,
    Receive: ADDRESS_RECEIVE.RECEIVE_YES,
    Flags: ADDRESS_FLAGS.BYOE,
} as Address;

const disconnectedBYOEAddress = {
    Email: 'test2@gmail.com',
    Status: ADDRESS_STATUS.STATUS_ENABLED,
    Receive: ADDRESS_RECEIVE.RECEIVE_YES,
    Flags: ADDRESS_FLAGS.BYOE + ADDRESS_FLAGS.FLAG_DISABLE_E2EE + ADDRESS_FLAGS.FLAG_DISABLE_EXPECTED_SIGNED,
} as Address;

const internalAddress = {
    Email: 'internalAddress1@proton.me',
    Status: ADDRESS_STATUS.STATUS_ENABLED,
    Receive: ADDRESS_RECEIVE.RECEIVE_YES,
    Send: ADDRESS_SEND.SEND_YES,
} as Address;

const sync1 = {
    id: 'sync1',
    account: 'test@gmail.com',
    importerID: 'importer1',
    product: ImportType.MAIL,
    state: ApiSyncState.ACTIVE,
    startDate: 0,
};

const sync2 = {
    id: 'sync2',
    account: 'test3@proton.me',
    importerID: 'importer2',
    product: ImportType.MAIL,
    state: ApiSyncState.ACTIVE,
    startDate: 0,
};

describe('useBYOEAddressesCounts', () => {
    const mockUseAddresses = require('@proton/account/addresses/hooks').useAddresses;
    const mockUseUser = require('@proton/account/user/hooks').useUser;
    const mockUseEasySwitchSelector = require('../logic/store').useEasySwitchSelector;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return expected data for free user', () => {
        const addresses: Address[] = [enabledBYOEAddress, disconnectedBYOEAddress, internalAddress];
        const syncs: Sync[] = [sync1, sync2];
        const user = { hasPaidMail: false };

        mockUseAddresses.mockReturnValue([addresses]);
        mockUseUser.mockReturnValue([user]);
        mockUseEasySwitchSelector.mockReturnValue(syncs);

        const { result } = renderHook(() => useBYOEAddressesCounts());

        expect(result.current.byoeAddresses).toEqual([enabledBYOEAddress, disconnectedBYOEAddress]);
        expect(result.current.activeBYOEAddresses).toEqual([enabledBYOEAddress]);
        expect(result.current.addressesOrSyncs).toEqual(syncs);
        expect(result.current.usedBYOEAddresses).toBe(2);
        expect(result.current.maxBYOEAddresses).toBe(MAX_SYNC_FREE_USER);
    });

    it('should return expected data for paid user', () => {
        const addresses: Address[] = [enabledBYOEAddress, disconnectedBYOEAddress, internalAddress];
        const syncs: Sync[] = [sync1, sync2];
        const user = { hasPaidMail: true };

        mockUseAddresses.mockReturnValue([addresses]);
        mockUseUser.mockReturnValue([user]);
        mockUseEasySwitchSelector.mockReturnValue(syncs);

        const { result } = renderHook(() => useBYOEAddressesCounts());

        expect(result.current.byoeAddresses).toEqual([enabledBYOEAddress, disconnectedBYOEAddress]);
        expect(result.current.activeBYOEAddresses).toEqual([enabledBYOEAddress]);
        expect(result.current.addressesOrSyncs).toEqual(syncs);
        expect(result.current.usedBYOEAddresses).toBe(2);
        expect(result.current.maxBYOEAddresses).toBe(MAX_SYNC_PAID_USER);
    });

    it('should handle empty addresses and syncs', () => {
        const addresses: Address[] = [];
        const syncs: Sync[] = [];
        const user = { hasPaidMail: false };

        mockUseAddresses.mockReturnValue([addresses]);
        mockUseUser.mockReturnValue([user]);
        mockUseEasySwitchSelector.mockReturnValue(syncs);

        const { result } = renderHook(() => useBYOEAddressesCounts());

        expect(result.current.byoeAddresses).toEqual([]);
        expect(result.current.activeBYOEAddresses).toEqual([]);
        expect(result.current.addressesOrSyncs).toEqual([]);
        expect(result.current.usedBYOEAddresses).toBe(0);
        expect(result.current.maxBYOEAddresses).toBe(MAX_SYNC_FREE_USER);
    });
});
