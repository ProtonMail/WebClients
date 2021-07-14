import { getVtimezones } from '@proton/shared/lib/api/calendars';
import { parse } from '@proton/shared/lib/calendar/vcal';
import { GET_VTIMEZONES_API_LIMIT } from '@proton/shared/lib/constants';
import { chunk, unique } from '@proton/shared/lib/helpers/array';
import { GetVTimezonesMap, VTimezoneObject } from '@proton/shared/lib/interfaces/hooks/GetVTimezonesMap';
import { VcalVtimezoneComponent } from '@proton/shared/lib/interfaces/calendar';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import { useCallback } from 'react';
import useApi from './useApi';
import useCache from './useCache';
import { getIsRecordInvalid, getPromiseValue } from './useCachedModelResult';

const CACHE_KEY = 'VTIMEZONES';

export const useGetVtimezonesMap = () => {
    const api = useApi();
    const cache = useCache();

    const getVTimezonesMap = useCallback(
        async (tzids: string[]) => {
            const uniqueTzids = unique(tzids.filter((tzid) => tzid.toLowerCase() !== 'utc'));
            const encodedTzids = uniqueTzids.map((tzid) => encodeURIComponent(tzid));

            if (!uniqueTzids.length) {
                return Promise.resolve({});
            }

            const batchedTimezones = chunk(encodedTzids, GET_VTIMEZONES_API_LIMIT);

            return (
                await Promise.all(
                    batchedTimezones.map(async (batch) => {
                        const { Timezones = {} } = await api<{ Timezones: SimpleMap<string> }>(getVtimezones(batch));

                        return tzids.reduce<SimpleMap<VTimezoneObject>>((acc, tzid) => {
                            const vtimezoneString = Timezones[tzid];

                            if (vtimezoneString) {
                                acc[tzid] = {
                                    vtimezoneString,
                                    vtimezone: parse(vtimezoneString) as VcalVtimezoneComponent,
                                };
                            }

                            return acc;
                        }, {});
                    })
                )
            ).reduce<SimpleMap<VTimezoneObject>>((acc, curr) => ({ ...acc, ...curr }), {});
        },
        [api, cache]
    );

    return useCallback<GetVTimezonesMap>(
        (tzids: string[]) => {
            if (!cache.has(CACHE_KEY)) {
                cache.set(CACHE_KEY, new Map());
            }
            const subCache = cache.get(CACHE_KEY);
            const missing = tzids.filter((tzid) => {
                return getIsRecordInvalid(subCache.get(tzid));
            });
            const promise = getVTimezonesMap(missing);
            const miss = async (tzid: string) => {
                const map = await promise;
                return map[tzid];
            };
            return Promise.all(
                tzids.map(async (tzid) => {
                    const result = await getPromiseValue(subCache, tzid, miss);
                    return {
                        tzid,
                        result: result as VTimezoneObject,
                    };
                })
            ).then((result) => {
                return result.reduce<SimpleMap<VTimezoneObject>>((acc, { tzid, result }) => {
                    acc[tzid] = result;
                    return acc;
                }, {});
            });
        },
        [cache, getVTimezonesMap]
    );
};
