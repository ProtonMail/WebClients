import { createCoreI18nService } from '@proton/pass/lib/i18n/service';
import { DEFAULT_LOCALE } from '@proton/shared/lib/constants';
import { getClosestLocaleCode, getLanguageCode } from '@proton/shared/lib/i18n/helper';

import { store } from '../app/Store/store';
import locales from '../app/locales';

const hasRegion = (locale: string) => /[_-]/.test(locale);

const getDefaultLocale = (): string => {
    const [fst, snd] = navigator.languages;
    if (!fst && !snd) return DEFAULT_LOCALE;

    return !hasRegion(fst) && hasRegion(snd) && getLanguageCode(fst) === getLanguageCode(snd) ? snd : fst;
};

export const getLocale = () =>
    getClosestLocaleCode(
        (() => {
            try {
                const locale = store.getState().settings.locale;
                return locale ?? getDefaultLocale();
            } catch (e) {
                return getDefaultLocale();
            }
        })(),
        locales
    );

export const i18n = { ...createCoreI18nService(locales, getLocale), getLocale };
