import { useEffect, useState } from 'react';

import { findTimeZone } from '@protontech/timezone-support';

import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getLocation } from '@proton/shared/lib/api/vpn';
import { singleCountryTimezoneDatabase } from '@proton/shared/lib/date/singleCountryTimezoneDatabase';
import { manualFindTimeZone } from '@proton/shared/lib/date/timezoneDatabase';
import { getNaiveCountryCode } from '@proton/shared/lib/i18n/helper';
import type { Api, MyLocationResponse } from '@proton/shared/lib/interfaces';

import useApi from './useApi';

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
    const language = navigator.languages.find((language) => /[_-]/.test(language));
    if (language) {
        return getNaiveCountryCode(language);
    }
};

const getStaticState = () => {
    return (getCountryFromTimezone() || getCountryFromLanguage())?.toUpperCase();
};

const getMyCountry = async (api: Api): Promise<string | undefined> => {
    // TODO: Have a non-VPN dedicated API for that purpose
    const value = await api<MyLocationResponse>(getLocation());
    return value?.Country?.toUpperCase();
};

const state: { initialized: boolean; promise: null | Promise<string | undefined>; value: string | undefined } = {
    promise: null,
    value: undefined,
    initialized: false,
};

const getInitialValue = () => {
    if (!state.initialized) {
        state.initialized = true;
        state.value = getStaticState();
    }
    return state.value;
};

const getCountryPromise = (api: Api) => {
    if (state.promise) {
        return state.promise;
    }
    state.promise = getMyCountry(getSilentApi(api))
        .then((value) => {
            state.value = value;
            return value;
        })
        .catch(() => {
            return undefined;
        });
    return state.promise;
};

const useMyCountry = (): string | undefined => {
    const [country, setMyCountry] = useState<string | undefined>(getInitialValue);
    const api = useApi();
    useEffect(() => {
        if (country) {
            return;
        }
        void getCountryPromise(api).then(setMyCountry);
    }, []);
    return country;
};

export default useMyCountry;
