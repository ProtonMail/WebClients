export { getLangAttribute } from '@proton/shared/lib/i18n/helper';

export const getLanguage = (locale: string) => locale.split(/[_-]/)[0];

const localeMapping = {
    fr_FR: 'fr',
    en_US: 'en',
    es_LA: 'es',
    pt_PT: 'pt',
};

const getLanguageLocale = (locale: string) => {
    const result = localeMapping[locale as keyof typeof localeMapping] || locale;
    return result.replace('_', '-').toLowerCase();
};

export const getLocaleMap = (localeFiles: string[]) => {
    const ext = '.json';

    const getLocaleWithoutExt = (localePath: string) => {
        return localePath.replace(ext, '');
    };

    const map = localeFiles.reduce<{ [key: string]: string[] }>((acc, localePath) => {
        if (!localePath.endsWith(ext)) {
            return acc;
        }
        const fullLocale = getLocaleWithoutExt(localePath);
        const language = getLanguage(fullLocale);
        if (!acc[language]) {
            acc[language] = [];
        }
        acc[language].push(localePath);
        return acc;
    }, {});

    return localeFiles.reduce<{ [key: string]: string }>((acc, localePath) => {
        if (!localePath.endsWith(ext) || localePath.includes('en_US')) {
            return acc;
        }

        const fullLocale = getLocaleWithoutExt(localePath);
        const replacedLocale = getLanguageLocale(fullLocale);
        const language = getLanguage(replacedLocale);
        let shortLocale = language;
        if (map[language].length > 1) {
            shortLocale = replacedLocale;
        }

        acc[fullLocale] = shortLocale;

        return acc;
    }, {});
};

export default getLanguageLocale;
