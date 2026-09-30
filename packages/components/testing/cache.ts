import createCache from '@proton/shared/lib/helpers/cache';
import type { Status } from '@proton/shared/lib/models/cache';

export interface ResolvedRequest<T> {
    status: Status;
    value: T;
}

export const mockCache = createCache();

export const clearCache = () => mockCache.clear();
