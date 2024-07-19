import type { DecryptedCalendarKey } from '../calendar';

export type GetCalendarKeys = (calendarID: string) => Promise<DecryptedCalendarKey[]>;
