import { useCallback } from 'react';
import { MessageCountsModel } from '@proton/shared/lib/models/messageCountsModel';
import { LabelCount } from '@proton/shared/lib/interfaces/Label';
import useCachedModelResult, { getPromiseValue } from './useCachedModelResult';
import useApi from './useApi';
import useCache from './useCache';

export const useGetMessageCounts = (): (() => Promise<LabelCount[]>) => {
    const api = useApi();
    const cache = useCache();
    const miss = useCallback(() => MessageCountsModel.get(api), [api]);
    return useCallback(() => {
        return getPromiseValue(cache, MessageCountsModel.key, miss);
    }, [cache, miss]);
};

export const useMessageCounts = (): [LabelCount[], boolean, any] => {
    const cache = useCache();
    const miss = useGetMessageCounts();
    return useCachedModelResult(cache, MessageCountsModel.key, miss);
};
