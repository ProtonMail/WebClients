import { logger } from '@proton/pass/utils/logger';
import { loadLocale } from '@proton/shared/lib/i18n/loadLocale';
import { setTtagLocales } from '@proton/shared/lib/i18n/locales';
import { type TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import noop from '@proton/utils/noop';

export const createCoreI18nService = (locales: TtagLocaleMap, getLocale: () => Promise<string> | string) => {
    const setLocale = async (locale?: string) => {
        logger.info(`[I18nService] changing locale to ${locale}`);
        await loadLocale(locale ?? (await getLocale()), locales).catch(noop);
    };

    const init = async () => {
        setTtagLocales(locales);
        await setLocale(await getLocale());
    };

    return { init, setLocale };
};
