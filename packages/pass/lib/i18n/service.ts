import type { Maybe, MaybePromise } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import type { Subscriber } from '@proton/pass/utils/pubsub/factory';
import { createPubSub } from '@proton/pass/utils/pubsub/factory';
import { DEFAULT_LOCALE } from '@proton/shared/lib/constants';
import { localeCode } from '@proton/shared/lib/i18n';
import { getLanguageCode } from '@proton/shared/lib/i18n/helper';
import { loadLocale } from '@proton/shared/lib/i18n/loadLocale';
import { setTtagLocales } from '@proton/shared/lib/i18n/locales';
import { type TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';

type I18nServiceOptions = {
    locales: TtagLocaleMap;
    getLocale: () => MaybePromise<Maybe<string>>;
    onLocaleChange?: (locale: string) => void;
};

type LocaleEvent = { locale: string };

export const createI18nService = (options: I18nServiceOptions) => {
    setTtagLocales(options.locales);
    const pubsub = createPubSub<LocaleEvent>();

    const hasRegion = (locale: string) => /[_-]/.test(locale);

    const getNavigatorLocale = (): string => {
        const [fst, snd] = navigator.languages;
        if (!fst && !snd) return DEFAULT_LOCALE;
        return !hasRegion(fst) && hasRegion(snd) && getLanguageCode(fst) === getLanguageCode(snd) ? snd : fst;
    };

    const getLocale = async () => (await options.getLocale()) ?? getNavigatorLocale();

    const setLocale = async (locale?: string) => {
        try {
            logger.info(`[I18nService] changing locale to ${locale}`);
            const nextLocale = locale ?? (await getLocale());

            if (nextLocale !== localeCode) {
                await loadLocale(nextLocale, options.locales);
                options.onLocaleChange?.(nextLocale);
                pubsub.publish({ locale: nextLocale });
            }
        } catch {}
    };

    return {
        setLocale,
        getLocale,
        subscribe: (fn: Subscriber<LocaleEvent>) => pubsub.subscribe(fn),
        unsubscribe: () => pubsub.unsubscribe(),
    };
};

export type I18nService = ReturnType<typeof createI18nService>;
