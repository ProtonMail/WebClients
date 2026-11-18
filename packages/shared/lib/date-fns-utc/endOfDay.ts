import { utc } from '@date-fns/utc';
import { endOfDay as endOfDayInZone } from 'date-fns';

const endOfDay = (date: Date) => new Date(+endOfDayInZone(date, { in: utc }));

export default endOfDay;
