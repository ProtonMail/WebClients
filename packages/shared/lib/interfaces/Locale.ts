import { Locale } from 'date-fns';
import { LocaleData } from 'ttag';

import { SimpleMap } from './utils';

export type TtagLocaleMap = SimpleMap<() => Promise<LocaleData>>;

export interface DateFnsLocaleMap {
    [key: string]: () => Promise<Locale>;
}
