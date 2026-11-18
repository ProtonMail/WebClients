import { utc } from '@date-fns/utc';
import { endOfWeek as endOfWeekInZone } from 'date-fns';

import type { WeekStartsOn } from './interface';

interface Options {
    weekStartsOn: WeekStartsOn;
}
const endOfWeek = (date: Date, options?: Options) =>
    new Date(+endOfWeekInZone(date, { in: utc, weekStartsOn: options?.weekStartsOn ?? 0 }));

export default endOfWeek;
