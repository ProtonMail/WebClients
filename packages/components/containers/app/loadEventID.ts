import { getLatestID } from '@proton/shared/lib/api/events';
import { Cache } from '@proton/shared/lib/helpers/cache';
import { Api } from '@proton/shared/lib/interfaces';

export const getTmpEventID = (cache: Cache<string, any>) => {
    const tmpEventID = cache.get('tmpEventID');
    cache.delete('tmpEventID');
    return tmpEventID;
};

export const setTmpEventID = (cache: Cache<string, any>, eventID: string) => {
    cache.set('tmpEventID', eventID);
};

const loadEventID = async (api: Api, cache: Cache<string, any>) => {
    return getTmpEventID(cache) || api<{ EventID: string }>(getLatestID()).then(({ EventID }) => EventID);
};

export default loadEventID;
