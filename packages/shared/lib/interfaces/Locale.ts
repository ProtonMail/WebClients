import type { Locale } from 'date-fns';
import type { LocaleData } from 'ttag';

import type { SimpleMap } from './utils';

export type TtagLocaleMap = SimpleMap<() => Promise<LocaleData>>;

export interface DateFnsLocaleMap {
    [key: string]: () => Promise<Locale>;
}
