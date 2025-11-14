import { useCallback } from 'react';

import { getVtimezones } from '@proton/shared/lib/api/calendars';
import { parse } from '@proton/shared/lib/calendar/vcal';
import { GET_VTIMEZONES_API_LIMIT } from '@proton/shared/lib/constants';
import type { VcalVtimezoneComponent } from '@proton/shared/lib/interfaces/calendar';
import type { GetVTimezonesMap, VTimezoneObject } from '@proton/shared/lib/interfaces/hooks/GetVTimezonesMap';
import type { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import { getIsRecordInvalid, getPromiseValue } from '@proton/shared/lib/models/cache';
import chunk from '@proton/utils/chunk';
import unique from '@proton/utils/unique';

import useApi from './useApi';
import useCache from './useCache';

const CACHE_KEY = 'VTIMEZONES';

export const useGetVtimezonesMap = () => {
    const api = useApi();
    const cache = useCache();

    const getVTimezonesMap = useCallback(
        async (tzids: string[]): Promise<SimpleMap<VTimezoneObject>> => {
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
