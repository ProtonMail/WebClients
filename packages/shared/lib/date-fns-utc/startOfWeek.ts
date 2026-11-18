import { utc } from '@date-fns/utc';
import { startOfWeek as startOfWeekInZone } from 'date-fns';

import type { WeekStartsOn } from './interface';

interface Options {
    weekStartsOn: WeekStartsOn;
}
const startOfWeek = (date: Date, options?: Options) =>
    new Date(+startOfWeekInZone(date, { in: utc, weekStartsOn: options?.weekStartsOn ?? 0 }));

export default startOfWeek;
