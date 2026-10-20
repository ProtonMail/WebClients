import type { DecryptedCalendarKey } from '../calendar/CalendarKey';

export type GetCalendarKeys = (calendarID: string) => Promise<DecryptedCalendarKey[]>;
