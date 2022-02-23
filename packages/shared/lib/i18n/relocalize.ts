import { addLocale as ttagAddLocale, useLocale as ttagUseLocale } from 'ttag';
import { UserSettings } from '../interfaces';
import { getBrowserLocale, getClosestLocaleCode } from './helper';
import { browserDateLocale, dateLocale, dateLocaleCode, defaultDateLocale, localeCode, setDateLocales } from './index';
import { loadDateLocale } from './loadLocale';
import { locales } from './locales';
import { DEFAULT_LOCALE } from '../constants';

export const relocalizeText = async ({
    getLocalizedText,
    newLocaleCode,
    relocalizeDateFormat,
    userSettings,
}: {
    getLocalizedText: () => string;
    newLocaleCode?: string;
    relocalizeDateFormat?: boolean;
    userSettings: UserSettings;
}) => {
    const currentLocaleCode = localeCode;
    const [currentDefaultDateLocale, currentBrowserDateLocale, currentDateLocale, currentDateLocaleCode] = [
        defaultDateLocale,
        browserDateLocale,
        dateLocale,
        dateLocaleCode,
    ];
    if (!newLocaleCode || newLocaleCode === currentLocaleCode) {
        return getLocalizedText();
    }
    try {
        const newSafeLocaleCode = getClosestLocaleCode(newLocaleCode, locales);
        const useDefaultLocale = newSafeLocaleCode === DEFAULT_LOCALE;
        const [newTtagLocale] = await Promise.all([
            useDefaultLocale ? undefined : locales[newSafeLocaleCode]?.(),
            relocalizeDateFormat ? loadDateLocale(newSafeLocaleCode, getBrowserLocale(), userSettings) : undefined,
        ]);
        if (!useDefaultLocale && !newTtagLocale) {
            throw new Error('No locale data for requested localeCode');
        }
        if (newTtagLocale) {
            ttagAddLocale(newSafeLocaleCode, newTtagLocale);
        }
        ttagUseLocale(newSafeLocaleCode);
        return getLocalizedText();
    } catch (e) {
        return getLocalizedText();
    } finally {
        ttagUseLocale(currentLocaleCode);
        setDateLocales({
            defaultDateLocale: currentDefaultDateLocale,
            browserDateLocale: currentBrowserDateLocale,
            dateLocale: currentDateLocale,
            dateLocaleCode: currentDateLocaleCode,
        });
    }
};
