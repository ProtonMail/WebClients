import { HOUR } from '@proton/shared/lib/constants';
import type { GetLatestEpoch } from '@proton/shared/lib/interfaces';

import type { Epoch } from '../interfaces';
import { fetchLatestEpoch } from './apiHelpers';

const lifetime = 2 * HOUR;

const cache: { value: Epoch | null; promise: Promise<Epoch> | null; timestamp: number } = {
    value: null,
    promise: null,
    timestamp: 0,
};

export const getLatestEpoch: GetLatestEpoch = ({ api, forceRefresh }) => {
    if (forceRefresh || Date.now() - (cache?.timestamp || 0) > lifetime) {
        cache.promise = null;
        cache.value = null;
    }
    if (cache?.promise) {
        return cache.promise;
    }
    cache.promise = fetchLatestEpoch(api)
        .then((epoch) => {
            cache.promise = null;
            cache.timestamp = Date.now();
            cache.value = epoch;
            return epoch;
        })
        .catch((e) => {
            cache.promise = null;
            throw e;
        });
    return cache.promise;
};
