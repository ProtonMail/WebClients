import { addLocale as ttagAddLocale, useLocale as ttagUseLocale } from 'ttag';
import { UserSettings } from '../interfaces';
import { getBrowserLocale, getClosestLocaleCode } from './helper';
import { browserDateLocale, dateLocale, dateLocaleCode, defaultDateLocale, localeCode, setDateLocales } from './index';
import { loadDateLocale } from './loadLocale';
import { locales } from './locales';

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
        const promises: any[] = [locales[newSafeLocaleCode]()];
        if (relocalizeDateFormat) {
            promises.push(loadDateLocale(newSafeLocaleCode, getBrowserLocale(), userSettings));
        }
        const [newTtagLocale] = await Promise.all(promises);
        if (!newTtagLocale) {
            return getLocalizedText();
        }
        ttagAddLocale(newSafeLocaleCode, newTtagLocale);
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
