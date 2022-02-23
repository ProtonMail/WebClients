import { LocaleData } from 'ttag';
import { Locale } from 'date-fns';
import { SimpleMap } from './utils';

export type TtagLocaleMap = SimpleMap<() => Promise<LocaleData>>;

export interface DateFnsLocaleMap {
    [key: string]: () => Promise<Locale>;
}
