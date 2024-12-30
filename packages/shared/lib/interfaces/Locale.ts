import type { Locale } from 'date-fns';
import type { LocaleData } from 'ttag';

import type { SETTINGS_DATE_FORMAT, SETTINGS_TIME_FORMAT, SETTINGS_WEEK_START } from './UserSettings';
import type { SimpleMap } from './utils';

export type TtagLocaleMap = SimpleMap<() => Promise<LocaleData>>;

export interface DateFnsLocaleMap {
    [key: string]: () => Promise<Locale>;
}

export interface DateFormatOptions {
    TimeFormat: SETTINGS_TIME_FORMAT;
    DateFormat: SETTINGS_DATE_FORMAT;
    WeekStart: SETTINGS_WEEK_START;
}
