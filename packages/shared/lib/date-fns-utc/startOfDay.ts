import { utc } from '@date-fns/utc';
import { startOfDay as startOfDayInZone } from 'date-fns';

const startOfDay = (date: Date) => new Date(+startOfDayInZone(date, { in: utc }));

export default startOfDay;
