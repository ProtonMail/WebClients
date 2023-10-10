import { WorkerMessageType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { DEFAULT_LOCALE } from '@proton/shared/lib/constants';
import { getClosestLocaleCode, getLanguageCode } from '@proton/shared/lib/i18n/helper';
import { loadLocale } from '@proton/shared/lib/i18n/loadLocale';
import { setTtagLocales } from '@proton/shared/lib/i18n/locales';
import noop from '@proton/utils/noop';

import locales from '../../app/locales';
import WorkerMessageBroker from '../channel';
import { withContext } from '../context';

export const createI18nService = () => {
    const hasRegion = (locale: string) => /[_-]/.test(locale);

    const getDefaultLocale = (): string => {
        const [fst, snd] = navigator.languages;
        if (!fst && !snd) return DEFAULT_LOCALE;

        return !hasRegion(fst) && hasRegion(snd) && getLanguageCode(fst) === getLanguageCode(snd) ? snd : fst;
    };

    const getLocale = withContext<() => Promise<{ locale: string }>>(async (ctx) => ({
        locale: getClosestLocaleCode(
            await (async () => {
                try {
                    const { locale } = await ctx.service.settings.resolve();
                    return locale ?? getDefaultLocale();
                } catch {
                    return getDefaultLocale();
                }
            })(),
            locales
        ),
    }));

    const setLocale = async (locale?: string) => {
        logger.info(`[I18nService] changing locale to ${locale}`);
        await loadLocale(locale ?? getDefaultLocale(), locales).catch(noop);
    };

    const init = async () => {
        setTtagLocales(locales);
        await setLocale((await getLocale()).locale);
    };

    WorkerMessageBroker.registerMessage(WorkerMessageType.LOCALE_REQUEST, getLocale);

    return { init, setLocale };
};

export type I18NService = ReturnType<typeof createI18nService>;
