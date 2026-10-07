import {
    ADDRESS_FLAGS,
    ADDRESS_RECEIVE,
    ADDRESS_SEND,
    ADDRESS_STATUS,
    PRODUCT_BIT,
} from '@proton/shared/lib/constants';
import type { User } from '@proton/shared/lib/interfaces';
import type { Address } from '@proton/shared/lib/interfaces/Address';

import { ApiSyncState } from '../api/api.interface';
import { MAX_SYNC_FREE_USER, MAX_SYNC_PAID_USER } from '../constants';
import { ImportType } from '../interface';
import type { Sync } from '../logic/sync/sync.interface';
import { getBYOEAddressLimit, getBYOEAddressesCounts } from './byoeAddresses';

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

const disabledBYOEAddress = {
    Email: 'test4@gmail.com',
    Status: ADDRESS_STATUS.STATUS_DISABLED,
    Receive: ADDRESS_RECEIVE.RECEIVE_YES,
    Flags: ADDRESS_FLAGS.BYOE,
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

describe('byoeAddresses', () => {
    it('should return expected data', () => {
        const addresses: Address[] = [enabledBYOEAddress, disconnectedBYOEAddress, internalAddress];
        const syncs: Sync[] = [sync1, sync2];

        const { byoeAddresses, activeBYOEAddresses, addressesOrSyncs } = getBYOEAddressesCounts(addresses, syncs);

        expect(byoeAddresses).toEqual([enabledBYOEAddress, disconnectedBYOEAddress]);
        expect(activeBYOEAddresses).toEqual([enabledBYOEAddress]);
        expect(addressesOrSyncs).toEqual(syncs);
    });

    // The backend deletes the paired sync when a BYOE address is disabled or disconnected, so those syncs never
    // reach the frontend. The address itself remains, and is excluded from the active count by its status/flags.
    it('should not count a disabled BYOE address towards the quota', () => {
        const addresses: Address[] = [enabledBYOEAddress, disabledBYOEAddress, internalAddress];
        const syncs: Sync[] = [sync1];

        const { byoeAddresses, activeBYOEAddresses, addressesOrSyncs } = getBYOEAddressesCounts(addresses, syncs);

        expect(byoeAddresses).toEqual([enabledBYOEAddress, disabledBYOEAddress]);
        expect(activeBYOEAddresses).toEqual([enabledBYOEAddress]);
        expect(addressesOrSyncs).toEqual([sync1]);
    });

    it('should not count a disconnected BYOE address towards the quota', () => {
        const addresses: Address[] = [enabledBYOEAddress, disconnectedBYOEAddress];
        const syncs: Sync[] = [sync1];

        const { byoeAddresses, activeBYOEAddresses, addressesOrSyncs } = getBYOEAddressesCounts(addresses, syncs);

        expect(byoeAddresses).toEqual([enabledBYOEAddress, disconnectedBYOEAddress]);
        expect(activeBYOEAddresses).toEqual([enabledBYOEAddress]);
        expect(addressesOrSyncs).toEqual([sync1]);
    });

    it('should fall back to the address count when syncs have not loaded yet', () => {
        const addresses: Address[] = [enabledBYOEAddress, internalAddress];
        const syncs: Sync[] = [];

        const { activeBYOEAddresses, addressesOrSyncs } = getBYOEAddressesCounts(addresses, syncs);

        expect(activeBYOEAddresses).toEqual([enabledBYOEAddress]);
        expect(addressesOrSyncs).toEqual([enabledBYOEAddress]);
    });

    describe('getBYOEAddressLimit', () => {
        const freeUser = { Subscribed: 0 } as User;
        const paidUser = { Subscribed: PRODUCT_BIT.MAIL } as User;

        it('should return nothing when below the free limit', () => {
            expect(getBYOEAddressLimit(freeUser, MAX_SYNC_FREE_USER - 1)).toBeUndefined();
        });

        it('should return free-limit for a free user at the limit', () => {
            expect(getBYOEAddressLimit(freeUser, MAX_SYNC_FREE_USER)).toBe('free-limit');
        });

        it('should let a paid user go beyond the free limit', () => {
            expect(getBYOEAddressLimit(paidUser, MAX_SYNC_FREE_USER)).toBeUndefined();
        });

        it('should return paid-limit for a paid user at the limit', () => {
            expect(getBYOEAddressLimit(paidUser, MAX_SYNC_PAID_USER)).toBe('paid-limit');
        });
    });
});
