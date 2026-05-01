import type { CacheType } from '@proton/redux-utilities';
import type { CalendarBootstrap } from '@proton/shared/lib/interfaces/calendar';

export type GetCalendarBootstrap = (id: string, cache?: CacheType) => Promise<CalendarBootstrap>;
