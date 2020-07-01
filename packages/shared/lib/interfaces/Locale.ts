import { LocaleData } from 'ttag';
import { Locale } from 'date-fns';

export interface TtagLocaleMap {
    [key: string]: () => Promise<LocaleData>;
}

export interface DateFnsLocaleMap {
    [key: string]: () => Promise<Locale>;
}
