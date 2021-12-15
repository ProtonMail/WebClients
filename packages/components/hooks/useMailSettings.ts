import { useCallback } from 'react';
import { MailSettings as tsMailSettings } from '@proton/shared/lib/interfaces';
import { MailSettingsModel } from '@proton/shared/lib/models';
import { eoDefaultMailSettings } from '@proton/shared/lib/mail/eo/constants';

import useCachedModelResult, { getPromiseValue } from './useCachedModelResult';
import useCache from './useCache';
import useApi from './useApi';

export const useGetMailSettings = (isOutside?: boolean): (() => Promise<tsMailSettings>) => {
    const api = useApi();
    const cache = useCache();
    return useCallback(() => {
        if (isOutside) {
            return getPromiseValue(cache, MailSettingsModel.key, () => new Promise(() => eoDefaultMailSettings));
        }
        return getPromiseValue(cache, MailSettingsModel.key, () => MailSettingsModel.get(api));
    }, [cache, api]);
};

export const useMailSettings = (isOutside?: boolean): [tsMailSettings | undefined, boolean, any] => {
    const cache = useCache();
    const miss = useGetMailSettings(isOutside);
    return useCachedModelResult(cache, MailSettingsModel.key, miss);
};
