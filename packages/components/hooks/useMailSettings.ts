import { useCallback } from 'react';
import { MailSettings as tsMailSettings } from 'proton-shared/lib/interfaces';
import { MailSettingsModel } from 'proton-shared/lib/models';

import useCachedModelResult, { getPromiseValue } from './useCachedModelResult';
import useCache from './useCache';
import useApi from './useApi';

export const useGetMailSettings = (): (() => Promise<tsMailSettings>) => {
    const api = useApi();
    const cache = useCache();
    return useCallback(() => {
        return getPromiseValue(cache, MailSettingsModel.key, () => MailSettingsModel.get(api));
    }, [cache, api]);
};

export const useMailSettings = (): [tsMailSettings | undefined, boolean, any] => {
    const cache = useCache();
    const miss = useGetMailSettings();
    return useCachedModelResult(cache, MailSettingsModel.key, miss);
};
