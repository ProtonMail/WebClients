import { app } from "electron";
import { addLocale as ttagAddLocale, useLocale as ttagUseLocale } from "ttag";
import { DEFAULT_LOCALE } from "@proton/shared/lib/constants";
import { getClosestLocaleCode } from "@proton/shared/lib/i18n/helper";
import supportedLocales from "../../locales/config/locales.json";
import { getSettings, updateSettings } from "../store/settingsStore";

const loadedLocales = new Set<string>([DEFAULT_LOCALE]);
let currentLocaleCode = DEFAULT_LOCALE;

const loadTranslations = (localeCode: string) => import(/* webpackMode: "eager" */ `../../locales/${localeCode}.json`);

const applyLocale = async (localeCode: string) => {
    if (!loadedLocales.has(localeCode)) {
        const translations = await loadTranslations(localeCode);
        ttagAddLocale(localeCode, translations.default ?? translations);
        loadedLocales.add(localeCode);
    }

    ttagUseLocale(localeCode);
    currentLocaleCode = localeCode;
};

const getSupportedLocaleCode = (locale: string | undefined) => getClosestLocaleCode(locale, supportedLocales);

export const getStartupLocaleCode = () =>
    getSupportedLocaleCode(getSettings().locale ?? app.getPreferredSystemLanguages()[0]);

export const initializeLocale = () => applyLocale(getStartupLocaleCode());

export const setSessionLocale = async (locale: string) => {
    const localeCode = getSupportedLocaleCode(locale);

    if (localeCode === currentLocaleCode) {
        return false;
    }

    await applyLocale(localeCode);
    updateSettings({ locale: localeCode });
    return true;
};
