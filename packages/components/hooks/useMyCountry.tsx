import { useCallback } from 'react';

import { findTimeZone } from '@protontech/timezone-support';

import { getLocation } from '@proton/shared/lib/api/vpn';
import { singleCountryTimezoneDatabase } from '@proton/shared/lib/date/singleCountryTimezoneDatabase';
import { manualFindTimeZone } from '@proton/shared/lib/date/timezoneDatabase';
import { getNaiveCountryCode } from '@proton/shared/lib/i18n/helper';
import { Api, MyLocationResponse } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import useApi from './useApi';
import useCache from './useCache';
import useCachedModelResult from './useCachedModelResult';

const KEY = 'country';

const tryTimezone = (tz: string): string | undefined =>
    singleCountryTimezoneDatabase[tz as keyof typeof singleCountryTimezoneDatabase];

const getCountryFromTimezone = () => {
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        if (timezone) {
            return tryTimezone(timezone) || tryTimezone(manualFindTimeZone(timezone) || findTimeZone(timezone).name);
        }
    } catch (e) {
        // undefined
    }
};

export const getCountryFromLanguage = () => {
    return getNaiveCountryCode(navigator.languages.find((language) => /[_-]/.test(language)));
};

const getMyCountry = async (api: Api) => {
    return (
        getCountryFromTimezone() ||
        getCountryFromLanguage() ||
        // TODO: Have a non-VPN dedicated API for that purpose
        (await api<MyLocationResponse>(getLocation()).catch(noop))?.Country
    )?.toUpperCase();
};

const useMyCountry = (): [string | undefined, boolean, Error] => {
    const api = useApi();
    const cache = useCache();
    const miss = useCallback(() => getMyCountry(api), [api]);
    return useCachedModelResult(cache, KEY, miss);
};

export default useMyCountry;
