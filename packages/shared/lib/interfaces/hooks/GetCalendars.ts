import type { CacheType } from '@proton/redux-utilities/interface';
import type { CalendarWithOwnMembers } from '@proton/shared/lib/interfaces/calendar';

export type GetCalendars = (options?: { cache: CacheType }) => Promise<CalendarWithOwnMembers[]>;
