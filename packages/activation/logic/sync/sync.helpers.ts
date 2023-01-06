import { ApiSync } from '@proton/activation/api/api.interface';

import { Sync } from './sync.interface';

export const formatApiSync = (syncs: ApiSync[]): Sync[] => {
    return syncs.map((item) => {
        return {
            account: item.Account,
            id: item.ID,
            importerID: item.ImporterID,
            product: item.Product,
            state: item.State,
            startDate: item.CreateTime,
        };
    });
};
