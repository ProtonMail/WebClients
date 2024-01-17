import { createCoreI18nService } from '@proton/pass/lib/i18n/service';
import { WorkerMessageType } from '@proton/pass/types';
import { DEFAULT_LOCALE } from '@proton/shared/lib/constants';
import { getClosestLocaleCode, getLanguageCode } from '@proton/shared/lib/i18n/helper';

import locales from '../../locales';
import WorkerMessageBroker from '../channel';
import { withContext } from '../context';

export const createI18nService = () => {
    const hasRegion = (locale: string) => /[_-]/.test(locale);

    const getDefaultLocale = (): string => {
        const [fst, snd] = navigator.languages;
        if (!fst && !snd) return DEFAULT_LOCALE;

        return !hasRegion(fst) && hasRegion(snd) && getLanguageCode(fst) === getLanguageCode(snd) ? snd : fst;
    };

    const getLocale = withContext<() => Promise<string>>(async (ctx) =>
        getClosestLocaleCode(
            await (async () => {
                try {
                    const { locale } = await ctx.service.settings.resolve();
                    return locale ?? getDefaultLocale();
                } catch {
                    return getDefaultLocale();
                }
            })(),
            locales
        )
    );

    WorkerMessageBroker.registerMessage(WorkerMessageType.LOCALE_REQUEST, async () => ({
        locale: await getLocale(),
    }));

    return createCoreI18nService(locales, getLocale);
};

export type I18NService = ReturnType<typeof createI18nService>;
