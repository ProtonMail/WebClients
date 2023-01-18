import { ApiSync } from '@proton/activation/api/api.interface';

import { Sync } from './sync.interface';

export const formatApiSync = (sync: ApiSync): Sync => {
    return {
        account: sync.Account,
        id: sync.ID,
        importerID: sync.ImporterID,
        product: sync.Product,
        state: sync.State,
        startDate: sync.CreateTime,
    };
};

export const formatApiSyncs = (syncs: ApiSync[]): Sync[] => {
    return syncs.map((item) => {
        return formatApiSync(item);
    });
};
