import createCache from '@proton/shared/lib/helpers/cache';
import { STATUS } from '@proton/shared/lib/models/cache';

export interface ResolvedRequest<T> {
    status: STATUS;
    value: T;
}

export const resolvedRequest = <T>(value: T): ResolvedRequest<T> => ({ status: STATUS.RESOLVED, value });

export const mockCache = createCache();

export const addToCache = (key: string, value: any) => {
    mockCache.set(key, resolvedRequest(value));
};

export const clearCache = () => mockCache.clear();
