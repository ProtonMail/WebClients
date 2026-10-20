import type { CacheType } from '@proton/redux-utilities/interface';

import type { CalendarBootstrap } from '../calendar/Calendar';

export type GetCalendarBootstrap = (id: string, cache?: CacheType) => Promise<CalendarBootstrap>;
