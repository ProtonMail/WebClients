import createCache from '@proton/shared/lib/helpers/cache';
import { Status } from '@proton/shared/lib/models/cache';

export interface ResolvedRequest<T> {
    status: Status;
    value: T;
}

export const resolvedRequest = <T>(value: T): ResolvedRequest<T> => ({ status: Status.Resolved, value });

export const mockCache = createCache();

export const clearCache = () => mockCache.clear();
