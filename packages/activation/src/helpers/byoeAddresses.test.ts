import { ADDRESS_FLAGS, ADDRESS_RECEIVE, ADDRESS_SEND, ADDRESS_STATUS } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces/Address';

import { ApiSyncState } from '../api/api.interface';
import { ImportType } from '../interface';
import type { Sync } from '../logic/sync/sync.interface';
import { getBYOEAddressesCounts } from './byoeAddresses';

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

const disabledAddressSync = {
    id: 'sync3',
    account: 'test4@gmail.com',
    importerID: 'importer3',
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

    it('should not count a disabled BYOE address nor its paired sync towards the quota', () => {
        const addresses: Address[] = [enabledBYOEAddress, disabledBYOEAddress, internalAddress];
        const syncs: Sync[] = [sync1, disabledAddressSync];

        const { byoeAddresses, activeBYOEAddresses, addressesOrSyncs } = getBYOEAddressesCounts(addresses, syncs);

        expect(byoeAddresses).toEqual([enabledBYOEAddress, disabledBYOEAddress]);
        expect(activeBYOEAddresses).toEqual([enabledBYOEAddress]);
        expect(addressesOrSyncs).toEqual([sync1]);
    });

    it('should exclude a disconnected BYOE address paired sync from the count', () => {
        const disconnectedAddressSync = {
            id: 'sync4',
            account: 'test2@gmail.com',
            importerID: 'importer4',
            product: ImportType.MAIL,
            state: ApiSyncState.ACTIVE,
            startDate: 0,
        };
        const addresses: Address[] = [enabledBYOEAddress, disconnectedBYOEAddress];
        const syncs: Sync[] = [sync1, disconnectedAddressSync];

        const { addressesOrSyncs } = getBYOEAddressesCounts(addresses, syncs);

        expect(addressesOrSyncs).toEqual([sync1]);
    });
});
