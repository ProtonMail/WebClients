import { CalendarEvent, DecryptedPersonalVeventMapResult } from '../calendar';

export type GetCalendarEventPersonal = (Event: CalendarEvent) => Promise<DecryptedPersonalVeventMapResult>;
