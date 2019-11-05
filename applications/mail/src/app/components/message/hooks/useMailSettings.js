import { useCallback } from 'react';
import { MailSettingsModel } from 'proton-shared/lib/models/mailSettingsModel';
import { useApi, useCache, useCachedModelResult } from 'react-components';
import { getPromiseValue } from 'react-components/hooks/useCachedModelResult';

export const useGetMailSettings = () => {
    const api = useApi();
    const cache = useCache();
    return useCallback(() => {
        return getPromiseValue(cache, MailSettingsModel.key, () => MailSettingsModel.get(api));
    }, [cache, api]);
};

export const useUser = () => {
    const cache = useCache();
    const miss = useGetMailSettings();
    return useCachedModelResult(cache, MailSettingsModel.key, miss);
};
