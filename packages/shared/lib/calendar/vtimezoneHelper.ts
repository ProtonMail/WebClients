import isTruthy from '../helpers/isTruthy';
import { GetVTimezonesMap, SimpleMap } from '../interfaces';
import { VcalVeventComponent } from '../interfaces/calendar';
import { getPropertyTzid } from './vcalHelper';

interface Params {
    vevents?: VcalVeventComponent[];
    tzids?: string[];
    getVTimezonesMap: GetVTimezonesMap;
}
export const getUniqueVtimezones = async ({ vevents = [], tzids = [], getVTimezonesMap }: Params) => {
    const uniqueTzidsMap = [...tzids, ...vevents].reduce<SimpleMap<boolean>>((acc, item) => {
        if (typeof item === 'string') {
            acc[item] = true;
            return acc;
        }
        const { dtstart, dtend } = item;
        const startTzid = getPropertyTzid(dtstart);
        if (startTzid) {
            acc[startTzid] = true;
        }
        const endTzid = dtend ? getPropertyTzid(dtend) : undefined;
        if (endTzid) {
            acc[endTzid] = true;
        }
        return acc;
    }, {});
    const vtimezoneObjects = Object.values(await getVTimezonesMap(Object.keys(uniqueTzidsMap))).filter(isTruthy);

    return vtimezoneObjects.map(({ vtimezone }) => vtimezone);
};
