import type { CacheType } from '@proton/redux-utilities/interface';
import type { CalendarWithOwnMembers } from '@proton/shared/lib/interfaces/calendar/Calendar';

export type GetCalendars = (options?: { cache: CacheType }) => Promise<CalendarWithOwnMembers[]>;
