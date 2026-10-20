import type { CacheType } from '@proton/redux-utilities/interface';

import type { CalendarWithOwnMembers } from '../calendar/Calendar';

export type GetCalendars = (options?: { cache: CacheType }) => Promise<CalendarWithOwnMembers[]>;
